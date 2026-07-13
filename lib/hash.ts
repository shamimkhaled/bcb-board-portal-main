import { createHash } from "node:crypto";

export type AuditHashInput = {
  sequence: number;
  userId?: string | null;
  userName: string;
  role: string;
  actionType: string;
  objectType: string;
  objectId?: string | null;
  documentId?: string | null;
  previousValue?: string | null;
  newValue?: string | null;
  ipAddress: string;
  deviceId: string;
  browser: string;
  sessionId: string;
  result: string;
  remarks: string;
  previousHash: string;
  createdAt: Date;
};

export function auditHash(input: AuditHashInput) {
  const payload = {
    sequence: input.sequence,
    userId: input.userId ?? null,
    userName: input.userName,
    role: input.role,
    actionType: input.actionType,
    objectType: input.objectType,
    objectId: input.objectId ?? null,
    documentId: input.documentId ?? null,
    previousValue: input.previousValue ?? null,
    newValue: input.newValue ?? null,
    ipAddress: input.ipAddress,
    deviceId: input.deviceId,
    browser: input.browser,
    sessionId: input.sessionId,
    result: input.result,
    remarks: input.remarks,
    previousHash: input.previousHash,
    createdAt: input.createdAt.toISOString()
  };

  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}
