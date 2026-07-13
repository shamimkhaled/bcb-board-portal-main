import { NextRequest, NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import { getCurrentAuth, getRequestMeta } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePortalConfigAdmin, saveRoleConfig, validateRolePayload } from "@/lib/admin-portal-config";

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requirePortalConfigAdmin(auth))) {
    return NextResponse.json({ error: "Admin configuration permission required" }, { status: 403 });
  }

  try {
    const payload = validateRolePayload(await request.json());
    const previousValue = await snapshotRoleConfig(payload.role);

    await prisma.$transaction((client) => saveRoleConfig(client, payload));

    const { ipAddress, browser } = getRequestMeta(request);
    await createAuditLog({
      user: auth.user,
      actionType: "ADMIN_PORTAL_ROLE_CONFIG_UPDATED",
      objectType: "PortalConfig",
      objectId: payload.role,
      previousValue: JSON.stringify(previousValue),
      newValue: JSON.stringify(payload),
      ipAddress,
      browser,
      deviceId: auth.session.deviceId,
      sessionId: auth.session.sessionToken,
      remarks: `Role configuration updated for ${payload.role}.`
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save role configuration" }, { status: 400 });
  }
}

async function snapshotRoleConfig(role: Role) {
  const [permissions, modules, widgets, categories, watermarks] = await Promise.all([
    prisma.rolePermission.findMany({ where: { role }, include: { permission: true } }),
    prisma.moduleVisibility.findMany({ where: { role } }),
    prisma.dashboardWidgetVisibility.findMany({ where: { role } }),
    prisma.documentCategoryPermission.findMany({ where: { role } }),
    prisma.watermarkPolicy.findMany({ where: { role } })
  ]);

  return {
    permissions: permissions.map((row) => `${row.permission.resource}:${row.permission.action}:${row.effect}`),
    modules: modules.map((row) => `${row.moduleKey}:${row.effect}`),
    widgets: widgets.map((row) => `${row.widgetKey}:${row.effect}`),
    categories: categories.map((row) => `${row.category}:${row.action}:${row.effect}`),
    watermarks: watermarks.map((row) => `${row.category}:${row.enabled}:${row.opacity}:${row.density}`)
  };
}
