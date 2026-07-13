import { AlertTriangle, ListChecks } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { requireModule } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function ActionItemsPage() {
  const auth = await requireAuth();
  await requireModule(auth.user, "action-items");
  const actions = await prisma.actionItem.findMany({
    orderBy: { dueDate: "asc" },
    include: { responsibleUser: true, meeting: true, agendaItem: true, resolution: true, supportingDocument: true }
  });

  return (
    <PageShell
      eyebrow="Action Item Tracking"
      title="Action Items"
      description="Create action items from meeting decisions and resolutions, assign responsible people, manage due dates, reminders, overdue badges, completion notes, and closure approval."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Action items" value={actions.length} detail="Open, in progress, completed, and closed" icon={ListChecks} tone="navy" />
        <MetricCard label="Overdue" value={actions.filter((action) => action.status === "OVERDUE").length} detail="Needs escalation" icon={AlertTriangle} tone="red" />
        <MetricCard label="Completed or closed" value={actions.filter((action) => ["COMPLETED", "CLOSED"].includes(action.status)).length} detail="Closure evidence retained" icon={ListChecks} tone="green" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Implementation Register</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-500">
              <tr>
                <th className="py-3 pr-4">Action</th>
                <th className="py-3 pr-4">Responsible</th>
                <th className="py-3 pr-4">Department / committee</th>
                <th className="py-3 pr-4">Due</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Resolution</th>
                <th className="py-3">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action) => (
                <tr key={action.id} className="border-b last:border-0">
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-bcb-ink">{action.title}</p>
                    <p className="text-xs text-slate-500">{action.actionCode}</p>
                  </td>
                  <td className="py-3 pr-4">{action.responsibleUser.name}</td>
                  <td className="py-3 pr-4">{action.departmentCommittee}</td>
                  <td className="py-3 pr-4">{formatDate(action.dueDate)}</td>
                  <td className="py-3 pr-4"><StatusBadge value={action.status} /></td>
                  <td className="py-3 pr-4">{action.resolution?.resolutionNumber ?? "Decision item"}</td>
                  <td className="py-3">{action.supportingDocument?.documentId ?? "Pending"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </PageShell>
  );
}
