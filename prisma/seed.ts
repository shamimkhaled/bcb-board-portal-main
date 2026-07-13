import { createHash, randomUUID } from "node:crypto";
import {
  AccessStatus,
  ActionStatus,
  ConfidentialityLevel,
  DeviceStatus,
  DocumentStatus,
  MeetingStatus,
  MeetingType,
  MemoStatus,
  MinutesStatus,
  OcrStatus,
  PrismaClient,
  QcStatus,
  ResolutionStatus,
  RetentionStatus,
  Role
} from "@prisma/client";
import { seedPermissionDefaultsForClient } from "../scripts/seed-permissions";

const prisma = new PrismaClient();

const passwordHash = (password: string) =>
  createHash("sha256").update(password).digest("hex");

const d = (value: string) => new Date(value);

const stringify = (value: unknown) => JSON.stringify(value, null, 2);

const auditRowHash = (input: {
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
}) =>
  createHash("sha256")
    .update(
      JSON.stringify({
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
      })
    )
    .digest("hex");

async function reset() {
  await prisma.readAcknowledgment.deleteMany();
  await prisma.boardPack.deleteMany();
  await prisma.agendaDocument.deleteMany();
  await prisma.agendaItem.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.accessRequest.deleteMany();
  await prisma.archiveRecord.deleteMany();
  await prisma.actionItem.deleteMany();
  await prisma.resolution.deleteMany();
  await prisma.minute.deleteMany();
  await prisma.meetingAttendee.deleteMany();
  await prisma.memoComment.deleteMany();
  await prisma.memoHistory.deleteMany();
  await prisma.memo.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.backupStatus.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.loginHistory.deleteMany();
  await prisma.session.deleteMany();
  await prisma.device.deleteMany();
  await prisma.committeeMember.deleteMany();
  await prisma.document.deleteMany();
  await prisma.committee.deleteMany();
  await prisma.user.deleteMany();
}

async function seedUsers() {
  const hash = passwordHash("password123");

  await prisma.user.createMany({
    data: [
      {
        id: "user-admin",
        email: "admin@bcb.test",
        name: "Nadia Rahman",
        role: Role.SYSTEM_ADMIN,
        department: "ICT and Security",
        passwordHash: hash
      },
      {
        id: "user-secretary",
        email: "secretary@bcb.test",
        name: "Mahfuz Karim",
        role: Role.COMPANY_SECRETARY,
        department: "Board Secretariat",
        passwordHash: hash
      },
      {
        id: "user-chairman",
        email: "chairman@bcb.test",
        name: "Arif Chowdhury",
        role: Role.BOARD_CHAIRMAN,
        department: "Chairman's Office",
        passwordHash: hash
      },
      {
        id: "user-director-1",
        email: "director1@bcb.test",
        name: "Samira Hossain",
        role: Role.DIRECTOR,
        department: "Board",
        passwordHash: hash
      },
      {
        id: "user-director-2",
        email: "director2@bcb.test",
        name: "Tanvir Alam",
        role: Role.DIRECTOR,
        department: "Board",
        passwordHash: hash
      },
      {
        id: "user-committee",
        email: "committee@bcb.test",
        name: "Farzana Islam",
        role: Role.COMMITTEE_MEMBER,
        department: "Cricket Operations Committee",
        passwordHash: hash
      },
      {
        id: "user-department",
        email: "department@bcb.test",
        name: "Imran Sarker",
        role: Role.DEPARTMENT_USER,
        department: "Finance and Procurement",
        passwordHash: hash
      },
      {
        id: "user-archive",
        email: "archive@bcb.test",
        name: "Rubaiyat Kabir",
        role: Role.ARCHIVE_USER,
        department: "Records and Archive",
        passwordHash: hash
      },
      {
        id: "user-auditor",
        email: "auditor@bcb.test",
        name: "Maliha Zaman",
        role: Role.AUDITOR,
        department: "Internal Audit",
        passwordHash: hash
      }
    ]
  });

  await prisma.device.createMany({
    data: [
      ["user-admin", "BCB-DEV-ADMIN-01", "Admin secure laptop", DeviceStatus.TRUSTED],
      ["user-secretary", "BCB-DEV-SEC-01", "Secretariat tablet", DeviceStatus.TRUSTED],
      ["user-chairman", "BCB-DEV-CHR-01", "Chairman's board device", DeviceStatus.TRUSTED],
      ["user-director-1", "BCB-DEV-DIR-01", "Director tablet A", DeviceStatus.TRUSTED],
      ["user-director-2", "BCB-DEV-DIR-02", "Director tablet B", DeviceStatus.UNTRUSTED],
      ["user-committee", "BCB-DEV-COM-01", "Committee notebook", DeviceStatus.TRUSTED],
      ["user-department", "BCB-DEV-DEP-01", "Department workstation", DeviceStatus.TRUSTED],
      ["user-archive", "BCB-DEV-ARC-01", "Archive scanning terminal", DeviceStatus.TRUSTED],
      ["user-auditor", "BCB-DEV-AUD-01", "Audit review laptop", DeviceStatus.TRUSTED]
    ].map(([userId, deviceId, label, status]) => ({
      id: `device-${deviceId}`,
      userId: userId as string,
      deviceId: deviceId as string,
      label: label as string,
      status: status as DeviceStatus,
      ipAddress: "192.168.10.24",
      browser: "Edge demo profile",
      lastSeenAt: d("2026-06-17T09:15:00+06:00")
    }))
  });
}

async function seedCommittees() {
  await prisma.committee.createMany({
    data: [
      {
        id: "committee-finance",
        code: "COM-FIN",
        name: "Finance and Procurement Committee",
        chairpersonId: "user-director-1",
        secretaryId: "user-secretary",
        status: "Active",
        description: "Reviews financial approvals, procurement governance, and budget controls."
      },
      {
        id: "committee-cricket-ops",
        code: "COM-OPS",
        name: "Cricket Operations Committee",
        chairpersonId: "user-chairman",
        secretaryId: "user-committee",
        status: "Active",
        description: "Oversees cricket operations, tournaments, logistics, and performance support."
      },
      {
        id: "committee-governance",
        code: "COM-GOV",
        name: "Governance and Risk Committee",
        chairpersonId: "user-director-2",
        secretaryId: "user-secretary",
        status: "Active",
        description: "Monitors policies, board risk, compliance posture, and archive governance."
      }
    ]
  });

  await prisma.committeeMember.createMany({
    data: [
      ["committee-finance", "user-director-1", "Chairperson"],
      ["committee-finance", "user-department", "Finance Lead"],
      ["committee-finance", "user-auditor", "Observer"],
      ["committee-cricket-ops", "user-chairman", "Chairperson"],
      ["committee-cricket-ops", "user-committee", "Committee Secretary"],
      ["committee-cricket-ops", "user-director-2", "Member"],
      ["committee-governance", "user-director-2", "Chairperson"],
      ["committee-governance", "user-secretary", "Secretary"],
      ["committee-governance", "user-admin", "Security Advisor"]
    ].map(([committeeId, userId, roleLabel], index) => ({
      id: `committee-member-${index + 1}`,
      committeeId,
      userId,
      roleLabel
    }))
  });
}

