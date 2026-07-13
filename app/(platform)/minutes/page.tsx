import Link from "next/link";
import { NotebookTabs, UserCheck } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, safeJson } from "@/lib/utils";
import { requireModule } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function MinutesPage() {
  const auth = await requireAuth();
  await requireModule(auth.user, "minutes");
  const minutes = await prisma.minute.findMany({
    orderBy: { updatedAt: "desc" },
    include: { meeting: true, draftedBy: true, approvedBy: true }
  });
  const minuteDocument = await prisma.document.findFirst({
    where: { documentType: "Minutes" },
    orderBy: { officialDate: "desc" }
  });

  return (
    <PageShell
      eyebrow="Minutes Management"
      title="Minutes"
      description="Secretary drafts agenda-wise minutes after meetings, records attendance, decisions, action items, and submits to Chairman for approval, return, lock, and director acknowledgment."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Minutes records" value={minutes.length} detail="Draft, submitted, approved, and locked" icon={NotebookTabs} tone="navy" />
        <MetricCard label="Locked minutes" value={minutes.filter((minute) => minute.status === "LOCKED").length} detail="Final board record" icon={UserCheck} tone="green" />
        <MetricCard label="Pending approval" value={minutes.filter((minute) => ["SUBMITTED", "UNDER_REVIEW"].includes(minute.status)).length} detail="Chairman review queue" icon={NotebookTabs} tone="gold" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {minutes.map((minute) => (
          <Card key={minute.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-bcb-green">{minute.minutesCode}</p>
                  <CardTitle className="mt-2">{minute.meeting.title}</CardTitle>
                </div>
                <StatusBadge value={minute.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-slate-50 p-3">
                <p className="text-sm font-semibold text-bcb-ink">Attendance</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {safeJson<string[]>(minute.attendanceJson, []).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="rounded-lg border bg-white p-3">
                <p className="text-sm font-semibold text-bcb-ink">Agenda-wise discussion</p>
                <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
                  {safeJson<string[]>(minute.discussionJson, []).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <p className="text-xs text-slate-500">
                Drafted by {minute.draftedBy.name} · Approved by {minute.approvedBy?.name ?? "Pending"} · Meeting {formatDate(minute.meeting.date)}
              </p>
              {minuteDocument ? (
                <Link
                  href={`/documents/${minuteDocument.id}`}
                  className="inline-flex rounded-md bg-bcb-navy px-3 py-2 text-xs font-semibold text-white hover:bg-bcb-navy/90"
                >
                  Open secure minutes viewer
                </Link>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
