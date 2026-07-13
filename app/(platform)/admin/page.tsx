import Link from "next/link";
import { MonitorSmartphone, ShieldCheck, SlidersHorizontal, UsersRound } from "lucide-react";
import { DeviceStatusControls } from "@/components/device-status-controls";
import { PageShell } from "@/components/page-shell";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { role } from "@/lib/labels";
import { formatDateTime } from "@/lib/utils";
import { hasPermission, requireModule, requirePermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const auth = await requireAuth();
  await requireModule(auth.user, "admin");
  await requirePermission(auth.user, "admin", "view");
  const [users, devices, committees, documents, auditCount, backup] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.device.findMany({ include: { user: true }, orderBy: { lastSeenAt: "desc" } }),
    prisma.committee.findMany(),
    prisma.document.findMany(),
    prisma.auditLog.count(),
    prisma.backupStatus.findFirst({ orderBy: { createdAt: "desc" } })
  ]);
  const isAdmin = await hasPermission(auth.user, "admin", "manage");

  return (
    <PageShell
      eyebrow="Admin Panel"
      title="Admin"
      description="User management, role management, committee setup, document categories, confidentiality levels, retention policy, device management, access control overview, audit logs, backup posture, and reports."
    >
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Users" value={users.length} detail="Seeded demo identities" icon={UsersRound} tone="navy" />
        <MetricCard label="Devices" value={devices.length} detail="Trusted, untrusted, revoked" icon={MonitorSmartphone} tone="green" />
        <MetricCard label="Audit events" value={auditCount} detail="Admin can view but not delete" icon={ShieldCheck} tone="gold" />
        <MetricCard label="Documents" value={documents.length} detail="Category and retention setup" icon={ShieldCheck} tone="red" />
      </div>

      {isAdmin ? (
        <Card className="border-bcb-gold/50 bg-amber-50">
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-bcb-gold" />
                Portal Configuration
              </CardTitle>
              <p className="text-sm text-amber-900">
                Manage role permissions, visibility rules, user overrides, document-category access, watermark policies, and portal decluttering.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                ["/admin/portal-configuration/roles", "Role presets"],
                ["/admin/portal-configuration/modules", "Modules"],
                ["/admin/portal-configuration/widgets", "Widgets"],
                ["/admin/portal-configuration/users", "User overrides"],
                ["/admin/config", "Security config"]
              ].map(([href, text]) => (
                <Link
                  key={href}
                  href={href}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-bcb-navy px-4 text-sm font-semibold text-white hover:bg-bcb-navy/90 focus:outline-none focus:ring-2 focus:ring-bcb-gold"
                >
                  {text}
                </Link>
              ))}
            </div>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>User and Role Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm">
                <div>
                  <p className="font-semibold text-bcb-ink">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{role(user.role)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {devices.map((device) => (
              <div key={device.id} className="rounded-lg border bg-white p-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-bcb-ink">{device.label}</p>
                    <p className="text-xs text-slate-500">{device.deviceId} · {device.user.name}</p>
                    <p className="text-xs text-slate-500">Last seen {formatDateTime(device.lastSeenAt)}</p>
                  </div>
                  <div className="space-y-2">
                    <StatusBadge value={device.status} />
                    {isAdmin ? <DeviceStatusControls deviceId={device.id} /> : null}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Setup Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {[
              ["Committees", committees.length],
              ["Document categories", new Set(documents.map((document) => document.documentType)).size],
              ["Confidentiality levels", 5],
              ["Retention policies", 6]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border bg-slate-50 p-3">
                <p className="text-2xl font-bold text-bcb-navy">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backup / Access / Audit Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-900">Backup posture</p>
              <p className="mt-1 text-sm text-emerald-800">{backup?.backupStatus ?? "Not available"} · DR {backup?.drReadinessScore ?? 0}/100</p>
            </div>
            <div className="rounded-lg border bg-slate-50 p-4">
              <p className="text-sm font-semibold text-bcb-ink">Admin constraints</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Audit logs are intentionally view-only in the UI. Device trust and revocation are logged into the hash chain.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