async function seedDocuments() {
  const documents = [
    {
      id: "doc-001",
      documentId: "BCB-DOC-2026-0001",
      title: "National Team Logistics Governance Note",
      documentType: "Board Paper",
      year: 2026,
      officialDate: "2026-06-03T10:00:00+06:00",
      meetingType: "Board Meeting",
      committeeId: "committee-cricket-ops",
      departmentOffice: "Cricket Operations",
      confidentiality: ConfidentialityLevel.CONFIDENTIAL,
      approvedById: "user-chairman",
      version: "1.0",
      keywords: "logistics, national team, travel, operations",
      retentionStatus: RetentionStatus.PERMANENT,
      status: DocumentStatus.FINAL_LOCKED,
      ocrStatus: OcrStatus.VERIFIED,
      qcStatus: QcStatus.PASSED
    },
    {
      id: "doc-002",
      documentId: "BCB-DOC-2026-0002",
      title: "High Performance Center Equipment Approval",
      documentType: "Financial Approval",
      year: 2026,
      officialDate: "2026-06-05T14:00:00+06:00",
      meetingType: "Board Meeting",
      committeeId: "committee-finance",
      departmentOffice: "Finance and Procurement",
      confidentiality: ConfidentialityLevel.RESTRICTED,
      approvedById: "user-secretary",
      version: "2.1",
      keywords: "equipment, high performance, procurement",
      retentionStatus: RetentionStatus.ACTIVE_RECORD,
      status: DocumentStatus.APPROVED,
      ocrStatus: OcrStatus.PROCESSED,
      qcStatus: QcStatus.PASSED
    },
    {
      id: "doc-003",
      documentId: "BCB-DOC-2026-0003",
      title: "Board Meeting Notice - June 2026",
      documentType: "Meeting Notice",
      year: 2026,
      officialDate: "2026-06-07T09:00:00+06:00",
      meetingType: "Board Meeting",
      committeeId: null,
      departmentOffice: "Board Secretariat",
      confidentiality: ConfidentialityLevel.INTERNAL,
      approvedById: "user-secretary",
      version: "1.0",
      keywords: "notice, board meeting, directors",
      retentionStatus: RetentionStatus.PERMANENT,
      status: DocumentStatus.FINAL_LOCKED,
      ocrStatus: OcrStatus.VERIFIED,
      qcStatus: QcStatus.PASSED
    },
    {
      id: "doc-004",
      documentId: "BCB-DOC-2026-0004",
      title: "Agenda - 12th Board Meeting 2026",
      documentType: "Agenda",
      year: 2026,
      officialDate: "2026-06-09T13:00:00+06:00",
      meetingType: "Board Meeting",
      committeeId: null,
      departmentOffice: "Board Secretariat",
      confidentiality: ConfidentialityLevel.CONFIDENTIAL,
      approvedById: "user-chairman",
      version: "1.0",
      keywords: "agenda, board, governance",
      retentionStatus: RetentionStatus.PERMANENT,
      status: DocumentStatus.FINAL_LOCKED,
      ocrStatus: OcrStatus.VERIFIED,
      qcStatus: QcStatus.PASSED
    },
    {
      id: "doc-005",
      documentId: "BCB-DOC-2026-0005",
      title: "Draft Minutes - 11th Board Meeting",
      documentType: "Minutes",
      year: 2026,
      officialDate: "2026-05-24T15:30:00+06:00",
      meetingType: "Board Meeting",
      committeeId: null,
      departmentOffice: "Board Secretariat",
      confidentiality: ConfidentialityLevel.CONFIDENTIAL,
      approvedById: "user-chairman",
      version: "3.0",
      keywords: "minutes, board, decisions",
      retentionStatus: RetentionStatus.PERMANENT,
      status: DocumentStatus.FINAL_LOCKED,
      ocrStatus: OcrStatus.VERIFIED,
      qcStatus: QcStatus.PASSED
    },
    {
      id: "doc-006",
      documentId: "BCB-DOC-2026-0006",
      title: "Resolution Register Extract - Cricket Operations",
      documentType: "Resolution",
      year: 2026,
      officialDate: "2026-05-28T11:15:00+06:00",
      meetingType: "Committee Meeting",
      committeeId: "committee-cricket-ops",
      departmentOffice: "Board Secretariat",
      confidentiality: ConfidentialityLevel.RESTRICTED,
      approvedById: "user-secretary",
      version: "1.0",
      keywords: "resolution, operations, implementation",
      retentionStatus: RetentionStatus.PERMANENT,
      status: DocumentStatus.APPROVED,
      ocrStatus: OcrStatus.PROCESSED,
      qcStatus: QcStatus.PASSED
    },
    {
      id: "doc-007",
      documentId: "BCB-DOC-2025-0042",
      title: "AGM 2025 Member Circulation Pack",
      documentType: "AGM Document",
      year: 2025,
      officialDate: "2025-12-10T10:00:00+06:00",
      meetingType: "AGM",
      committeeId: null,
      departmentOffice: "Board Secretariat",
      confidentiality: ConfidentialityLevel.INTERNAL,
      approvedById: "user-chairman",
      version: "1.0",
      keywords: "agm, member, circulation",
      retentionStatus: RetentionStatus.PERMANENT,
      status: DocumentStatus.ARCHIVED,
      ocrStatus: OcrStatus.VERIFIED,
      qcStatus: QcStatus.PASSED
    },
    {
      id: "doc-008",
      documentId: "BCB-DOC-2025-0043",
      title: "Governance Policy Revision Matrix",
      documentType: "Policy",
      year: 2025,
      officialDate: "2025-11-18T16:00:00+06:00",
      meetingType: "Committee Meeting",
      committeeId: "committee-governance",
      departmentOffice: "Governance and Risk",
      confidentiality: ConfidentialityLevel.RESTRICTED,
      approvedById: "user-director-2",
      version: "4.0",
      keywords: "policy, governance, revision",
      retentionStatus: RetentionStatus.LEGAL_HOLD,
      status: DocumentStatus.ARCHIVED,
      ocrStatus: OcrStatus.VERIFIED,
      qcStatus: QcStatus.PASSED
    },
    {
      id: "doc-009",
      documentId: "BCB-DOC-2024-0028",
      title: "Committee Correspondence Register",
      documentType: "Correspondence",
      year: 2024,
      officialDate: "2024-08-22T12:30:00+06:00",
      meetingType: "Committee Meeting",
      committeeId: "committee-governance",
      departmentOffice: "Records and Archive",
      confidentiality: ConfidentialityLevel.INTERNAL,
      approvedById: "user-secretary",
      version: "1.2",
      keywords: "correspondence, committee, registry",
      retentionStatus: RetentionStatus.LONG_TERM_ARCHIVE,
      status: DocumentStatus.ARCHIVED,
      ocrStatus: OcrStatus.VERIFIED,
      qcStatus: QcStatus.PASSED
    },
    {
      id: "doc-010",
      documentId: "BCB-DOC-2024-0031",
      title: "Memo Supporting Attachment - Vendor Due Diligence",
      documentType: "Supporting Attachment",
      year: 2024,
      officialDate: "2024-09-04T10:45:00+06:00",
      meetingType: null,
      committeeId: "committee-finance",
      departmentOffice: "Finance and Procurement",
      confidentiality: ConfidentialityLevel.HIGHLY_CONFIDENTIAL,
      approvedById: "user-secretary",
      version: "1.0",
      keywords: "vendor, due diligence, supporting attachment",
      retentionStatus: RetentionStatus.LEGAL_HOLD,
      status: DocumentStatus.ARCHIVED,
      ocrStatus: OcrStatus.PROCESSED,
      qcStatus: QcStatus.PASSED
    },
    {
      id: "doc-011",
      documentId: "BCB-DOC-2023-0018",
      title: "Legal Opinion Register - Governance Matters",
      documentType: "Legal Document",
      year: 2023,
      officialDate: "2023-07-12T14:20:00+06:00",
      meetingType: null,
      committeeId: "committee-governance",
      departmentOffice: "Legal",
      confidentiality: ConfidentialityLevel.HIGHLY_CONFIDENTIAL,
      approvedById: "user-chairman",
      version: "1.0",
      keywords: "legal, opinion, governance",
      retentionStatus: RetentionStatus.LEGAL_HOLD,
      status: DocumentStatus.ARCHIVED,
      ocrStatus: OcrStatus.VERIFIED,
      qcStatus: QcStatus.PASSED
    },
    {
      id: "doc-012",
      documentId: "BCB-DOC-2023-0020",
      title: "Cricket Operations Committee Paper",
      documentType: "Committee Paper",
      year: 2023,
      officialDate: "2023-09-19T09:45:00+06:00",
      meetingType: "Committee Meeting",
      committeeId: "committee-cricket-ops",
      departmentOffice: "Cricket Operations",
      confidentiality: ConfidentialityLevel.RESTRICTED,
      approvedById: "user-committee",
      version: "1.0",
      keywords: "committee paper, operations, cricket",
      retentionStatus: RetentionStatus.LONG_TERM_ARCHIVE,
      status: DocumentStatus.ARCHIVED,
      ocrStatus: OcrStatus.PROCESSED,
      qcStatus: QcStatus.PASSED
    },
    {
      id: "doc-013",
      documentId: "BCB-DOC-2022-0011",
      title: "Archive Scan - Meeting Notice Register",
      documentType: "Archive Document",
      year: 2022,
      officialDate: "2022-04-10T10:00:00+06:00",
      meetingType: null,
      committeeId: null,
      departmentOffice: "Records and Archive",
      confidentiality: ConfidentialityLevel.INTERNAL,
      approvedById: "user-archive",
      version: "0.9",
      keywords: "archive, notices, register",
      retentionStatus: RetentionStatus.LONG_TERM_ARCHIVE,
      status: DocumentStatus.ARCHIVED,
      ocrStatus: OcrStatus.PROCESSED,
      qcStatus: QcStatus.PENDING
    },
    {
      id: "doc-014",
      documentId: "BCB-DOC-2022-0012",
      title: "Board Paper Archive - Domestic Tournament Funding",
      documentType: "Board Paper",
      year: 2022,
      officialDate: "2022-05-02T11:10:00+06:00",
      meetingType: "Board Meeting",
      committeeId: "committee-finance",
      departmentOffice: "Finance and Procurement",
      confidentiality: ConfidentialityLevel.CONFIDENTIAL,
      approvedById: "user-chairman",
      version: "1.0",
      keywords: "domestic tournament, funding, board paper",
      retentionStatus: RetentionStatus.PERMANENT,
      status: DocumentStatus.ARCHIVED,
      ocrStatus: OcrStatus.VERIFIED,
      qcStatus: QcStatus.PASSED
    },
    {
      id: "doc-015",
      documentId: "BCB-DOC-2026-0015",
      title: "Access Control Review Export",
      documentType: "Memo",
      year: 2026,
      officialDate: "2026-06-12T17:00:00+06:00",
      meetingType: null,
      committeeId: "committee-governance",
      departmentOffice: "ICT and Security",
      confidentiality: ConfidentialityLevel.RESTRICTED,
      approvedById: "user-admin",
      version: "1.0",
      keywords: "access control, security, review",
      retentionStatus: RetentionStatus.ACTIVE_RECORD,
      status: DocumentStatus.APPROVED,
      ocrStatus: OcrStatus.PROCESSED,
      qcStatus: QcStatus.PASSED
    }
  ];

  await prisma.document.createMany({
    data: documents.map((document, index) => ({
      ...document,
      officialDate: d(document.officialDate),
      uploadedById: index % 3 === 0 ? "user-secretary" : index % 3 === 1 ? "user-department" : "user-archive",
      physicalFileReference: `BCB/PHYS/${document.year}/${String(index + 1).padStart(3, "0")}`,
      fileName: `${document.documentId}.pdf`,
      filePath: null,
      accessExpiryDate: document.confidentiality === ConfidentialityLevel.HIGHLY_CONFIDENTIAL ? d("2026-08-31T23:59:00+06:00") : null,
      simulatedOcrText: `Simulated OCR text for ${document.title}. This MVP stores extracted text metadata without running a production OCR pipeline.`,
      isFinalLocked: document.status === DocumentStatus.FINAL_LOCKED
    }))
  });

  await prisma.documentVersion.createMany({
    data: documents.slice(0, 9).flatMap((document, index) => [
      {
        id: `docver-${index + 1}-a`,
        documentId: document.id,
        version: "0.9",
        fileName: `${document.documentId}-draft.pdf`,
        changeNote: "Initial upload and metadata capture."
      },
      {
        id: `docver-${index + 1}-b`,
        documentId: document.id,
        version: document.version,
        fileName: `${document.documentId}.pdf`,
        changeNote: "Reviewed, approved, and ready for controlled circulation."
      }
    ])
  });
}

