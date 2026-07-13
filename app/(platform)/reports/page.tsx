import { BarChart3, ClipboardCheck, ShieldAlert } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, percent } from "@/lib/utils";
import { requireModule } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const auth = await requireAuth();
  await requireModule(auth.user, "reports");
  const [
    meetings,
    memos,
    packs,
    minutes,
    requests,
    archive,
    documents,
    users,
    audits,
    resolutions,
    actions,
    backup
  ] = await Promise.all([
    prisma.meeting.findMany({ orderBy: { date: "asc" } }),
    prisma.memo.findMany(),
    prisma.boardPack.findMany({ include: { readAcknowledgments: true, meeting: true } }),
    prisma.minute.findMany({ include: { meeting: true } }),
    prisma.accessRequest.findMany({ include: { document: true, requestedBy: true } }),
    prisma.archiveRecord.findMany(),
    prisma.document.findMany(),
    prisma.user.findMany(),
    prisma.auditLog.findMany({ orderBy: { sequence: "desc" }, take: 10 }),
    prisma.resolution.findMany(),
    prisma.actionItem.findMany({ include: { responsibleUser: true } }),
    prisma.backupStatus.findFirst({ orderBy: { createdAt: "desc" } })
  ]);

  const categoryCounts = documents.reduce<Record<string, number>>((acc, document) => {
    acc[document.documentType] = (acc[document.documentType] ?? 0) + 1;
    return acc;
  }, {});
  const archiveByYear = archive.reduce<Record<number, number>>((acc, record) => {
    acc[record.year] = (acc[record.year] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <PageShell
      eyebrow="Reports"
      title="Reports"
      description="Executive report suite for meetings, agenda approvals, board pack read status, minutes approvals, access requests, archive progress, user activity, audit, resolutions, overdue actions, backup, and security events."
    >
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Upcoming meetings" value={meetings.filter((meeting) => meeting.date >= new Date()).length} detail="Board, AGM, committee" icon={ClipboardCheck} tone="navy" />
        <MetricCard label="Pending access" value={requests.filter((request) => request.status === "PENDING").length} detail="Restricted document decisions" icon={ShieldAlert} tone="gold" />
        <MetricCard label="Overdue actions" value={actions.filter((action) => action.status === "OVERDUE").length} detail="Needs follow-up" icon={ShieldAlert} tone="red" />
        <MetricCard label="DR readiness" value={`${backup?.drReadinessScore ?? 0}/100`} detail="Simulated posture score" icon={BarChart3} tone="green" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Meetings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {meetings.slice(0, 6).map((meeting) => (
              <div key={meeting.id} className="flex items-center justify-between rounded-lg border bg-white p-3">
                <div>
                  <p className="text-sm font-semibold text-bcb-ink">{meeting.title}</p>
                  <p className="text-xs text-slate-500">{formatDate(meeting.date)} · {meeting.time}</p>
                </div>
                <StatusBadge value={meeting.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Board Pack Read / Ack</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {packs.map((pack) => {
              const ackCount = pack.readAcknowledgments.filter((ack) => ack.type === "ACK").length;
              return (
                <div key={pack.id} className="rounded-lg border bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-bcb-ink">{pack.meeting.title}</p>
                    <StatusBadge value={pack.status} />
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-bcb-green" style={{ width: `${percent(ackCount, 5)}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{ackCount} acknowledgment events</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents by Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(categoryCounts).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between rounded-md border bg-slate-50 px-3 py-2 text-sm">
                <span className="font-medium text-slate-700">{category}</span>
                <span className="font-bold text-bcb-navy">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Archive Progress by Year</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(archiveByYear).map(([year, count]) => (
              <div key={year} className="flex items-center justify-between rounded-md border bg-slate-50 px-3 py-2 text-sm">
                <span className="font-medium text-slate-700">{year}</span>
                <span className="font-bold text-bcb-navy">{count} records</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Governance Queues</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {[
              ["Pending agenda approvals", memos.filter((memo) => memo.status === "CHAIRMAN_APPROVAL_PENDING").length],
              ["Pending minutes approvals", minutes.filter((minute) => ["SUBMITTED", "UNDER_REVIEW"].includes(minute.status)).length],
              ["Resolution status items", resolutions.length],
              ["User activity report users", users.length]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border bg-white p-3">
                <p className="text-2xl font-bold text-bcb-navy">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security and Audit Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {audits.map((audit) => (
              <div key={audit.id} className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm">
                <span className="font-medium text-slate-700">{audit.actionType}</span>
                <StatusBadge value={audit.result} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
