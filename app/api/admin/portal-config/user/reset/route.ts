import { NextRequest, NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { getCurrentAuth, getRequestMeta } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePortalConfigAdmin, resetUserOverrides } from "@/lib/admin-portal-config";

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requirePortalConfigAdmin(auth))) {
    return NextResponse.json({ error: "Admin configuration permission required" }, { status: 403 });
  }

  try {
    const { userEmail } = (await request.json()) as { userEmail?: string };
    if (!userEmail || !userEmail.includes("@")) {
      return NextResponse.json({ error: "Select a valid user." }, { status: 400 });
    }

    const previousValue = await snapshotOverrideCounts(userEmail);
    const user = await prisma.$transaction((client) => resetUserOverrides(client, userEmail));

    const { ipAddress, browser } = getRequestMeta(request);
    await createAuditLog({
      user: auth.user,
      actionType: "ADMIN_PORTAL_USER_OVERRIDES_RESET",
      objectType: "PortalUserConfig",
      objectId: user.email,
      previousValue: JSON.stringify(previousValue),
      newValue: JSON.stringify({ resetToRoleDefaults: true }),
      ipAddress,
      browser,
      deviceId: auth.session.deviceId,
      sessionId: auth.session.sessionToken,
      remarks: `User-specific configuration reset for ${user.email}.`
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to reset user overrides" }, { status: 400 });
  }
}

async function snapshotOverrideCounts(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const [permissions, modules, widgets, categories, watermarks] = await Promise.all([
    prisma.userPermissionOverride.count({ where: { userId: user.id } }),
    prisma.moduleVisibility.count({ where: { userId: user.id } }),
    prisma.dashboardWidgetVisibility.count({ where: { userId: user.id } }),
    prisma.documentCategoryPermission.count({ where: { userId: user.id } }),
    prisma.watermarkPolicy.count({ where: { userId: user.id } })
  ]);
  return { permissions, modules, widgets, categories, watermarks };
}
