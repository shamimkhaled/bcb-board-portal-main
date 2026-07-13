import { notFound } from "next/navigation";
import { PortalVisibilityAdmin } from "@/components/admin/portal-visibility-admin";
import { PageShell } from "@/components/page-shell";
import { requireAuth } from "@/lib/auth";
import { getPortalConfigurationAdminData, requirePortalConfigurationAdmin } from "@/lib/portal-configuration";

export const dynamic = "force-dynamic";

export default async function RolePresetsPage() {
  const auth = await requireAuth();
  if (!(await requirePortalConfigurationAdmin(auth))) notFound();
  const data = await getPortalConfigurationAdminData();

  return (
    <PageShell eyebrow="Admin · Portal Configuration" title="Role Presets" description="Declutter and personalize default portals by role.">
      <PortalVisibilityAdmin data={data} section="roles" />
    </PageShell>
  );
}
