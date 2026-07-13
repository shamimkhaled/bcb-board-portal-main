import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { getCurrentAuth, getRequestMeta } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasDocumentContentAccess, hasPermission } from "@/lib/permissions";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.device?.status === "REVOKED") {
    return NextResponse.json({ error: "Device revoked" }, { status: 403 });
  }

  const { id } = await context.params;
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  if (
    !(await hasPermission(auth.user, "documents", "acknowledge")) ||
    !(await hasDocumentContentAccess(auth.user, document))
  ) {
    return NextResponse.json({ error: "Document acknowledgment permission required" }, { status: 403 });
  }

  const { ipAddress, browser } = getRequestMeta(request);
  await prisma.readAcknowledgment.create({
    data: {
      id: `ack-${randomUUID()}`,
      userId: auth.user.id,
      documentId: document.id,
      type: "ACK",
      page: 1,
      sessionId: auth.session.sessionToken
    }
  });
  await createAuditLog({
    user: auth.user,
    actionType: "DOCUMENT_ACKNOWLEDGED",
    objectType: "Document",
    objectId: document.id,
    documentId: document.documentId,
    previousValue: "Pending acknowledgment",
    newValue: "Acknowledged",
    ipAddress,
    browser,
    deviceId: auth.session.deviceId,
    sessionId: auth.session.sessionToken,
    result: "Success",
    remarks: "Secure viewer acknowledgment recorded."
  });

  return NextResponse.json({ ok: true });
}