async function seedMeetingsAndMemos() {
  await prisma.meeting.createMany({
    data: [
      {
        id: "meeting-board-12",
        meetingCode: "BCB-MTG-2026-012",
        title: "12th Board Meeting 2026",
        meetingType: MeetingType.BOARD_MEETING,
        date: d("2026-06-25T00:00:00+06:00"),
        time: "11:00",
        venueOnlineLink: "BCB Board Room, Sher-e-Bangla National Cricket Stadium",
        confidentiality: ConfidentialityLevel.CONFIDENTIAL,
        status: MeetingStatus.BOARD_PACK_PUBLISHED,
        committeeId: null,
        timelineJson: stringify([
          "Draft meeting created",
          "Agenda prepared by Secretary",
          "Chairman approved agenda",
          "Board pack published to directors"
        ])
      },
      {
        id: "meeting-board-13",
        meetingCode: "BCB-MTG-2026-013",
        title: "13th Board Meeting 2026",
        meetingType: MeetingType.BOARD_MEETING,
        date: d("2026-07-18T00:00:00+06:00"),
        time: "10:30",
        venueOnlineLink: "Hybrid - BCB Board Room and secure video link",
        confidentiality: ConfidentialityLevel.RESTRICTED,
        status: MeetingStatus.AGENDA_PREPARED,
        committeeId: null,
        timelineJson: stringify(["Meeting drafted", "Agenda items collected"])
      },
      {
        id: "meeting-board-11",
        meetingCode: "BCB-MTG-2026-011",
        title: "11th Board Meeting 2026",
        meetingType: MeetingType.BOARD_MEETING,
        date: d("2026-05-19T00:00:00+06:00"),
        time: "15:00",
        venueOnlineLink: "BCB Board Room",
        confidentiality: ConfidentialityLevel.CONFIDENTIAL,
        status: MeetingStatus.MINUTES_APPROVED,
        committeeId: null,
        timelineJson: stringify(["Meeting held", "Minutes drafted", "Chairman approved minutes"])
      },
      {
        id: "meeting-agm-2026",
        meetingCode: "BCB-AGM-2026-001",
        title: "Annual General Meeting 2026",
        meetingType: MeetingType.AGM,
        date: d("2026-09-15T00:00:00+06:00"),
        time: "12:00",
        venueOnlineLink: "BCB Conference Hall",
        confidentiality: ConfidentialityLevel.INTERNAL,
        status: MeetingStatus.DRAFT,
        committeeId: null,
        timelineJson: stringify(["AGM shell opened", "Department submissions pending"])
      },
      {
        id: "meeting-finance-06",
        meetingCode: "BCB-COM-FIN-2026-006",
        title: "Finance Committee Review - June",
        meetingType: MeetingType.COMMITTEE_MEETING,
        date: d("2026-06-22T00:00:00+06:00"),
        time: "14:30",
        venueOnlineLink: "Finance Committee Room",
        confidentiality: ConfidentialityLevel.RESTRICTED,
        status: MeetingStatus.AGENDA_APPROVED,
        committeeId: "committee-finance",
        timelineJson: stringify(["Committee meeting created", "Procurement agenda approved"])
      },
      {
        id: "meeting-ops-06",
        meetingCode: "BCB-COM-OPS-2026-006",
        title: "Cricket Operations Committee - Tour Logistics",
        meetingType: MeetingType.COMMITTEE_MEETING,
        date: d("2026-06-28T00:00:00+06:00"),
        time: "16:00",
        venueOnlineLink: "Secure video link",
        confidentiality: ConfidentialityLevel.CONFIDENTIAL,
        status: MeetingStatus.BOARD_PACK_PUBLISHED,
        committeeId: "committee-cricket-ops",
        timelineJson: stringify(["Agenda drafted", "Board papers attached", "Pack published"])
      }
    ]
  });

  await prisma.meetingAttendee.createMany({
    data: [
      "user-chairman",
      "user-secretary",
      "user-director-1",
      "user-director-2",
      "user-committee"
    ].flatMap((userId, index) => [
      {
        id: `att-board-12-${index}`,
        meetingId: "meeting-board-12",
        userId,
        status: index < 3 ? "Confirmed" : "Pending acknowledgment"
      },
      {
        id: `att-board-13-${index}`,
        meetingId: "meeting-board-13",
        userId,
        status: "Invited"
      }
    ])
  });

  await prisma.memo.createMany({
    data: [
      {
        id: "memo-001",
        memoId: "BCB-MEMO-2026-001",
        title: "Approval for National Team Logistics Framework",
        originatingDepartment: "Cricket Operations",
        submittedById: "user-department",
        documentType: "Board Paper",
        confidentiality: ConfidentialityLevel.CONFIDENTIAL,
        supportingAttachments: "BCB-DOC-2026-0001",
        requestedDecision: "Approve a governed logistics framework for upcoming international tours.",
        relatedCommitteeId: "committee-cricket-ops",
        relatedMeetingId: "meeting-board-12",
        status: MemoStatus.MARKED_FOR_BOARD_MEETING
      },
      {
        id: "memo-002",
        memoId: "BCB-MEMO-2026-002",
        title: "High Performance Center Equipment Procurement",
        originatingDepartment: "Finance and Procurement",
        submittedById: "user-department",
        documentType: "Financial Approval",
        confidentiality: ConfidentialityLevel.RESTRICTED,
        supportingAttachments: "BCB-DOC-2026-0002",
        requestedDecision: "Approve procurement envelope and delegated signing authority.",
        relatedCommitteeId: "committee-finance",
        relatedMeetingId: "meeting-finance-06",
        status: MemoStatus.CHAIRMAN_APPROVAL_PENDING
      },
      {
        id: "memo-003",
        memoId: "BCB-MEMO-2026-003",
        title: "Governance Policy Revision",
        originatingDepartment: "Governance and Risk",
        submittedById: "user-secretary",
        documentType: "Policy",
        confidentiality: ConfidentialityLevel.RESTRICTED,
        supportingAttachments: "BCB-DOC-2025-0043",
        requestedDecision: "Approve revised governance policy matrix for board adoption.",
        relatedCommitteeId: "committee-governance",
        relatedMeetingId: "meeting-board-13",
        status: MemoStatus.UNDER_SECRETARY_REVIEW
      },
      {
        id: "memo-004",
        memoId: "BCB-MEMO-2026-004",
        title: "Archive Digitization Batch Sign-off",
        originatingDepartment: "Records and Archive",
        submittedById: "user-archive",
        documentType: "Archive Document",
        confidentiality: ConfidentialityLevel.INTERNAL,
        supportingAttachments: "BCB-DOC-2022-0011",
        requestedDecision: "Approve archival lock for verified 2022 meeting notice batch.",
        relatedCommitteeId: "committee-governance",
        relatedMeetingId: null,
        status: MemoStatus.RETURNED_FOR_CORRECTION
      },
      {
        id: "memo-005",
        memoId: "BCB-MEMO-2026-005",
        title: "Access Control Quarterly Review",
        originatingDepartment: "ICT and Security",
        submittedById: "user-admin",
        documentType: "Memo",
        confidentiality: ConfidentialityLevel.RESTRICTED,
        supportingAttachments: "BCB-DOC-2026-0015",
        requestedDecision: "Note device posture and approve updated document access controls.",
        relatedCommitteeId: "committee-governance",
        relatedMeetingId: "meeting-board-12",
        status: MemoStatus.APPROVED
      }
    ]
  });

  const histories = [
    ["memo-001", "user-department", MemoStatus.DRAFT, "Department drafted the board memo."],
    ["memo-001", "user-department", MemoStatus.SUBMITTED, "Submitted to Board Secretariat."],
    ["memo-001", "user-secretary", MemoStatus.CHAIRMAN_APPROVAL_PENDING, "Secretary review complete."],
    ["memo-001", "user-chairman", MemoStatus.APPROVED, "Chairman approved for board circulation."],
    ["memo-001", "user-secretary", MemoStatus.MARKED_FOR_BOARD_MEETING, "Attached to 12th Board Meeting agenda."],
    ["memo-002", "user-department", MemoStatus.SUBMITTED, "Submitted procurement memo."],
    ["memo-002", "user-secretary", MemoStatus.CHAIRMAN_APPROVAL_PENDING, "Forwarded to Chairman."],
    ["memo-003", "user-secretary", MemoStatus.UNDER_SECRETARY_REVIEW, "Policy matrix under review."],
    ["memo-004", "user-secretary", MemoStatus.RETURNED_FOR_CORRECTION, "Archive batch metadata requires corrected file references."],
    ["memo-005", "user-admin", MemoStatus.SUBMITTED, "Security review submitted."],
    ["memo-005", "user-secretary", MemoStatus.CHAIRMAN_APPROVAL_PENDING, "Secretary reviewed device posture."],
    ["memo-005", "user-chairman", MemoStatus.APPROVED, "Approved for governance summary."]
  ] as const;

  await prisma.memoHistory.createMany({
    data: histories.map(([memoId, actorId, status, comment], index) => ({
      id: `memo-history-${index + 1}`,
      memoId,
      actorId,
      status,
      comment,
      createdAt: d(`2026-06-${String(2 + index).padStart(2, "0")}T10:00:00+06:00`)
    }))
  });

  await prisma.memoComment.createMany({
    data: [
      {
        id: "memo-comment-1",
        memoId: "memo-001",
        authorId: "user-secretary",
        comment: "Please ensure travel risk notes are included in the board pack index."
      },
      {
        id: "memo-comment-2",
        memoId: "memo-002",
        authorId: "user-chairman",
        comment: "Chairman's review pending procurement threshold clarification."
      },
      {
        id: "memo-comment-3",
        memoId: "memo-004",
        authorId: "user-secretary",
        comment: "Returned for correction: physical references must match archive batch."
      }
    ]
  });
}

