import { ShieldAlert, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { requireAuth } from "@/lib/auth";
import { verifyAuditChain } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { requireModule } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  const auth = await requireAuth();
  await requireModule(auth.user, "audit-logs");
  const logs = await prisma.auditLog.findMany({ orderBy: { sequence: "asc" } });
  const verification = verifyAuditChain(logs);

  return (
    <PageShell
      eyebrow="Tamper-resistant Audit Demo"
      title="Audit Logs"
      description="Hash-chained audit records for logins, failed login attempts, uploads, document views, approvals, access changes, device authorization, backup, and archive QC."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Audit events" value={logs.length} detail="Admin can view but not delete" icon={ShieldCheck} tone="navy" />
        <MetricCard label="Integrity" value={verification.verified ? "Verified" : "Warning"} detail={verification.message} icon={verification.verified ? ShieldCheck : ShieldAlert} tone={verification.verified ? "green" : "red"} />
        <MetricCard label="Warnings" value={logs.filter((log) => log.result === "Warning").length} detail="Retained security events" icon={ShieldAlert} tone="gold" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Hash Chain</CardTitle>
            <StatusBadge value={verification.verified ? "Integrity Verified" : "Tamper Warning"} />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-500">
              <tr>
                <th className="py-3 pr-4">Seq</th>
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">User</th>
                <th className="py-3 pr-4">Action</th>
                <th className="py-3 pr-4">Object</th>
                <th className="py-3 pr-4">Document</th>
                <th className="py-3 pr-4">Device</th>
                <th className="py-3 pr-4">Result</th>
                <th className="py-3 pr-4">Hash</th>
                <th className="py-3">Previous</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice().reverse().map((log) => (
                <tr key={log.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-semibold text-bcb-navy">{log.sequence}</td>
                  <td className="py-3 pr-4">{formatDateTime(log.createdAt)}</td>
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-bcb-ink">{log.userName}</p>
                    <p className="text-xs text-slate-500">{log.role}</p>
                  </td>
                  <td className="py-3 pr-4">{log.actionType}</td>
                  <td className="py-3 pr-4">{log.objectType}</td>
                  <td className="py-3 pr-4">{log.documentId ?? "N/A"}</td>
                  <td className="py-3 pr-4">{log.deviceId}</td>
                  <td className="py-3 pr-4"><StatusBadge value={log.result} /></td>
                  <td className="py-3 pr-4 font-mono text-xs">{log.hash.slice(0, 16)}...</td>
                  <td className="py-3 font-mono text-xs">{log.previousHash.slice(0, 16)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </PageShell>
  );
}
