-- Secure document viewer sessions are short-lived, session-bound records used to
-- authorize page rendering and audit document actions without public file URLs.
CREATE TABLE "SecureDocumentViewSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "publicTraceId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "authSessionId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT,
  "deviceId" TEXT NOT NULL,
  "ipAddress" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "watermarkJson" TEXT NOT NULL,
  "policyJson" TEXT NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "lastAccessedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiryLoggedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SecureDocumentViewSession_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SecureDocumentViewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "SecureDocumentViewSession_publicTraceId_key" ON "SecureDocumentViewSession"("publicTraceId");
CREATE INDEX "SecureDocumentViewSession_documentId_idx" ON "SecureDocumentViewSession"("documentId");
CREATE INDEX "SecureDocumentViewSession_userId_idx" ON "SecureDocumentViewSession"("userId");
CREATE INDEX "SecureDocumentViewSession_publicTraceId_authSessionId_idx" ON "SecureDocumentViewSession"("publicTraceId", "authSessionId");
