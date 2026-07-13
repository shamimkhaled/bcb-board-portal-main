-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SYSTEM_ADMIN', 'COMPANY_SECRETARY', 'BOARD_CHAIRMAN', 'DIRECTOR', 'COMMITTEE_MEMBER', 'DEPARTMENT_USER', 'ARCHIVE_USER', 'AUDITOR');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('TRUSTED', 'UNTRUSTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ConfidentialityLevel" AS ENUM ('PUBLIC', 'INTERNAL', 'RESTRICTED', 'CONFIDENTIAL', 'HIGHLY_CONFIDENTIAL');

-- CreateEnum
CREATE TYPE "MemoStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_SECRETARY_REVIEW', 'RETURNED_FOR_CORRECTION', 'CHAIRMAN_APPROVAL_PENDING', 'APPROVED', 'REJECTED', 'MARKED_FOR_BOARD_MEETING', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'FINAL_LOCKED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OcrStatus" AS ENUM ('PENDING', 'PROCESSED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "QcStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "RetentionStatus" AS ENUM ('PERMANENT', 'LONG_TERM_ARCHIVE', 'LEGAL_HOLD', 'ACTIVE_RECORD', 'SUPERSEDED', 'DISPOSAL_ELIGIBLE');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('BOARD_MEETING', 'AGM', 'COMMITTEE_MEETING', 'SPECIAL_MEETING', 'EMERGENCY_MEETING');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('DRAFT', 'AGENDA_PREPARATION', 'RETURNED_FOR_CORRECTION', 'PENDING_CHAIRMAN_REVIEW', 'APPROVED_FOR_PUBLICATION', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'AGENDA_PREPARED', 'AGENDA_APPROVED', 'BOARD_PACK_PUBLISHED', 'MEETING_HELD', 'MINUTES_DRAFTED', 'MINUTES_SUBMITTED', 'MINUTES_APPROVED', 'RESOLUTIONS_PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AgendaDecisionType" AS ENUM ('INFORMATION', 'DISCUSSION', 'DECISION', 'APPROVAL', 'RATIFICATION');

-- CreateEnum
CREATE TYPE "MinutesStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'RETURNED', 'APPROVED', 'LOCKED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ResolutionStatus" AS ENUM ('DRAFT', 'APPROVED', 'PUBLISHED', 'IMPLEMENTED', 'SUPERSEDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CLOSED');

-- CreateEnum
CREATE TYPE "AccessStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PermissionEffect" AS ENUM ('ALLOW', 'DENY');

-- CreateEnum
CREATE TYPE "AppearanceTheme" AS ENUM ('EXECUTIVE_NAVY', 'BCB_EMERALD', 'HERITAGE_BURGUNDY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "department" TEXT,
    "passwordHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sensitive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "permissionId" TEXT NOT NULL,
    "effect" "PermissionEffect" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermissionOverride" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "effect" "PermissionEffect" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPermissionOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleVisibility" (
    "id" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "role" "Role",
    "userId" TEXT,
    "effect" "PermissionEffect" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModuleVisibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardWidgetVisibility" (
    "id" TEXT NOT NULL,
    "widgetKey" TEXT NOT NULL,
    "role" "Role",
    "userId" TEXT,
    "effect" "PermissionEffect" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "size" TEXT NOT NULL DEFAULT 'medium',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardWidgetVisibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalModule" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardWidget" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "defaultSize" TEXT NOT NULL DEFAULT 'medium',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardWidget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentCategoryPermission" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "role" "Role",
    "userId" TEXT,
    "effect" "PermissionEffect" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentCategoryPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatermarkPolicy" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "role" "Role",
    "userId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "includeName" BOOLEAN NOT NULL DEFAULT true,
    "includeRole" BOOLEAN NOT NULL DEFAULT true,
    "includeTimestamp" BOOLEAN NOT NULL DEFAULT true,
    "includeIpAddress" BOOLEAN NOT NULL DEFAULT true,
    "includeDeviceId" BOOLEAN NOT NULL DEFAULT true,
    "opacity" INTEGER NOT NULL DEFAULT 28,
    "density" INTEGER NOT NULL DEFAULT 18,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatermarkPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalAppearanceSetting" (
    "id" TEXT NOT NULL,
    "systemDefaultTheme" "AppearanceTheme" NOT NULL DEFAULT 'EXECUTIVE_NAVY',
    "allowUserThemeSelection" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalAppearanceSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleAppearanceSetting" (
    "role" "Role" NOT NULL,
    "defaultTheme" "AppearanceTheme" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleAppearanceSetting_pkey" PRIMARY KEY ("role")
);

-- CreateTable
CREATE TABLE "UserAppearancePreference" (
    "userId" TEXT NOT NULL,
    "selectedTheme" "AppearanceTheme" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAppearancePreference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "mfaVerified" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "DeviceStatus" NOT NULL DEFAULT 'TRUSTED',
    "ipAddress" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "deviceId" TEXT,
    "browser" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Committee" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chairpersonId" TEXT,
    "secretaryId" TEXT,
    "status" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Committee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeMember" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleLabel" TEXT NOT NULL,

    CONSTRAINT "CommitteeMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memo" (
    "id" TEXT NOT NULL,
    "memoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originatingDepartment" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "confidentiality" "ConfidentialityLevel" NOT NULL,
    "supportingAttachments" TEXT NOT NULL,
    "requestedDecision" TEXT NOT NULL,
    "relatedCommitteeId" TEXT,
    "relatedMeetingId" TEXT,
    "status" "MemoStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Memo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoHistory" (
    "id" TEXT NOT NULL,
    "memoId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "status" "MemoStatus" NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoComment" (
    "id" TEXT NOT NULL,
    "memoId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "officialDate" TIMESTAMP(3) NOT NULL,
    "meetingType" TEXT,
    "committeeId" TEXT,
    "departmentOffice" TEXT NOT NULL,
    "confidentiality" "ConfidentialityLevel" NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "version" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "physicalFileReference" TEXT NOT NULL,
    "retentionStatus" "RetentionStatus" NOT NULL,
    "status" "DocumentStatus" NOT NULL,
    "ocrStatus" "OcrStatus" NOT NULL,
    "qcStatus" "QcStatus" NOT NULL,
    "accessExpiryDate" TIMESTAMP(3),
    "fileName" TEXT,
    "filePath" TEXT,
    "simulatedOcrText" TEXT NOT NULL,
    "isFinalLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecureDocumentViewSession" (
    "id" TEXT NOT NULL,
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
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryLoggedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecureDocumentViewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "changeNote" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "meetingCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meetingType" "MeetingType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "venueOnlineLink" TEXT NOT NULL,
    "confidentiality" "ConfidentialityLevel" NOT NULL,
    "status" "MeetingStatus" NOT NULL,
    "committeeId" TEXT,
    "timelineJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingAttendee" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "MeetingAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendaItem" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "itemNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "presenter" TEXT NOT NULL DEFAULT '',
    "responsibleDepartment" TEXT NOT NULL DEFAULT '',
    "estimatedDuration" INTEGER NOT NULL DEFAULT 0,
    "decisionType" "AgendaDecisionType" NOT NULL DEFAULT 'INFORMATION',
    "confidentiality" "ConfidentialityLevel" NOT NULL DEFAULT 'INTERNAL',
    "secretaryNotes" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "ownerUserId" TEXT,
    "status" TEXT NOT NULL,
    "memoId" TEXT,
    "decisionSummary" TEXT NOT NULL,

    CONSTRAINT "AgendaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendaDocument" (
    "id" TEXT NOT NULL,
    "agendaItemId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,

    CONSTRAINT "AgendaDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardPack" (
    "id" TEXT NOT NULL,
    "packCode" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "historyJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadAcknowledgment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT,
    "boardPackId" TEXT,
    "agendaItemId" TEXT,
    "type" TEXT NOT NULL,
    "page" INTEGER,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadAcknowledgment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Minute" (
    "id" TEXT NOT NULL,
    "minutesCode" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "status" "MinutesStatus" NOT NULL,
    "draftedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "version" TEXT NOT NULL,
    "attendanceJson" TEXT NOT NULL,
    "discussionJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Minute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resolution" (
    "id" TEXT NOT NULL,
    "resolutionNumber" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "agendaItemId" TEXT,
    "title" TEXT NOT NULL,
    "decisionSummary" TEXT NOT NULL,
    "responsiblePerson" TEXT NOT NULL,
    "dateApproved" TIMESTAMP(3) NOT NULL,
    "status" "ResolutionStatus" NOT NULL,
    "documentId" TEXT,
    "actionItemId" TEXT,
    "timelineJson" TEXT NOT NULL,

    CONSTRAINT "Resolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionItem" (
    "id" TEXT NOT NULL,
    "actionCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meetingId" TEXT,
    "agendaItemId" TEXT,
    "resolutionId" TEXT,
    "responsibleUserId" TEXT NOT NULL,
    "departmentCommittee" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "ActionStatus" NOT NULL,
    "completionNote" TEXT,
    "supportingDocumentId" TEXT,
    "closureApprovedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessRequest" (
    "id" TEXT NOT NULL,
    "requestCode" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedAccessDuration" TEXT NOT NULL,
    "status" "AccessStatus" NOT NULL,
    "approvedById" TEXT,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveRecord" (
    "id" TEXT NOT NULL,
    "archiveCode" TEXT NOT NULL,
    "documentId" TEXT,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "ocrStatus" "OcrStatus" NOT NULL,
    "qcStatus" "QcStatus" NOT NULL,
    "physicalFileReference" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "metadataComplete" INTEGER NOT NULL,
    "finalLocked" BOOLEAN NOT NULL DEFAULT false,
    "simulatedOcrText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchiveRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channelLog" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT,
    "documentId" TEXT,
    "previousValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "previousHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupStatus" (
    "id" TEXT NOT NULL,
    "databaseBackupAt" TIMESTAMP(3) NOT NULL,
    "documentBackupAt" TIMESTAMP(3) NOT NULL,
    "auditBackupAt" TIMESTAMP(3) NOT NULL,
    "backupStatus" TEXT NOT NULL,
    "restoreTestStatus" TEXT NOT NULL,
    "edgeNodeSyncStatus" TEXT NOT NULL,
    "storageUsagePercent" INTEGER NOT NULL,
    "drReadinessScore" INTEGER NOT NULL,
    "retentionSummary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Permission_resource_idx" ON "Permission"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_resource_action_key" ON "Permission"("resource", "action");

-- CreateIndex
CREATE INDEX "RolePermission_role_idx" ON "RolePermission"("role");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_permissionId_key" ON "RolePermission"("role", "permissionId");

-- CreateIndex
CREATE INDEX "UserPermissionOverride_userId_idx" ON "UserPermissionOverride"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermissionOverride_userId_permissionId_key" ON "UserPermissionOverride"("userId", "permissionId");

-- CreateIndex
CREATE INDEX "ModuleVisibility_moduleKey_idx" ON "ModuleVisibility"("moduleKey");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleVisibility_role_moduleKey_key" ON "ModuleVisibility"("role", "moduleKey");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleVisibility_userId_moduleKey_key" ON "ModuleVisibility"("userId", "moduleKey");

-- CreateIndex
CREATE INDEX "DashboardWidgetVisibility_widgetKey_idx" ON "DashboardWidgetVisibility"("widgetKey");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardWidgetVisibility_role_widgetKey_key" ON "DashboardWidgetVisibility"("role", "widgetKey");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardWidgetVisibility_userId_widgetKey_key" ON "DashboardWidgetVisibility"("userId", "widgetKey");

-- CreateIndex
CREATE UNIQUE INDEX "PortalModule_key_key" ON "PortalModule"("key");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardWidget_key_key" ON "DashboardWidget"("key");

-- CreateIndex
CREATE INDEX "DocumentCategoryPermission_category_action_idx" ON "DocumentCategoryPermission"("category", "action");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentCategoryPermission_role_category_action_key" ON "DocumentCategoryPermission"("role", "category", "action");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentCategoryPermission_userId_category_action_key" ON "DocumentCategoryPermission"("userId", "category", "action");

-- CreateIndex
CREATE INDEX "WatermarkPolicy_category_idx" ON "WatermarkPolicy"("category");

-- CreateIndex
CREATE UNIQUE INDEX "WatermarkPolicy_role_category_key" ON "WatermarkPolicy"("role", "category");

-- CreateIndex
CREATE UNIQUE INDEX "WatermarkPolicy_userId_category_key" ON "WatermarkPolicy"("userId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Device_deviceId_key" ON "Device"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Committee_code_key" ON "Committee"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Memo_memoId_key" ON "Memo"("memoId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_documentId_key" ON "Document"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "SecureDocumentViewSession_publicTraceId_key" ON "SecureDocumentViewSession"("publicTraceId");

-- CreateIndex
CREATE INDEX "SecureDocumentViewSession_documentId_idx" ON "SecureDocumentViewSession"("documentId");

-- CreateIndex
CREATE INDEX "SecureDocumentViewSession_userId_idx" ON "SecureDocumentViewSession"("userId");

-- CreateIndex
CREATE INDEX "SecureDocumentViewSession_publicTraceId_authSessionId_idx" ON "SecureDocumentViewSession"("publicTraceId", "authSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_meetingCode_key" ON "Meeting"("meetingCode");

-- CreateIndex
CREATE INDEX "AgendaItem_meetingId_sortOrder_idx" ON "AgendaItem"("meetingId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AgendaDocument_agendaItemId_documentId_key" ON "AgendaDocument"("agendaItemId", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "BoardPack_packCode_key" ON "BoardPack"("packCode");

-- CreateIndex
CREATE UNIQUE INDEX "Minute_minutesCode_key" ON "Minute"("minutesCode");

-- CreateIndex
CREATE UNIQUE INDEX "Resolution_resolutionNumber_key" ON "Resolution"("resolutionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ActionItem_actionCode_key" ON "ActionItem"("actionCode");

-- CreateIndex
CREATE UNIQUE INDEX "AccessRequest_requestCode_key" ON "AccessRequest"("requestCode");

-- CreateIndex
CREATE UNIQUE INDEX "ArchiveRecord_archiveCode_key" ON "ArchiveRecord"("archiveCode");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLog_sequence_key" ON "AuditLog"("sequence");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermissionOverride" ADD CONSTRAINT "UserPermissionOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermissionOverride" ADD CONSTRAINT "UserPermissionOverride_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleVisibility" ADD CONSTRAINT "ModuleVisibility_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardWidgetVisibility" ADD CONSTRAINT "DashboardWidgetVisibility_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentCategoryPermission" ADD CONSTRAINT "DocumentCategoryPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatermarkPolicy" ADD CONSTRAINT "WatermarkPolicy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalAppearanceSetting" ADD CONSTRAINT "PortalAppearanceSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAppearancePreference" ADD CONSTRAINT "UserAppearancePreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Committee" ADD CONSTRAINT "Committee_chairpersonId_fkey" FOREIGN KEY ("chairpersonId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Committee" ADD CONSTRAINT "Committee_secretaryId_fkey" FOREIGN KEY ("secretaryId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMember" ADD CONSTRAINT "CommitteeMember_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMember" ADD CONSTRAINT "CommitteeMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memo" ADD CONSTRAINT "Memo_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memo" ADD CONSTRAINT "Memo_relatedCommitteeId_fkey" FOREIGN KEY ("relatedCommitteeId") REFERENCES "Committee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memo" ADD CONSTRAINT "Memo_relatedMeetingId_fkey" FOREIGN KEY ("relatedMeetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoHistory" ADD CONSTRAINT "MemoHistory_memoId_fkey" FOREIGN KEY ("memoId") REFERENCES "Memo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoHistory" ADD CONSTRAINT "MemoHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoComment" ADD CONSTRAINT "MemoComment_memoId_fkey" FOREIGN KEY ("memoId") REFERENCES "Memo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoComment" ADD CONSTRAINT "MemoComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecureDocumentViewSession" ADD CONSTRAINT "SecureDocumentViewSession_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecureDocumentViewSession" ADD CONSTRAINT "SecureDocumentViewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendee" ADD CONSTRAINT "MeetingAttendee_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendee" ADD CONSTRAINT "MeetingAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaItem" ADD CONSTRAINT "AgendaItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaItem" ADD CONSTRAINT "AgendaItem_memoId_fkey" FOREIGN KEY ("memoId") REFERENCES "Memo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaDocument" ADD CONSTRAINT "AgendaDocument_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES "AgendaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaDocument" ADD CONSTRAINT "AgendaDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardPack" ADD CONSTRAINT "BoardPack_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardPack" ADD CONSTRAINT "BoardPack_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadAcknowledgment" ADD CONSTRAINT "ReadAcknowledgment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadAcknowledgment" ADD CONSTRAINT "ReadAcknowledgment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadAcknowledgment" ADD CONSTRAINT "ReadAcknowledgment_boardPackId_fkey" FOREIGN KEY ("boardPackId") REFERENCES "BoardPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadAcknowledgment" ADD CONSTRAINT "ReadAcknowledgment_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES "AgendaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Minute" ADD CONSTRAINT "Minute_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Minute" ADD CONSTRAINT "Minute_draftedById_fkey" FOREIGN KEY ("draftedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Minute" ADD CONSTRAINT "Minute_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resolution" ADD CONSTRAINT "Resolution_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resolution" ADD CONSTRAINT "Resolution_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES "AgendaItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resolution" ADD CONSTRAINT "Resolution_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resolution" ADD CONSTRAINT "Resolution_actionItemId_fkey" FOREIGN KEY ("actionItemId") REFERENCES "ActionItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES "AgendaItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_resolutionId_fkey" FOREIGN KEY ("resolutionId") REFERENCES "Resolution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_supportingDocumentId_fkey" FOREIGN KEY ("supportingDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveRecord" ADD CONSTRAINT "ArchiveRecord_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

