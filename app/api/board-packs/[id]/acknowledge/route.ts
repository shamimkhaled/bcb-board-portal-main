import { randomUUID } from "node:crypto";
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
  if (!(await hasPermission(auth.user, "boardPacks", "acknowledge"))) {
    return NextResponse.json({ error: "Board pack acknowledgment permission required" }, { status: 403 });
  }
  if (auth.device?.status === "REVOKED") {
    return NextResponse.json({ error: "Device revoked" }, { status: 403 });
  }

  const { id } = await context.params;
  const pack = await prisma.boardPack.findUnique({ where: { id } });
  if (!pack) return NextResponse.json({ error: "Board pack not found" }, { status: 404 });

  const { ipAddress, browser } = getRequestMeta(request);
  await prisma.readAcknowledgment.create({
    data: {
      id: `pack-ack-${randomUUID()}`,
      userId: auth.user.id,
      boardPackId: pack.id,
      type: "ACK",
      sessionId: auth.session.sessionToken
    }
  });
  await createAuditLog({
    user: auth.user,
    actionType: "BOARD_PACK_ACKNOWLEDGED",
    objectType: "BoardPack",
    objectId: pack.id,
    ipAddress,
    browser,
    deviceId: auth.session.deviceId,
    sessionId: auth.session.sessionToken,
    result: "Success",
    remarks: "Full board pack acknowledgment recorded."
  });

  return NextResponse.json({ ok: true });
}
