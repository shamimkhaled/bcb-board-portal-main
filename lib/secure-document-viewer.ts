import { randomUUID } from "node:crypto";
import type { ConfidentialityLevel, Document, Prisma, SecureDocumentViewSession } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import type { AuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasDocumentContentAccess, hasDocumentMetadataAccess, hasPermission } from "@/lib/permissions";
import { confidentiality, role } from "@/lib/labels";
import { safeJson } from "@/lib/utils";

export const SECURE_VIEW_SESSION_MINUTES = 10;

export type ViewerAction = "view" | "annotate" | "download" | "print" | "share";

export type ViewerPolicy = Record<ViewerAction, boolean>;

export type ViewerWatermarkContext = {
  userName: string;
  roleLabel: string;
  documentId: string;
  documentTitle: string;
  documentType: string;
  timestamp: string;
  deviceId: string;
  ipAddress: string;
  publicTraceId: string;
  policy: {
    includeName: boolean;
    includeRole: boolean;
    includeTimestamp: boolean;
    includeIpAddress: boolean;
    includeDeviceId: boolean;
    opacity: number;
    density: number;
    enabled: boolean;
  };
  text: string;
};

export type SecureViewerSessionPayload = {
  publicTraceId: string;
  expiresAt: string;
  document: {
    id: string;
    documentId: string;
    title: string;
    documentType: string;
    confidentiality: string;
    version: string;
    pageCount: number;
  };
  deviceStatus: string;
  policy: ViewerPolicy;
  watermark: ViewerWatermarkContext;
};

type ViewerDocument = Pick<
  Document,
  "id" | "documentId" | "title" | "documentType" | "confidentiality" | "version" | "simulatedOcrText" | "filePath"
>;

export async function authorizeDocumentForSecureView(auth: AuthContext, document: ViewerDocument) {
  const [metadataAllowed, contentAllowed] = await Promise.all([
    hasDocumentMetadataAccess(auth.user, document),
    hasDocumentContentAccess(auth.user, document)
  ]);

  return metadataAllowed && contentAllowed;
}