async function seedAgendaPacksMinutes() {
  await prisma.agendaItem.createMany({
    data: [
      {
        id: "agenda-12-1",
        meetingId: "meeting-board-12",
        itemNumber: 1,
        title: "Confirmation of previous minutes",
        ownerUserId: "user-secretary",
        status: "Ready",
        memoId: null,
        decisionSummary: "Directors to confirm approved minutes of 11th Board Meeting."
      },
      {
        id: "agenda-12-2",
        meetingId: "meeting-board-12",
        itemNumber: 2,
        title: "National Team Logistics Framework",
        ownerUserId: "user-committee",
        status: "Board paper attached",
        memoId: "memo-001",
        decisionSummary: "Approve logistics governance and controlled travel delegation."
      },
      {
        id: "agenda-12-3",
        meetingId: "meeting-board-12",
        itemNumber: 3,
        title: "Access Control Quarterly Review",
        ownerUserId: "user-admin",
        status: "For noting",
        memoId: "memo-005",
        decisionSummary: "Note security posture and approve device authorization controls."
      },
      {
        id: "agenda-fin-1",
        meetingId: "meeting-finance-06",
        itemNumber: 1,
        title: "HPC Equipment Procurement",
        ownerUserId: "user-department",
        status: "Awaiting chairman approval",
        memoId: "memo-002",
        decisionSummary: "Review procurement envelope and recommend board decision."
      },
      {
        id: "agenda-ops-1",
        meetingId: "meeting-ops-06",
        itemNumber: 1,
        title: "Tour Logistics Risk Review",
        ownerUserId: "user-committee",
        status: "Published",
        memoId: "memo-001",
        decisionSummary: "Committee review of operational dependencies and mitigations."
      }
    ]
  });

  await prisma.agendaDocument.createMany({
    data: [
      ["agenda-12-1", "doc-005"],
      ["agenda-12-2", "doc-001"],
      ["agenda-12-2", "doc-004"],
      ["agenda-12-3", "doc-015"],
      ["agenda-fin-1", "doc-002"],
      ["agenda-ops-1", "doc-001"],
      ["agenda-ops-1", "doc-012"]
    ].map(([agendaItemId, documentId], index) => ({
      id: `agenda-doc-${index + 1}`,
      agendaItemId,
      documentId
    }))
  });

  await prisma.boardPack.createMany({
    data: [
      {
        id: "pack-board-12",
        packCode: "BCB-PACK-2026-012",
        meetingId: "meeting-board-12",
        status: "Published",
        publishedAt: d("2026-06-14T18:00:00+06:00"),
        publishedById: "user-secretary",
        historyJson: stringify([
          "Pack compiled from approved agenda",
          "Watermarked viewer enabled",
          "Published to trusted director devices"
        ])
      },
      {
        id: "pack-ops-06",
        packCode: "BCB-PACK-COM-OPS-006",
        meetingId: "meeting-ops-06",
        status: "Published",
        publishedAt: d("2026-06-16T17:30:00+06:00"),
        publishedById: "user-committee",
        historyJson: stringify(["Committee pack assembled", "Acknowledgment tracking enabled"])
      },
      {
        id: "pack-fin-06",
        packCode: "BCB-PACK-COM-FIN-006",
        meetingId: "meeting-finance-06",
        status: "Ready for publication",
        publishedAt: null,
        publishedById: null,
        historyJson: stringify(["Agenda approved", "Waiting for chairman memo approval"])
      }
    ]
  });

  await prisma.minute.createMany({
    data: [
      {
        id: "minute-board-11",
        minutesCode: "BCB-MIN-2026-011",
        meetingId: "meeting-board-11",
        status: MinutesStatus.LOCKED,
        draftedById: "user-secretary",
        approvedById: "user-chairman",
        version: "2.0",
        attendanceJson: stringify(["Chairman present", "4 directors present", "Secretary in attendance"]),
        discussionJson: stringify([
          "Approved previous action closure summary.",
          "Reviewed cricket operations progress.",
          "Resolved archive digitization pilot scope."
        ])
      },
      {
        id: "minute-board-12",
        minutesCode: "BCB-MIN-2026-012",
        meetingId: "meeting-board-12",
        status: MinutesStatus.DRAFT,
        draftedById: "user-secretary",
        approvedById: null,
        version: "0.1",
        attendanceJson: stringify(["Attendance pending meeting day"]),
        discussionJson: stringify(["Draft template prepared by agenda item."])
      },
      {
        id: "minute-fin-06",
        minutesCode: "BCB-MIN-COM-FIN-006",
        meetingId: "meeting-finance-06",
        status: MinutesStatus.SUBMITTED,
        draftedById: "user-secretary",
        approvedById: null,
        version: "1.0",
        attendanceJson: stringify(["Finance chair confirmed", "Department user confirmed"]),
        discussionJson: stringify(["Procurement threshold clarification requested."])
      }
    ]
  });
}

