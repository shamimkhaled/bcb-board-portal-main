import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { AccessStatus } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import { getCurrentAuth, getRequestMeta } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await hasPermission(auth.user, "accessRequests", "create"))) {
    return NextResponse.json({ error: "Access request permission required" }, { status: 403 });
  }
  const { documentId, reason, requestedAccessDuration } = (await request.json()) as {
    documentId?: string;
    reason?: string;
    requestedAccessDuration?: string;
  };
  if (!documentId) return NextResponse.json({ error: "Document is required" }, { status: 400 });

  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const count = await prisma.accessRequest.count();
  const accessRequest = await prisma.accessRequest.create({
    data: {
      id: `access-${randomUUID()}`,
      requestCode: `BCB-AR-2026-${String(count + 1).padStart(3, "0")}`,
      documentId: document.id,
      requestedById: auth.user.id,
      reason: reason || "Restricted document access requested.",
      requestedAccessDuration: requestedAccessDuration || "7 days",
      status: AccessStatus.PENDING,
      approvedById: null,
      expiryDate: null
    }
  });

  const { ipAddress, browser } = getRequestMeta(request);
  await createAuditLog({
    user: auth.user,
    actionType: "ACCESS_REQUESTED",
    objectType: "AccessRequest",
    objectId: accessRequest.id,
    documentId: document.documentId,
    ipAddress,
    browser,
    deviceId: auth.session.deviceId,
    sessionId: auth.session.sessionToken,
    result: "Success",
    remarks: "Restricted document access request submitted."
  });

  return NextResponse.json({ ok: true, requestCode: accessRequest.requestCode });
}
