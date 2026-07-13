import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { PortalConfigAdmin } from "@/components/admin/portal-config-admin";
import { AdminAppearanceForm } from "@/components/theme/admin-appearance-form";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminPortalConfig, requirePortalConfigAdmin } from "@/lib/admin-portal-config";
import { requireAuth } from "@/lib/auth";
import { defaultRoleThemes, getSystemThemeSettings, type AppearanceThemeKey } from "@/lib/theme";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPortalConfigPage() {
  const auth = await requireAuth();
  if (!(await requirePortalConfigAdmin(auth))) notFound();

  const [config, systemAppearance, roleAppearanceRows] = await Promise.all([
    getAdminPortalConfig(),
    getSystemThemeSettings(),
    prisma.roleAppearanceSetting.findMany()
  ]);
  const roleDefaults = Object.values(Role).reduce(
    (acc, role) => {
      acc[role] = (roleAppearanceRows.find((row) => row.role === role)?.defaultTheme ?? defaultRoleThemes[role]) as AppearanceThemeKey;
      return acc;
    },
    {} as Record<Role, AppearanceThemeKey>
  );

  return (
    <PageShell
      eyebrow="Admin Panel"
      title="Portal Configuration"
      description="Role permissions, module visibility, dashboard widgets, user-specific overrides, document-category access, and secure viewer watermark policies."
    >
      <div className="space-y-6">
        <PortalConfigAdmin config={config} />
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Configure the system default theme, role defaults, and whether users may choose a personal theme.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminAppearanceForm
              systemDefaultTheme={systemAppearance.systemDefaultTheme}
              allowUserThemeSelection={systemAppearance.allowUserThemeSelection}
              roleDefaults={roleDefaults}
            />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
