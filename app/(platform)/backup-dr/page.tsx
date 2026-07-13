import { DatabaseBackup, HardDrive, RotateCcw, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { requireModule } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function BackupDrPage() {
  const auth = await requireAuth();
  await requireModule(auth.user, "backup-dr");
  const backup = await prisma.backupStatus.findFirst({ orderBy: { createdAt: "desc" } });

  return (
    <PageShell
      eyebrow="Backup & Disaster Recovery"
      title="Backup & DR"
      description="Simulated posture dashboard for database backup, document backup, audit-log backup, restore tests, edge node sync status, storage usage, DR readiness score, and retention policy."
    >
      {backup ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Backup status" value={backup.backupStatus} detail="Latest simulated cycle" icon={DatabaseBackup} tone="green" />
            <MetricCard label="Restore test" value={backup.restoreTestStatus.split(" ")[0]} detail={backup.restoreTestStatus} icon={RotateCcw} tone="navy" />
            <MetricCard label="Storage usage" value={`${backup.storageUsagePercent}%`} detail="Local MVP storage simulation" icon={HardDrive} tone="gold" />
            <MetricCard label="DR score" value={`${backup.drReadinessScore}/100`} detail="Readiness posture" icon={ShieldCheck} tone="green" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Backup Control Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {[
                ["Last database backup", formatDateTime(backup.databaseBackupAt)],
                ["Last document backup", formatDateTime(backup.documentBackupAt)],
                ["Last audit log backup", formatDateTime(backup.auditBackupAt)],
                ["Edge node sync status", backup.edgeNodeSyncStatus],
                ["Retention policy summary", backup.retentionSummary],
                ["Backup status", backup.backupStatus]
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border bg-white p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-bcb-ink">{value}</p>
                </div>
              ))}
              <div className="rounded-lg border bg-emerald-50 p-4 md:col-span-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-emerald-900">Status badge</p>
                  <StatusBadge value={backup.backupStatus} />
                </div>
                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  This is a simulation only for the laptop MVP. Production would integrate encrypted object storage,
                  immutable audit export, off-site backup, tested restore runbooks, and formal RPO/RTO controls.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </PageShell>
  );
}