async function seedResolutionsActionsAccessArchive() {
  await prisma.resolution.createMany({
    data: [
      {
        id: "resolution-001",
        resolutionNumber: "BCB-RES-2026-001",
        meetingId: "meeting-board-11",
        agendaItemId: null,
        title: "Archive Digitization Pilot Approved",
        decisionSummary: "Approve pilot digitization for board records from 2022 to 2026.",
        responsiblePerson: "Records and Archive",
        dateApproved: d("2026-05-19T17:00:00+06:00"),
        status: ResolutionStatus.PUBLISHED,
        documentId: "doc-006",
        actionItemId: null,
        timelineJson: stringify(["Drafted from approved minutes", "Published to resolution register"])
      },
      {
        id: "resolution-002",
        resolutionNumber: "BCB-RES-2026-002",
        meetingId: "meeting-board-11",
        agendaItemId: null,
        title: "Device Authorization Register",
        decisionSummary: "Maintain trusted-device register for secure board document viewing.",
        responsiblePerson: "ICT and Security",
        dateApproved: d("2026-05-19T17:15:00+06:00"),
        status: ResolutionStatus.IMPLEMENTED,
        documentId: "doc-015",
        actionItemId: null,
        timelineJson: stringify(["Security control approved", "Admin device dashboard activated"])
      },
      {
        id: "resolution-003",
        resolutionNumber: "BCB-RES-2026-003",
        meetingId: "meeting-board-12",
        agendaItemId: "agenda-12-2",
        title: "Tour Logistics Governance",
        decisionSummary: "Approve logistics framework subject to board deliberation.",
        responsiblePerson: "Cricket Operations",
        dateApproved: d("2026-06-25T16:30:00+06:00"),
        status: ResolutionStatus.DRAFT,
        documentId: "doc-001",
        actionItemId: null,
        timelineJson: stringify(["Pre-generated draft from agenda item", "Awaiting meeting decision"])
      },
      {
        id: "resolution-004",
        resolutionNumber: "BCB-RES-COM-FIN-006",
        meetingId: "meeting-finance-06",
        agendaItemId: "agenda-fin-1",
        title: "HPC Equipment Recommendation",
        decisionSummary: "Recommend equipment procurement after threshold clarification.",
        responsiblePerson: "Finance and Procurement",
        dateApproved: d("2026-06-22T16:00:00+06:00"),
        status: ResolutionStatus.APPROVED,
        documentId: "doc-002",
        actionItemId: null,
        timelineJson: stringify(["Committee recommendation drafted", "Chair review pending"])
      },
      {
        id: "resolution-005",
        resolutionNumber: "BCB-RES-COM-OPS-006",
        meetingId: "meeting-ops-06",
        agendaItemId: "agenda-ops-1",
        title: "Operations Risk Tracker",
        decisionSummary: "Publish a risk tracker for upcoming tour logistics.",
        responsiblePerson: "Cricket Operations Committee",
        dateApproved: d("2026-06-28T17:30:00+06:00"),
        status: ResolutionStatus.PUBLISHED,
        documentId: "doc-012",
        actionItemId: null,
        timelineJson: stringify(["Committee minutes approved", "Resolution issued to operations team"])
      }
    ]
  });

  await prisma.actionItem.createMany({
    data: [
      ["action-001", "BCB-ACT-2026-001", "Complete archive metadata QC for 2022 board records", "meeting-board-11", null, "resolution-001", "user-archive", "Records and Archive", "2026-06-30T17:00:00+06:00", ActionStatus.IN_PROGRESS, "Batch 2022-A in QC.", "doc-013"],
      ["action-002", "BCB-ACT-2026-002", "Review trusted device list for directors", "meeting-board-11", null, "resolution-002", "user-admin", "ICT and Security", "2026-06-21T17:00:00+06:00", ActionStatus.COMPLETED, "Initial register reviewed.", "doc-015"],
      ["action-003", "BCB-ACT-2026-003", "Collect acknowledgment for published board pack", "meeting-board-12", "agenda-12-2", null, "user-secretary", "Board Secretariat", "2026-06-24T18:00:00+06:00", ActionStatus.OPEN, null, "doc-004"],
      ["action-004", "BCB-ACT-2026-004", "Clarify procurement threshold for HPC equipment", "meeting-finance-06", "agenda-fin-1", "resolution-004", "user-department", "Finance and Procurement", "2026-06-20T18:00:00+06:00", ActionStatus.OVERDUE, null, "doc-002"],
      ["action-005", "BCB-ACT-2026-005", "Prepare tour logistics risk tracker", "meeting-ops-06", "agenda-ops-1", "resolution-005", "user-committee", "Cricket Operations Committee", "2026-07-02T17:00:00+06:00", ActionStatus.IN_PROGRESS, "Risk owner mapping underway.", "doc-012"],
      ["action-006", "BCB-ACT-2026-006", "Update retention policy labels for legacy correspondence", null, null, null, "user-archive", "Records and Archive", "2026-07-10T17:00:00+06:00", ActionStatus.OPEN, null, "doc-009"],
      ["action-007", "BCB-ACT-2026-007", "Prepare AGM member circulation index", "meeting-agm-2026", null, null, "user-secretary", "Board Secretariat", "2026-08-01T17:00:00+06:00", ActionStatus.OPEN, null, "doc-007"],
      ["action-008", "BCB-ACT-2026-008", "Verify legal hold access list", null, null, null, "user-auditor", "Internal Audit", "2026-06-29T17:00:00+06:00", ActionStatus.IN_PROGRESS, "Reviewing highly confidential document access.", "doc-011"],
      ["action-009", "BCB-ACT-2026-009", "Publish minutes review reminders", "meeting-board-12", "agenda-12-1", null, "user-secretary", "Board Secretariat", "2026-06-26T12:00:00+06:00", ActionStatus.OPEN, null, "doc-005"],
      ["action-010", "BCB-ACT-2026-010", "Close completed device authorization resolution", "meeting-board-11", null, "resolution-002", "user-admin", "ICT and Security", "2026-06-19T17:00:00+06:00", ActionStatus.CLOSED, "Closure approved by Board Secretariat.", "doc-015"]
    ].map(([id, actionCode, title, meetingId, agendaItemId, resolutionId, responsibleUserId, departmentCommittee, dueDate, status, completionNote, supportingDocumentId]) => ({
      id: id as string,
      actionCode: actionCode as string,
      title: title as string,
      meetingId: meetingId as string | null,
      agendaItemId: agendaItemId as string | null,
      resolutionId: resolutionId as string | null,
      responsibleUserId: responsibleUserId as string,
      departmentCommittee: departmentCommittee as string,
      dueDate: d(dueDate as string),
      status: status as ActionStatus,
      completionNote: completionNote as string | null,
      supportingDocumentId: supportingDocumentId as string | null,
      closureApprovedById: status === ActionStatus.CLOSED ? "user-secretary" : null
    }))
  });

  await prisma.accessRequest.createMany({
    data: [
      ["access-001", "BCB-AR-2026-001", "doc-010", "user-director-1", "Review vendor due diligence for finance committee deliberation.", "7 days", AccessStatus.APPROVED, "user-secretary", "2026-06-30T23:59:00+06:00"],
      ["access-002", "BCB-AR-2026-002", "doc-011", "user-auditor", "Internal audit legal hold verification.", "14 days", AccessStatus.PENDING, null, null],
      ["access-003", "BCB-AR-2026-003", "doc-001", "user-director-2", "Board pack review ahead of 12th Board Meeting.", "5 days", AccessStatus.APPROVED, "user-secretary", "2026-06-25T23:59:00+06:00"],
      ["access-004", "BCB-AR-2026-004", "doc-010", "user-committee", "Committee requested broad vendor access.", "30 days", AccessStatus.REJECTED, "user-admin", null],
      ["access-005", "BCB-AR-2026-005", "doc-008", "user-department", "Policy implementation reference.", "3 days", AccessStatus.EXPIRED, "user-secretary", "2026-06-01T23:59:00+06:00"]
    ].map(([id, requestCode, documentId, requestedById, reason, duration, status, approvedById, expiryDate]) => ({
      id: id as string,
      requestCode: requestCode as string,
      documentId: documentId as string,
      requestedById: requestedById as string,
      reason: reason as string,
      requestedAccessDuration: duration as string,
      status: status as AccessStatus,
      approvedById: approvedById as string | null,
      expiryDate: expiryDate ? d(expiryDate as string) : null
    }))
  });

  await prisma.archiveRecord.createMany({
    data: [
      [2022, "Board Meeting Documents", "doc-014", OcrStatus.VERIFIED, QcStatus.PASSED, 94, true],
      [2022, "Meeting Notices", "doc-013", OcrStatus.PROCESSED, QcStatus.PENDING, 72, false],
      [2023, "Committee Meeting Documents", "doc-012", OcrStatus.PROCESSED, QcStatus.PASSED, 86, false],
      [2023, "Policies", "doc-011", OcrStatus.VERIFIED, QcStatus.PASSED, 91, true],
      [2024, "Correspondence", "doc-009", OcrStatus.VERIFIED, QcStatus.PASSED, 88, false],
      [2024, "Supporting Attachments", "doc-010", OcrStatus.PROCESSED, QcStatus.PASSED, 80, false],
      [2025, "AGM Documents", "doc-007", OcrStatus.VERIFIED, QcStatus.PASSED, 96, true],
      [2025, "Policies", "doc-008", OcrStatus.VERIFIED, QcStatus.PASSED, 93, true],
      [2026, "Board Meeting Documents", "doc-001", OcrStatus.VERIFIED, QcStatus.PASSED, 90, false],
      [2026, "Resolutions", "doc-006", OcrStatus.PROCESSED, QcStatus.PASSED, 84, false]
    ].map(([year, category, documentId, ocrStatus, qcStatus, metadataComplete, finalLocked], index) => ({
      id: `archive-${index + 1}`,
      archiveCode: `BCB-ARCH-${year}-${String(index + 1).padStart(3, "0")}`,
      documentId: documentId as string,
      title: `${category} archival batch ${year}`,
      year: year as number,
      category: category as string,
      ocrStatus: ocrStatus as OcrStatus,
      qcStatus: qcStatus as QcStatus,
      physicalFileReference: `BCB/ARCH/${year}/BOX-${String(index + 1).padStart(2, "0")}`,
      batchNumber: `BATCH-${year}-${index % 2 === 0 ? "A" : "B"}`,
      metadataComplete: metadataComplete as number,
      finalLocked: finalLocked as boolean,
      simulatedOcrText: `Simulated OCR capture for ${category} archival record ${year}.`
    }))
  });
}

