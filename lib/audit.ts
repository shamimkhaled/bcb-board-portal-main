import { randomUUID } from "node:crypto";
import type { AuditLog, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auditHash } from "@/lib/hash";

type AuditContext = {
  user?: Pick<User, "id" | "name" | "role"> | null;
  ipAddress?: string;
  deviceId?: string;
  browser?: string;
  sessionId?: string;
};

type AuditInput = AuditContext & {
  actionType: string;
  objectType: string;
  objectId?: string | null;
  documentId?: string | null;
  previousValue?: string | null;
  newValue?: string | null;
  result?: string;
  remarks?: string;
};

export async function createAuditLog(input: AuditInput) {
  const latest = await prisma.auditLog.findFirst({
    orderBy: { sequence: "desc" }
  });
  const createdAt = new Date();
  const sequence = (latest?.sequence ?? 0) + 1;
  const previousHash = latest?.hash ?? "GENESIS";
  const userName = input.user?.name ?? "Anonymous";
  const role = input.user?.role ?? "UNKNOWN";
  const row = {
    sequence,
    userId: input.user?.id ?? null,
    userName,
    role,
    actionType: input.actionType,
    objectType: input.objectType,
    objectId: input.objectId ?? null,
    documentId: input.documentId ?? null,
    previousValue: input.previousValue ?? null,
    newValue: input.newValue ?? null,
    ipAddress: input.ipAddress ?? "127.0.0.1",
    deviceId: input.deviceId ?? "UNKNOWN-DEVICE",
    browser: input.browser ?? "Unknown browser",
    sessionId: input.sessionId ?? "anonymous",
    result: input.result ?? "Success",
    remarks: input.remarks ?? "Governance action captured.",
    previousHash,
    createdAt
  };
  const hash = auditHash(row);

  return prisma.auditLog.create({
    data: {
      id: `audit-${randomUUID()}`,
      ...row,
      hash
    }
  });
}

export function verifyAuditChain(logs: AuditLog[]) {
  const ordered = [...logs].sort((a, b) => a.sequence - b.sequence);
  let expectedPrevious = "GENESIS";

  for (const log of ordered) {
    if (log.previousHash !== expectedPrevious) {
      return {
        verified: false,
        warningAt: log.sequence,
        message: `Previous hash mismatch at sequence ${log.sequence}`
      };
    }

    const recomputed = auditHash({
      sequence: log.sequence,
      userId: log.userId,
      userName: log.userName,
      role: log.role,
      actionType: log.actionType,
      objectType: log.objectType,
      objectId: log.objectId,
      documentId: log.documentId,
      previousValue: log.previousValue,
      newValue: log.newValue,
      ipAddress: log.ipAddress,
      deviceId: log.deviceId,
      browser: log.browser,
      sessionId: log.sessionId,
      result: log.result,
      remarks: log.remarks,
      previousHash: log.previousHash,
      createdAt: log.createdAt
    });

    if (recomputed !== log.hash) {
      return {
        verified: false,
        warningAt: log.sequence,
        message: `Hash mismatch at sequence ${log.sequence}`
      };
    }

    expectedPrevious = log.hash;
  }

  return {
    verified: true,
    warningAt: null,
    message: "Integrity Verified"
  };
}
