import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth, getRequestMeta } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  auditPortalConfigurationChange,
  requirePortalConfigurationAdmin,
  snapshotUserPortalConfiguration,
  updateUserPortalOverride,
  validateUserPortalPayload
} from "@/lib/portal-configuration";

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requirePortalConfigurationAdmin(auth))) {
    return NextResponse.json({ error: "Admin configuration permission required" }, { status: 403 });
  }

  try {
    const payload = validateUserPortalPayload(await request.json());
    const previousValue = await snapshotUserPortalConfiguration(payload.userEmail);
    const user = await prisma.$transaction((client) => updateUserPortalOverride(client, payload));
    const newValue = await snapshotUserPortalConfiguration(payload.userEmail);
    const meta = getRequestMeta(request);

    await auditPortalConfigurationChange({
      auth,
      actionType: previousValue ? "ADMIN_PORTAL_USER_OVERRIDE_CHANGED" : "ADMIN_PORTAL_USER_OVERRIDE_CREATED",
      objectType: "PortalUserOverride",
      objectId: user.email,
      previousValue,
      newValue,
      meta
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save user override" }, { status: 400 });
  }
}
