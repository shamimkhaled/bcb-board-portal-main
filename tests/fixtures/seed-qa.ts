import { PrismaClient, type Role, MeetingStatus, MeetingType, ConfidentialityLevel, DocumentStatus, OcrStatus, QcStatus, RetentionStatus, MemoStatus } from "@prisma/client";
import { hashPassword } from "../../lib/auth";
import { seedPermissionDefaultsForClient } from "../../scripts/seed-permissions";
import { assertQaEnvironment } from "../helpers/environment";
import { QA_PASSWORD, qaUsers } from "./qa-users";

assertQaEnvironment();
const prisma = new PrismaClient();
const runId = process.env.QA_RUN_ID ?? "QA-LOCAL";

async function main() {
  for (const user of Object.values(qaUsers)) {
    await prisma.user.create({ data: { ...user, role: user.role as Role, passwordHash: hashPassword(QA_PASSWORD), status: "Active" } });
  }
  await seedPermissionDefaultsForClient(prisma);

  const meetingStatuses = ["DRAFT", "AGENDA_PREPARATION", "PENDING_CHAIRMAN_REVIEW", "RETURNED_FOR_CORRECTION", "APPROVED_FOR_PUBLICATION", "PUBLISHED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ARCHIVED"] as MeetingStatus[];
  for (const [index, status] of meetingStatuses.entries()) {
    await prisma.meeting.create({ data: {
      id: `${runId}-meeting-${status.toLowerCase()}`, meetingCode: `${runId}-${String(index + 1).padStart(3, "0")}`,
      title: `${runId} ${status} meeting`, meetingType: MeetingType.BOARD_MEETING,
      date: new Date(Date.UTC(2026, 6, 20 + index)), time: "10:00-11:00", venueOnlineLink: "QA Board Room",
      confidentiality: ConfidentialityLevel.INTERNAL, status, timelineJson: JSON.stringify([`QA fixture ${status}`]),
      attendees: { create: [
        { id: `${runId}-attendee-${status}-secretary`, userId: qaUsers.secretary.id, status: "SECRETARY" },
        { id: `${runId}-attendee-${status}-chairman`, userId: qaUsers.chairman.id, status: "CHAIR" }
      ] }
    }});
  }
  await prisma.document.create({ data: {
    id: `${runId}-document`, documentId: `${runId}-DOC-001`, title: `${runId} supporting document`, documentType: "Board Paper",
    year: 2026, officialDate: new Date(), departmentOffice: "QA", confidentiality: ConfidentialityLevel.INTERNAL,
    uploadedById: qaUsers.secretary.id, version: "1.0", keywords: runId, physicalFileReference: "QA-ONLY",
    retentionStatus: RetentionStatus.ACTIVE_RECORD, status: DocumentStatus.APPROVED, ocrStatus: OcrStatus.VERIFIED,
    qcStatus: QcStatus.PASSED, simulatedOcrText: "QA document content", isFinalLocked: false
  }});
  await prisma.memo.create({ data: {
    id: `${runId}-memo`, memoId: `${runId}-MEMO-001`, title: `${runId} approved memo`, originatingDepartment: "QA",
    submittedById: qaUsers.department.id, documentType: "Memo", confidentiality: ConfidentialityLevel.INTERNAL,
    supportingAttachments: "None", requestedDecision: "QA approval", status: MemoStatus.APPROVED
  }});
  console.log(`Seeded isolated QA database for ${runId}.`);
}
main().finally(() => prisma.$disconnect());