export async function createSecureViewSession(
  auth: AuthContext,
  document: ViewerDocument,
  source: { type: "document" | "board-pack" | "minutes" | "resolution"; id?: string },
  requestMeta?: { ipAddress?: string; browser?: string }
): Promise<SecureViewerSessionPayload> {
  if (!(await authorizeDocumentForSecureView(auth, document))) {
    await auditViewerEvent(auth, document, "DOCUMENT_VIEW_DENIED", "Denied", "Secure viewer authorization failed.", requestMeta);
    throw new Error("Document access denied.");
  }

  const publicTraceId = `TRACE-${randomUUID().slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const policy = await resolveViewerPolicy(auth, document);
  const watermark = await buildWatermarkContext(auth, document, publicTraceId, requestMeta?.ipAddress);
  const expiresAt = new Date(Date.now() + SECURE_VIEW_SESSION_MINUTES * 60 * 1000);

  await prisma.secureDocumentViewSession.create({
    data: {
      id: `view-${randomUUID()}`,
      publicTraceId,
      documentId: document.id,
      userId: auth.user.id,
      authSessionId: auth.session.sessionToken,
      sourceType: source.type,
      sourceId: source.id ?? null,
      deviceId: auth.session.deviceId,
      ipAddress: requestMeta?.ipAddress ?? auth.session.ipAddress,
      role: auth.user.role,
      watermarkJson: JSON.stringify(watermark),
      policyJson: JSON.stringify(policy),
      expiresAt
    }
  });

  await auditViewerEvent(auth, document, "DOCUMENT_VIEWED", "Success", `Secure view session ${publicTraceId} created.`, requestMeta, {
    publicTraceId,
    sourceType: source.type
  });

  return {
    publicTraceId,
    expiresAt: expiresAt.toISOString(),
    document: {
      id: document.id,
      documentId: document.documentId,
      title: document.title,
      documentType: document.documentType,
      confidentiality: confidentiality(document.confidentiality),
      version: document.version,
      pageCount: estimatePageCount(document.simulatedOcrText)
    },
    deviceStatus: auth.device?.status ?? "UNTRUSTED",
    policy,
    watermark
  };
}

export async function resolveViewerPolicy(auth: AuthContext, document: ViewerDocument): Promise<ViewerPolicy> {
  const [canAnnotate, canDownload, canPrint, canShare] = await Promise.all([
    hasPermission(auth.user, "documents", "annotate"),
    hasPermission(auth.user, "documents", "download"),
    hasPermission(auth.user, "documents", "print"),
    hasPermission(auth.user, "documents", "share")
  ]);

  const confidentialBoardDocument = isConfidentialBoardDocument(document);
  return {
    view: true,
    annotate: canAnnotate,
    download: confidentialBoardDocument ? false : canDownload,
    print: confidentialBoardDocument ? false : canPrint,
    share: confidentialBoardDocument ? false : canShare
  };
}

export async function buildWatermarkContext(
  auth: AuthContext,
  document: ViewerDocument,
  publicTraceId: string,
  requestIp?: string
): Promise<ViewerWatermarkContext> {
  const policy = await resolveWatermarkPolicy(auth.user.id, auth.user.role, document.documentType);
  const effectivePolicy = {
    ...policy,
    enabled: isConfidentialBoardDocument(document) ? true : policy.enabled
  };
  const timestamp = new Date().toISOString();
  const segments = [
    effectivePolicy.includeName ? auth.user.name : null,
    effectivePolicy.includeRole ? role(auth.user.role) : null,
    document.documentId,
    document.title,
    effectivePolicy.includeTimestamp ? timestamp : null,
    effectivePolicy.includeDeviceId ? auth.session.deviceId : null,
    effectivePolicy.includeIpAddress ? requestIp ?? auth.session.ipAddress : null,
    publicTraceId
  ].filter(Boolean);

  return {
    userName: auth.user.name,
    roleLabel: role(auth.user.role),
    documentId: document.documentId,
    documentTitle: document.title,
    documentType: document.documentType,
    timestamp,
    deviceId: auth.session.deviceId,
    ipAddress: requestIp ?? auth.session.ipAddress,
    publicTraceId,
    policy: effectivePolicy,
    text: segments.join(" | ")
  };
}

export async function validateSecureViewSession(auth: AuthContext, publicTraceId: string, requestMeta?: { ipAddress?: string; browser?: string }) {
  const viewSession = await prisma.secureDocumentViewSession.findUnique({
    where: { publicTraceId },
    include: { document: true }
  });

  if (!viewSession || viewSession.userId !== auth.user.id || viewSession.authSessionId !== auth.session.sessionToken) {
    return { ok: false as const, status: 404, error: "Secure view session not found." };
  }

  if (viewSession.expiresAt <= new Date() || viewSession.status !== "ACTIVE") {
    await logSessionExpiryOnce(auth, viewSession, requestMeta);
    return { ok: false as const, status: 410, error: "Secure view session expired." };
  }

  if (!(await authorizeDocumentForSecureView(auth, viewSession.document))) {
    await auditViewerEvent(auth, viewSession.document, "DOCUMENT_VIEW_DENIED", "Denied", "Secure view session authorization no longer valid.", requestMeta, {
      publicTraceId
    });
    return { ok: false as const, status: 403, error: "Document access denied." };
  }

  await prisma.secureDocumentViewSession.update({
    where: { id: viewSession.id },
    data: { lastAccessedAt: new Date() }
  });

  return { ok: true as const, viewSession };
}

export async function getSecureViewerPages(viewSession: SecureDocumentViewSession & { document: ViewerDocument }, start: number, count: number) {
  const pages = paginateText(viewSession.document.simulatedOcrText, viewSession.document.title);
  const safeStart = Math.max(0, Math.min(start, pages.length - 1));
  const safeCount = Math.max(1, Math.min(count, 4));
  return {
    pageCount: pages.length,
    pages: pages.slice(safeStart, safeStart + safeCount).map((content, index) => ({
      pageNumber: safeStart + index + 1,
      content
    }))
  };
}

export async function recordViewerAction(
  auth: AuthContext,
  viewSession: SecureDocumentViewSession & { document: ViewerDocument },
  action: Exclude<ViewerAction, "view">,
  requestMeta?: { ipAddress?: string; browser?: string }
) {
  const policy = safeJson<ViewerPolicy>(viewSession.policyJson, {
    view: true,
    annotate: false,
    download: false,
    print: false,
    share: false
  });
  const allowed = Boolean(policy[action]);
  const actionType = allowed ? `DOCUMENT_${action.toUpperCase()}_REQUESTED` : `DOCUMENT_${action.toUpperCase()}_DENIED`;

  await auditViewerEvent(
    auth,
    viewSession.document,
    actionType,
    allowed ? "Success" : "Denied",
    allowed ? `${action} action permitted by viewer policy.` : `${action} action denied by viewer policy.`,
    requestMeta,
    { publicTraceId: viewSession.publicTraceId, action }
  );

  return allowed;
}

export async function auditViewerEvent(
  auth: AuthContext,
  document: Pick<Document, "id" | "documentId">,
  actionType: string,
  result: "Success" | "Denied" | "Expired",
  remarks: string,
  requestMeta?: { ipAddress?: string; browser?: string },
  extra?: Record<string, unknown>
) {
  await createAuditLog({
    user: auth.user,
    actionType,
    objectType: "SecureDocumentViewer",
    objectId: document.id,
    documentId: document.documentId,
    ipAddress: requestMeta?.ipAddress ?? auth.session.ipAddress,
    browser: requestMeta?.browser ?? auth.session.browser,
    deviceId: auth.session.deviceId,
    sessionId: auth.session.sessionToken,
    result,
    remarks,
    newValue: extra ? JSON.stringify(extra) : null
  });
}

async function logSessionExpiryOnce(
  auth: AuthContext,
  viewSession: SecureDocumentViewSession & { document: Document },
  requestMeta?: { ipAddress?: string; browser?: string }
) {
  if (!viewSession.expiryLoggedAt) {
    await prisma.secureDocumentViewSession.update({
      where: { id: viewSession.id },
      data: { status: "EXPIRED", expiryLoggedAt: new Date() }
    });
    await auditViewerEvent(auth, viewSession.document, "SECURE_VIEW_SESSION_EXPIRED", "Expired", "Secure view session expired.", requestMeta, {
      publicTraceId: viewSession.publicTraceId
    });
  }
}

async function resolveWatermarkPolicy(userId: string, userRole: string, category: string) {
  const policies = await prisma.watermarkPolicy.findMany({
    where: {
      OR: [
        { userId, category },
        { userId, category: "*" },
        { role: userRole as never, category },
        { role: userRole as never, category: "*" }
      ]
    }
  });

  const match =
    policies.find((policy) => policy.userId === userId && policy.category === category) ??
    policies.find((policy) => policy.userId === userId && policy.category === "*") ??
    policies.find((policy) => policy.role === userRole && policy.category === category) ??
    policies.find((policy) => policy.role === userRole && policy.category === "*");

  return {
    enabled: match?.enabled ?? true,
    includeName: match?.includeName ?? true,
    includeRole: match?.includeRole ?? true,
    includeTimestamp: match?.includeTimestamp ?? true,
    includeIpAddress: match?.includeIpAddress ?? true,
    includeDeviceId: match?.includeDeviceId ?? true,
    opacity: match?.opacity ?? 28,
    density: match?.density ?? 18
  };
}

function isConfidentialBoardDocument(document: { documentType: string; confidentiality: ConfidentialityLevel }) {
  const boardTypes = new Set(["Board Paper", "Committee Paper", "AGM Document", "Meeting Notice", "Agenda", "Minutes", "Resolution"]);
  return boardTypes.has(document.documentType) && ["CONFIDENTIAL", "HIGHLY_CONFIDENTIAL"].includes(document.confidentiality);
}

function estimatePageCount(text: string) {
  return paginateText(text, "Document").length;
}

function paginateText(text: string, title: string) {
  const normalized = (text || `${title}\n\nNo extracted text is available for this document.`).trim();
  const words = normalized.split(/\s+/);
  const pageSize = 115;
  const pages: string[] = [];
  for (let index = 0; index < words.length; index += pageSize) {
    pages.push(words.slice(index, index + pageSize).join(" "));
  }
  return pages.length ? pages : [`${title}\n\nNo extracted text is available for this document.`];
}

export type SecureViewerDocument = Prisma.DocumentGetPayload<Record<string, never>>;
