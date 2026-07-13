import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth, getRequestMeta } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  auditPortalConfigurationChange,
  requirePortalConfigurationAdmin,
  snapshotRolePortalConfiguration,
  updateRolePortalConfiguration,
  validateRolePortalPayload
} from "@/lib/portal-configuration";

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requirePortalConfigurationAdmin(auth))) {
    return NextResponse.json({ error: "Admin configuration permission required" }, { status: 403 });
  }

  try {
    const payload = validateRolePortalPayload(await request.json());
    const previousValue = await snapshotRolePortalConfiguration(payload.role);
    await prisma.$transaction((client) => updateRolePortalConfiguration(client, payload));
    const newValue = await snapshotRolePortalConfiguration(payload.role);
    const meta = getRequestMeta(request);

    await auditPortalConfigurationChange({
      auth,
      actionType: "ADMIN_PORTAL_ROLE_PRESET_CHANGED",
      objectType: "PortalRolePreset",
      objectId: payload.role,
      previousValue,
      newValue,
      meta
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save role preset" }, { status: 400 });
  }
}
