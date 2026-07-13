import Link from "next/link";
import { Search, Signature } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, safeJson } from "@/lib/utils";
import { requireModule } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function ResolutionsPage() {
  const auth = await requireAuth();
  await requireModule(auth.user, "resolutions");
  const resolutions = await prisma.resolution.findMany({
    orderBy: { dateApproved: "desc" },
    include: { meeting: true, agendaItem: true, document: true, actionItems: true }
  });

  return (
    <PageShell
      eyebrow="Resolution Tracker"
      title="Resolutions"
      description="Generate resolutions from approved minutes, link to agenda items, documents, and action items, and track publication through implementation."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Resolutions" value={resolutions.length} detail="Board and committee decisions" icon={Signature} tone="navy" />
        <MetricCard label="Published" value={resolutions.filter((resolution) => resolution.status === "PUBLISHED").length} detail="Available in resolution register" icon={Signature} tone="green" />
        <MetricCard label="Linked actions" value={resolutions.reduce((sum, resolution) => sum + resolution.actionItems.length, 0)} detail="Implementation items" icon={Search} tone="gold" />
      </div>

      <div className="space-y-4">
        {resolutions.map((resolution) => (
          <Card key={resolution.id}>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-bcb-green">{resolution.resolutionNumber}</p>
                  <CardTitle className="mt-2">{resolution.title}</CardTitle>
                  <p className="mt-2 text-sm text-slate-500">{resolution.meeting.title} · {formatDate(resolution.dateApproved)}</p>
                </div>
                <StatusBadge value={resolution.status} />
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[1fr_300px]">
              <div>
                <p className="text-sm leading-6 text-slate-700">{resolution.decisionSummary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {resolution.document ? (
                    <Link
                      href={`/documents/${resolution.document.id}`}
                      className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-bcb-green"
                    >
                      {resolution.document.documentId}
                    </Link>
                  ) : null}
                  {resolution.agendaItem ? <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">Agenda {resolution.agendaItem.itemNumber}</span> : null}
                  <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">{resolution.responsiblePerson}</span>
                </div>
              </div>
              <div className="rounded-lg border bg-slate-50 p-3">
                <p className="text-sm font-semibold text-bcb-ink">Timeline</p>
                <div className="mt-2 space-y-1">
                  {safeJson<string[]>(resolution.timelineJson, []).map((event) => (
                    <p key={event} className="text-xs leading-5 text-slate-600">{event}</p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
