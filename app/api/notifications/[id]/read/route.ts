import { NextRequest, NextResponse } from "next/server";
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
  if (!(await hasPermission(auth.user, "notifications", "updateOwn"))) {
    return NextResponse.json({ error: "Notification permission required" }, { status: 403 });
  }
  const { id } = await context.params;

  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing || existing.userId !== auth.user.id) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  const notification = await prisma.notification.update({
    where: { id },
    data: { isRead: true }
  });

  const { ipAddress, browser } = getRequestMeta(request);
  await createAuditLog({
    user: auth.user,
    actionType: "NOTIFICATION_READ",
    objectType: "Notification",
    objectId: notification.id,
    ipAddress,
    browser,
    deviceId: auth.session.deviceId,
    sessionId: auth.session.sessionToken,
    result: "Success",
    remarks: "Notification marked as read."
  });

  return NextResponse.json({ ok: true });
}
