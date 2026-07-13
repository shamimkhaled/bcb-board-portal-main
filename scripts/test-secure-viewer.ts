import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import {
  createSecureViewSession,
  recordViewerAction,
  validateSecureViewSession
} from "../lib/secure-document-viewer";

const prisma = new PrismaClient();

async function authFor(userId: string, tokenSuffix: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const session = await prisma.session.upsert({
    where: { sessionToken: `test-secure-viewer-${tokenSuffix}` },
    update: {
      userId: user.id,
      deviceId: `TEST-DEVICE-${tokenSuffix}`,
      ipAddress: "203.0.113.10",
      browser: "Secure viewer test",
      mfaVerified: true,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      lastSeenAt: new Date()
    },
    create: {
      id: `test-secure-viewer-session-${tokenSuffix}`,
      sessionToken: `test-secure-viewer-${tokenSuffix}`,
      userId: user.id,
      deviceId: `TEST-DEVICE-${tokenSuffix}`,
      ipAddress: "203.0.113.10",
      browser: "Secure viewer test",
      mfaVerified: true,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    }
  });

  return { user, session, device: null };
}

async function main() {
  const adminAuth = await authFor("user-admin", "admin");
  const departmentAuth = await authFor("user-department", "department");
  const document =
    (await prisma.document.findFirst({ where: { documentType: "Board Paper", confidentiality: "CONFIDENTIAL" } })) ??
    (await prisma.document.findFirstOrThrow({ where: { documentType: "Board Paper" } }));

  const auditBefore = await prisma.auditLog.count();
  await prisma.watermarkPolicy.upsert({
    where: { userId_category: { userId: adminAuth.user.id, category: document.documentType } },
    update: { enabled: false },
    create: {
      id: `test-watermark-${adminAuth.user.id}-${document.documentType.replace(/[^a-zA-Z0-9_-]/g, "-")}`,
      userId: adminAuth.user.id,
      category: document.documentType,
      enabled: false
    }
  });
  const viewerSession = await createSecureViewSession(adminAuth, document, { type: "document", id: document.id }, {
    ipAddress: "198.51.100.8",
    browser: "Secure viewer test"
  });

  assert.match(viewerSession.publicTraceId, /^TRACE-/);
  assert.equal(viewerSession.policy.view, true);
  assert.equal(viewerSession.policy.download, false);
  assert.equal(viewerSession.policy.print, false);
  assert.equal(viewerSession.watermark.userName, adminAuth.user.name);
  assert.equal(viewerSession.watermark.documentId, document.documentId);
  assert.equal(viewerSession.watermark.deviceId, adminAuth.session.deviceId);
  assert.equal(viewerSession.watermark.ipAddress, "198.51.100.8");
  assert.equal(viewerSession.watermark.publicTraceId, viewerSession.publicTraceId);
  assert.equal(viewerSession.watermark.policy.enabled, true);
  assert.ok(viewerSession.watermark.text.includes(adminAuth.user.name));
  assert.ok(viewerSession.watermark.text.includes(document.documentId));

  const authorized = await validateSecureViewSession(adminAuth, viewerSession.publicTraceId, {
    ipAddress: "198.51.100.8",
    browser: "Secure viewer test"
  });
  assert.equal(authorized.ok, true);
  if (!authorized.ok) throw new Error("Expected authorized secure viewer session.");

  const unauthorized = await validateSecureViewSession(departmentAuth, viewerSession.publicTraceId, {
    ipAddress: "198.51.100.20",
    browser: "Secure viewer test"
  });
  assert.equal(unauthorized.ok, false);
  assert.equal(unauthorized.status, 404);

  const downloadAllowed = await recordViewerAction(adminAuth, authorized.viewSession, "download", {
    ipAddress: "198.51.100.8",
    browser: "Secure viewer test"
  });
  const printAllowed = await recordViewerAction(adminAuth, authorized.viewSession, "print", {
    ipAddress: "198.51.100.8",
    browser: "Secure viewer test"
  });
  assert.equal(downloadAllowed, false);
  assert.equal(printAllowed, false);

  await prisma.secureDocumentViewSession.update({
    where: { publicTraceId: viewerSession.publicTraceId },
    data: { expiresAt: new Date(Date.now() - 1000) }
  });
  const expired = await validateSecureViewSession(adminAuth, viewerSession.publicTraceId, {
    ipAddress: "198.51.100.8",
    browser: "Secure viewer test"
  });
  assert.equal(expired.ok, false);
  assert.equal(expired.status, 410);

  const auditAfter = await prisma.auditLog.count();
  assert.ok(auditAfter >= auditBefore + 4);

  const expectedAuditEvents = await prisma.auditLog.findMany({
    where: {
      objectType: "SecureDocumentViewer",
      objectId: document.id,
      actionType: {
        in: ["DOCUMENT_VIEWED", "DOCUMENT_DOWNLOAD_DENIED", "DOCUMENT_PRINT_DENIED", "SECURE_VIEW_SESSION_EXPIRED"]
      }
    }
  });
  assert.ok(expectedAuditEvents.some((event) => event.actionType === "DOCUMENT_VIEWED"));
  assert.ok(expectedAuditEvents.some((event) => event.actionType === "DOCUMENT_DOWNLOAD_DENIED"));
  assert.ok(expectedAuditEvents.some((event) => event.actionType === "DOCUMENT_PRINT_DENIED"));
  assert.ok(expectedAuditEvents.some((event) => event.actionType === "SECURE_VIEW_SESSION_EXPIRED"));

  await prisma.watermarkPolicy.deleteMany({
    where: { userId: adminAuth.user.id, category: document.documentType }
  });

  console.log("Secure viewer tests passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
