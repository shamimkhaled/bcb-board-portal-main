import { UserCheck } from "lucide-react";
import { AccessRequestControls } from "@/components/access-request-controls";
import { PageShell } from "@/components/page-shell";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";
import { hasPermission, requireModule } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AccessRequestsPage() {
  const auth = await requireAuth();
  await requireModule(auth.user, "access-requests");
  const requests = await prisma.accessRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { document: true, requestedBy: true, approvedBy: true }
  });
  const canDecide = await hasPermission(auth.user, "accessRequests", "decide");

  return (
    <PageShell
      eyebrow="Access Request Workflow"
      title="Access Requests"
      description="Users request restricted document access with a reason and time window; Secretary/Admin approvals are time-bound, auditable, and expire automatically in the demo model."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Requests" value={requests.length} detail="Pending, approved, rejected, expired, revoked" icon={UserCheck} tone="navy" />
        <MetricCard label="Pending" value={requests.filter((request) => request.status === "PENDING").length} detail="Awaiting Secretary/Admin decision" icon={UserCheck} tone="gold" />
        <MetricCard label="Approved" value={requests.filter((request) => request.status === "APPROVED").length} detail="Time-bound access grants" icon={UserCheck} tone="green" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Restricted Access Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="rounded-lg border bg-white p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase text-bcb-green">{request.requestCode}</span>
                    <StatusBadge value={request.status} />
                  </div>
                  <p className="mt-2 font-semibold text-bcb-ink">{request.document.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Requested by {request.requestedBy.name} · {request.requestedAccessDuration} · {formatDateTime(request.createdAt)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{request.reason}</p>
                </div>
                <div className="space-y-2 lg:text-right">
                  <p className="text-xs text-slate-500">Expiry: {formatDate(request.expiryDate)}</p>
                  <p className="text-xs text-slate-500">Approved by: {request.approvedBy?.name ?? "Pending"}</p>
                  {canDecide && request.status === "PENDING" ? <AccessRequestControls requestId={request.id} /> : null}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}