async function seedNotificationsBackupAndReads() {
  const notificationTypes = [
    "Meeting notice",
    "Board pack published",
    "Document assigned",
    "Minutes pending review",
    "Resolution published",
    "Action item assigned",
    "Access request approved",
    "Access request rejected",
    "Overdue action",
    "Backup completed",
    "Security warning"
  ];
  const users = [
    "user-admin",
    "user-secretary",
    "user-chairman",
    "user-director-1",
    "user-director-2",
    "user-committee",
    "user-department",
    "user-archive",
    "user-auditor"
  ];

  await prisma.notification.createMany({
    data: Array.from({ length: 20 }, (_, index) => {
      const type = notificationTypes[index % notificationTypes.length];
      return {
        id: `notification-${index + 1}`,
        userId: users[index % users.length],
        type,
        title: `${type}: BCB governance update`,
        body: "Please log in to the secure platform to review the item. Confidential documents are never attached to notifications.",
        channelLog: stringify({
          email: "Queued demo email without attachment",
          sms: index % 2 === 0 ? "Simulated SMS sent" : "Not required",
          push: "In-app notification created"
        }),
        isRead: index % 4 === 0,
        createdAt: d(`2026-06-${String(1 + (index % 16)).padStart(2, "0")}T09:30:00+06:00`)
      };
    })
  });

  await prisma.backupStatus.createMany({
    data: [
      {
        id: "backup-current",
        databaseBackupAt: d("2026-06-17T01:15:00+06:00"),
        documentBackupAt: d("2026-06-17T01:40:00+06:00"),
        auditBackupAt: d("2026-06-17T01:55:00+06:00"),
        backupStatus: "Healthy",
        restoreTestStatus: "Passed - last simulated restore completed in 11 minutes",
        edgeNodeSyncStatus: "Laptop MVP simulation only",
        storageUsagePercent: 38,
        drReadinessScore: 82,
        retentionSummary: "Daily database, daily documents, immutable audit export retained for 180 days."
      },
      {
        id: "backup-previous",
        databaseBackupAt: d("2026-06-16T01:15:00+06:00"),
        documentBackupAt: d("2026-06-16T01:40:00+06:00"),
        auditBackupAt: d("2026-06-16T01:55:00+06:00"),
        backupStatus: "Healthy",
        restoreTestStatus: "Passed",
        edgeNodeSyncStatus: "Laptop MVP simulation only",
        storageUsagePercent: 36,
        drReadinessScore: 80,
        retentionSummary: "Daily backup cycle retained."
      }
    ]
  });

  await prisma.readAcknowledgment.createMany({
    data: [
      {
        id: "read-1",
        userId: "user-director-1",
        documentId: "doc-001",
        boardPackId: "pack-board-12",
        agendaItemId: "agenda-12-2",
        type: "READ",
        page: 1,
        sessionId: "seed-session"
      },
      {
        id: "ack-1",
        userId: "user-director-1",
        documentId: "doc-001",
        boardPackId: "pack-board-12",
        agendaItemId: "agenda-12-2",
        type: "ACK",
        page: 1,
        sessionId: "seed-session"
      },
      {
        id: "read-2",
        userId: "user-chairman",
        documentId: "doc-004",
        boardPackId: "pack-board-12",
        agendaItemId: "agenda-12-1",
        type: "READ",
        page: 1,
        sessionId: "seed-session"
      }
    ]
  });
}

