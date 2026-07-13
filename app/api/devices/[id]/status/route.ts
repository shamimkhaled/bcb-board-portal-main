import { NextRequest, NextResponse } from "next/server";
import { DeviceStatus } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import { getCurrentAuth, getRequestMeta } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await hasPermission(auth.user, "devices", "manage"))) {
    return NextResponse.json({ error: "Device management permission required" }, { status: 403 });
  }

  const { status } = (await request.json()) as { status?: DeviceStatus };
  if (!status || !Object.values(DeviceStatus).includes(status)) {
    return NextResponse.json({ error: "Invalid device status" }, { status: 400 });
  }

  const { id } = await context.params;
  const existing = await prisma.device.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Device not found" }, { status: 404 });

  const device = await prisma.device.update({
    where: { id },
    data: { status }
  });
  const { ipAddress, browser } = getRequestMeta(request);
  await createAuditLog({
    user: auth.user,
    actionType: status === "REVOKED" ? "DEVICE_REVOKED" : "DEVICE_AUTHORIZED",
    objectType: "Device",
    objectId: device.id,
    previousValue: existing.status,
    newValue: device.status,
    ipAddress,
    browser,
    deviceId: auth.session.deviceId,
    sessionId: auth.session.sessionToken,
    result: "Success",
    remarks: `Device ${device.deviceId} marked ${device.status}.`
  });

  return NextResponse.json({ ok: true });
}
