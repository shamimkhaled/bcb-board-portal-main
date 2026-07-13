import type { AppearanceTheme, Role } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import type { AuthContext } from "@/lib/auth";

type AuditMeta = {
  ipAddress: string;
  browser: string;
};

export async function auditRoleAppearanceChanges({
  auth,
  previousRoleMap,
  roleDefaults,
  meta
}: {
  auth: AuthContext;
  previousRoleMap: Map<Role, AppearanceTheme>;
  roleDefaults: Partial<Record<Role, AppearanceTheme>>;
  meta: AuditMeta;
}) {
  for (const [role, defaultTheme] of Object.entries(roleDefaults)) {
    const previousTheme = previousRoleMap.get(role as Role);
    if (previousTheme !== defaultTheme) {
      await createAuditLog({
        user: auth.user,
        actionType: previousTheme ? "PORTAL_THEME_ROLE_DEFAULT_CHANGED" : "PORTAL_THEME_ROLE_DEFAULT_CREATED",
        objectType: "RoleAppearanceSetting",
        objectId: role,
        previousValue: previousTheme ?? null,
        newValue: defaultTheme,
        ipAddress: meta.ipAddress,
        browser: meta.browser,
        deviceId: auth.session.deviceId,
        sessionId: auth.session.sessionToken,
        result: "Success",
        remarks: previousTheme ? `Role default theme changed for ${role}.` : `Role default theme created for ${role}.`
      });
    }
  }
}
