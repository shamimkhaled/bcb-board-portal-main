import { NextRequest, NextResponse } from "next/server";
import { AccessStatus } from "@prisma/client";
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
  if (!(await hasPermission(auth.user, "accessRequests", "decide"))) {
    return NextResponse.json({ error: "Access decision permission required" }, { status: 403 });
  }

  const { decision } = (await request.json()) as { decision?: "approve" | "reject" };
  if (decision !== "approve" && decision !== "reject") {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  const { id } = await context.params;
  const existing = await prisma.accessRequest.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Access request not found" }, { status: 404 });

  const status = decision === "approve" ? AccessStatus.APPROVED : AccessStatus.REJECTED;
  const accessRequest = await prisma.accessRequest.update({
    where: { id },
    data: {
      status,
      approvedById: auth.user.id,
      expiryDate:
        status === AccessStatus.APPROVED
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          : null
    }
  });

  const { ipAddress, browser } = getRequestMeta(request);
  await createAuditLog({
    user: auth.user,
    actionType: status === AccessStatus.APPROVED ? "ACCESS_REQUEST_APPROVED" : "ACCESS_REQUEST_REJECTED",
    objectType: "AccessRequest",
    objectId: accessRequest.id,
    previousValue: existing.status,
    newValue: accessRequest.status,
    ipAddress,
    browser,
    deviceId: auth.session.deviceId,
    sessionId: auth.session.sessionToken,
    result: "Success",
    remarks: "Time-bound restricted document access decision recorded."
  });

  return NextResponse.json({ ok: true });
}
