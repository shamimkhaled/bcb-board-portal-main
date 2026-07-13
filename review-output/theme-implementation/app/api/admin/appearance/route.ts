import { NextRequest, NextResponse } from "next/server";
import { AppearanceTheme, Role } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import { getCurrentAuth, getRequestMeta } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePortalConfigAdmin } from "@/lib/admin-portal-config";
import { SYSTEM_APPEARANCE_ID } from "@/lib/theme";

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requirePortalConfigAdmin(auth))) {
    return NextResponse.json({ error: "Admin configuration permission required" }, { status: 403 });
  }

  const body = (await request.json()) as {
    systemDefaultTheme?: AppearanceTheme;
    allowUserThemeSelection?: boolean;
    roleDefaults?: Partial<Record<Role, AppearanceTheme>>;
  };

  if (!body.systemDefaultTheme || !Object.values(AppearanceTheme).includes(body.systemDefaultTheme)) {
    return NextResponse.json({ error: "Invalid system default theme." }, { status: 400 });
  }
  if (typeof body.allowUserThemeSelection !== "boolean") {
    return NextResponse.json({ error: "Invalid user-selection setting." }, { status: 400 });
  }

  const previous = await prisma.portalAppearanceSetting.findUnique({ where: { id: SYSTEM_APPEARANCE_ID } });
  const previousRoles = await prisma.roleAppearanceSetting.findMany();
  const previousRoleMap = new Map(previousRoles.map((row) => [row.role, row.defaultTheme]));

  await prisma.$transaction(async (client) => {
    await client.portalAppearanceSetting.upsert({
      where: { id: SYSTEM_APPEARANCE_ID },
      update: {
        systemDefaultTheme: body.systemDefaultTheme,
        allowUserThemeSelection: body.allowUserThemeSelection,
        updatedById: auth.user.id
      },
      create: {
        id: SYSTEM_APPEARANCE_ID,
        systemDefaultTheme: body.systemDefaultTheme,
        allowUserThemeSelection: body.allowUserThemeSelection,
        updatedById: auth.user.id
      }
    });

    for (const [role, defaultTheme] of Object.entries(body.roleDefaults ?? {})) {
      if (!Object.values(Role).includes(role as Role) || !Object.values(AppearanceTheme).includes(defaultTheme)) continue;
      await client.roleAppearanceSetting.upsert({
        where: { role: role as Role },
        update: { defaultTheme },
        create: { role: role as Role, defaultTheme }
      });
    }
  });

  const { ipAddress, browser } = getRequestMeta(request);
  if (previous?.systemDefaultTheme !== body.systemDefaultTheme) {
    await createAuditLog({
      user: auth.user,
      actionType: "PORTAL_THEME_SYSTEM_DEFAULT_CHANGED",
      objectType: "PortalAppearanceSetting",
      objectId: SYSTEM_APPEARANCE_ID,
      previousValue: previous?.systemDefaultTheme ?? null,
      newValue: body.systemDefaultTheme,
      ipAddress,
      browser,
      deviceId: auth.session.deviceId,
      sessionId: auth.session.sessionToken,
      result: "Success",
      remarks: "System default theme changed."
    });
  }

  if (previous?.allowUserThemeSelection !== body.allowUserThemeSelection) {
    await createAuditLog({
      user: auth.user,
      actionType: body.allowUserThemeSelection ? "PORTAL_THEME_USER_SELECTION_ENABLED" : "PORTAL_THEME_USER_SELECTION_LOCKED",
      objectType: "PortalAppearanceSetting",
      objectId: SYSTEM_APPEARANCE_ID,
      previousValue: String(previous?.allowUserThemeSelection ?? true),
      newValue: String(body.allowUserThemeSelection),
      ipAddress,
      browser,
      deviceId: auth.session.deviceId,
      sessionId: auth.session.sessionToken,
      result: "Success",
      remarks: "User theme selection policy changed."
    });
  }

  for (const [role, defaultTheme] of Object.entries(body.roleDefaults ?? {})) {
    const previousTheme = previousRoleMap.get(role as Role);
    if (previousTheme && previousTheme !== defaultTheme) {
      await createAuditLog({
        user: auth.user,
        actionType: "PORTAL_THEME_ROLE_DEFAULT_CHANGED",
        objectType: "RoleAppearanceSetting",
        objectId: role,
        previousValue: previousTheme,
        newValue: defaultTheme,
        ipAddress,
        browser,
        deviceId: auth.session.deviceId,
        sessionId: auth.session.sessionToken,
        result: "Success",
        remarks: `Role default theme changed for ${role}.`
      });
    }
  }

  return NextResponse.json({ ok: true });
}