async function seedAuditLogs() {
  const users = await prisma.user.findMany();
  const objects = [
    ["MEMO_SUBMITTED", "Memo", "memo-001", null, "Draft", "Submitted"],
    ["SECRETARY_REVIEWED", "Memo", "memo-001", null, "Submitted", "Chairman Approval Pending"],
    ["CHAIRMAN_APPROVED", "Memo", "memo-001", null, "Pending", "Approved"],
    ["MEETING_CREATED", "Meeting", "meeting-board-12", null, null, "Draft"],
    ["AGENDA_PREPARED", "Meeting", "meeting-board-12", null, "Draft", "Agenda Prepared"],
    ["BOARD_PACK_PUBLISHED", "BoardPack", "pack-board-12", null, "Ready", "Published"],
    ["DOCUMENT_VIEWED", "Document", "doc-001", "BCB-DOC-2026-0001", null, "Viewed"],
    ["DOCUMENT_ACKNOWLEDGED", "Document", "doc-001", "BCB-DOC-2026-0001", "Unread", "Acknowledged"],
    ["MINUTES_DRAFTED", "Minutes", "minute-board-12", null, null, "Draft"],
    ["RESOLUTION_GENERATED", "Resolution", "resolution-003", null, null, "Draft"],
    ["ACTION_ASSIGNED", "ActionItem", "action-003", null, null, "Open"],
    ["DEVICE_AUTHORIZED", "Device", "device-BCB-DEV-DIR-01", null, "Untrusted", "Trusted"],
    ["ACCESS_REQUESTED", "AccessRequest", "access-002", "BCB-DOC-2023-0018", null, "Pending"],
    ["BACKUP_COMPLETED", "BackupStatus", "backup-current", null, null, "Healthy"],
    ["ARCHIVE_QC_UPDATED", "ArchiveRecord", "archive-1", null, "Pending", "Passed"]
  ] as const;

  let previousHash = "GENESIS";
  const rows = [];

  for (let index = 0; index < 50; index += 1) {
    const user = users[index % users.length];
    const [actionType, objectType, objectId, documentId, previousValue, newValue] =
      objects[index % objects.length];
    const createdAt = d(
      `2026-06-${String(1 + (index % 16)).padStart(2, "0")}T${String(8 + (index % 10)).padStart(2, "0")}:00:00+06:00`
    );
    const row = {
      sequence: index + 1,
      userId: user.id,
      userName: user.name,
      role: user.role,
      actionType,
      objectType,
      objectId,
      documentId,
      previousValue,
      newValue,
      ipAddress: "192.168.10.24",
      deviceId: `BCB-DEV-${String((index % 9) + 1).padStart(2, "0")}`,
      browser: "Edge demo profile",
      sessionId: `seed-session-${(index % 5) + 1}`,
      result: index % 17 === 0 ? "Warning" : "Success",
      remarks:
        index % 17 === 0
          ? "Demo warning condition retained in immutable log."
          : "Hash-linked governance audit event.",
      previousHash,
      createdAt
    };
    const hash = auditRowHash(row);

    rows.push({
      id: `audit-${String(index + 1).padStart(3, "0")}`,
      ...row,
      hash
    });
    previousHash = hash;
  }

  await prisma.auditLog.createMany({ data: rows });
}

async function main() {
  await reset();
  await seedUsers();
  await seedCommittees();
  await seedDocuments();
  await seedMeetingsAndMemos();
  await seedAgendaPacksMinutes();
  await seedResolutionsActionsAccessArchive();
  await seedNotificationsBackupAndReads();
  await seedAuditLogs();
  await seedPermissionDefaultsForClient(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seeded BCB Directors' Affairs Automation Platform demo data.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
