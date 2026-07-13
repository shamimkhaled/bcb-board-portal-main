import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth, getRequestMeta } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  auditPortalConfigurationChange,
  requirePortalConfigurationAdmin,
  resetUserPortalOverrides,
  snapshotUserPortalConfiguration
} from "@/lib/portal-configuration";

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requirePortalConfigurationAdmin(auth))) {
    return NextResponse.json({ error: "Admin configuration permission required" }, { status: 403 });
  }

  try {
    const { userEmail } = (await request.json()) as { userEmail?: string };
    if (!userEmail || !userEmail.includes("@")) throw new Error("Select a valid user.");
    const previousValue = await snapshotUserPortalConfiguration(userEmail);
    const user = await prisma.$transaction((client) => resetUserPortalOverrides(client, userEmail));
    const meta = getRequestMeta(request);

    await auditPortalConfigurationChange({
      auth,
      actionType: "ADMIN_PORTAL_USER_OVERRIDE_RESET",
      objectType: "PortalUserOverride",
      objectId: user.email,
      previousValue,
      newValue: { resetToRoleDefaults: true },
      meta
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to reset user override" }, { status: 400 });
  }
}
