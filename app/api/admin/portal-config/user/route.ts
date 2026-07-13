import { NextRequest, NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { getCurrentAuth, getRequestMeta } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePortalConfigAdmin, saveUserOverrides, validateUserPayload } from "@/lib/admin-portal-config";

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requirePortalConfigAdmin(auth))) {
    return NextResponse.json({ error: "Admin configuration permission required" }, { status: 403 });
  }

  try {
    const payload = validateUserPayload(await request.json());
    const previousValue = await snapshotUserOverrides(payload.userEmail);
    const user = await prisma.$transaction((client) => saveUserOverrides(client, payload));

    const { ipAddress, browser } = getRequestMeta(request);
    await createAuditLog({
      user: auth.user,
      actionType: "ADMIN_PORTAL_USER_OVERRIDES_UPDATED",
      objectType: "PortalUserConfig",
      objectId: payload.userEmail,
      previousValue: JSON.stringify(previousValue),
      newValue: JSON.stringify(payload),
      ipAddress,
      browser,
      deviceId: auth.session.deviceId,
      sessionId: auth.session.sessionToken,
      remarks: `User-specific configuration updated for ${user.email}.`
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save user overrides" }, { status: 400 });
  }
}

async function snapshotUserOverrides(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const [permissions, modules, widgets, categories, watermarks] = await Promise.all([
    prisma.userPermissionOverride.findMany({ where: { userId: user.id }, include: { permission: true } }),
    prisma.moduleVisibility.findMany({ where: { userId: user.id } }),
    prisma.dashboardWidgetVisibility.findMany({ where: { userId: user.id } }),
    prisma.documentCategoryPermission.findMany({ where: { userId: user.id } }),
    prisma.watermarkPolicy.findMany({ where: { userId: user.id } })
  ]);

  return {
    permissions: permissions.map((row) => `${row.permission.resource}:${row.permission.action}:${row.effect}`),
    modules: modules.map((row) => `${row.moduleKey}:${row.effect}`),
    widgets: widgets.map((row) => `${row.widgetKey}:${row.effect}`),
    categories: categories.map((row) => `${row.category}:${row.action}:${row.effect}`),
    watermarks: watermarks.map((row) => `${row.category}:${row.enabled}:${row.opacity}:${row.density}`)
  };
}
