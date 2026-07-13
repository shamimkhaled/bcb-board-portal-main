import { UsersRound } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function CommitteesPage() {
  const auth = await requireAuth();
  await requireModule(auth.user, "committees");
  const committees = await prisma.committee.findMany({
    include: {
      chairperson: true,
      secretary: true,
      members: { include: { user: true } },
      meetings: true,
      documents: true
    }
  });

  return (
    <PageShell
      eyebrow="Committee Management"
      title="Committees"
      description="Create committees, assign chairs, secretaries and members, connect committee-specific meetings and documents, and support committee access control."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Committees" value={committees.length} detail="Active governance bodies" icon={UsersRound} tone="navy" />
        <MetricCard label="Members" value={committees.reduce((sum, committee) => sum + committee.members.length, 0)} detail="Committee assignments" icon={UsersRound} tone="green" />
        <MetricCard label="Committee documents" value={committees.reduce((sum, committee) => sum + committee.documents.length, 0)} detail="Access-controlled papers" icon={UsersRound} tone="gold" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {committees.map((committee) => (
          <Card key={committee.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-bcb-green">{committee.code}</p>
                  <CardTitle className="mt-2">{committee.name}</CardTitle>
                </div>
                <StatusBadge value={committee.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-slate-600">{committee.description}</p>
              <div className="rounded-lg border bg-slate-50 p-3 text-sm">
                <p><span className="font-semibold text-bcb-ink">Chair:</span> {committee.chairperson?.name}</p>
                <p><span className="font-semibold text-bcb-ink">Secretary:</span> {committee.secretary?.name}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-bcb-ink">Members</p>
                <div className="mt-2 space-y-2">
                  {committee.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm">
                      <span>{member.user.name}</span>
                      <span className="text-xs text-slate-500">{member.roleLabel}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg border bg-white p-3">
                  <p className="text-xl font-bold text-bcb-navy">{committee.meetings.length}</p>
                  <p className="text-xs text-slate-500">Meetings</p>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <p className="text-xl font-bold text-bcb-navy">{committee.documents.length}</p>
                  <p className="text-xs text-slate-500">Documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
