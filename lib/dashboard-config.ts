import type { Role } from "@prisma/client";

type DashboardProfile = {
  title: string;
  description: string;
  focusItems: string[];
};

const commonProfile: DashboardProfile = {
  title: "Governance cockpit",
  description:
    "A secure, paperless command center for board memos, meetings, documents, minutes, resolutions, archive controls, and audit integrity.",
  focusItems: [
    "Upcoming meetings",
    "Assigned board packs",
    "Documents pending acknowledgment",
    "Notifications"
  ]
};

export const dashboardProfiles: Partial<Record<Role, DashboardProfile>> = {
  DIRECTOR: {
    title: "Director dashboard",
    description:
      "A focused workspace for assigned board packs, secure documents, upcoming governance work, acknowledgments, and action items.",
    focusItems: [
      "Upcoming meetings",
      "Assigned board packs",
      "Documents pending acknowledgment",
      "Minutes pending review",
      "Resolution tracker",
      "Committee assignments",
      "Personal action items",
      "Recent secure documents"
    ]
  },
  COMPANY_SECRETARY: {
    title: "Board Secretary dashboard",
    description:
      "A command center for memos, meetings, board-pack publication, minutes, resolutions, access requests, and governance follow-through.",
    focusItems: [
      "Pending memos",
      "Meetings in preparation",
      "Agenda approval status",
      "Board pack publication status",
      "Minutes drafting status",
      "Pending chairman approval",
      "Overdue action items",
      "Access requests"
    ]
  },
  BOARD_CHAIRMAN: {
    title: "Chairman dashboard",
    description:
      "A high-level review surface for approvals, board meetings, confidential documents, resolutions, and governance exceptions.",
    focusItems: [
      "Board meetings",
      "Documents requiring approval",
      "Minutes requiring approval",
      "Resolutions awaiting publication",
      "High-confidential documents",
      "Governance summary",
      "Audit alerts"
    ]
  },
  SYSTEM_ADMIN: {
    title: "Admin dashboard",
    description:
      "A security and operations cockpit for users, devices, permissions, audit integrity, backup posture, and platform health.",
    focusItems: [
      "Users",
      "Roles",
      "Device status",
      "Audit integrity",
      "Storage usage",
      "Backup status",
      "Archive progress",
      "Security events"
    ]
  },
  DEPARTMENT_USER: {
    title: "Department dashboard",
    description:
      "A simplified workspace for department memo submission, uploaded documents, assigned action items, and access requests.",
    focusItems: [
      "Draft and submitted memos",
      "Department documents",
      "Assigned action items",
      "Access requests",
      "Notifications"
    ]
  },
  ARCHIVE_USER: {
    title: "Archive user dashboard",
    description:
      "A records workspace for archive batches, OCR status, QC progress, metadata completion, and physical file references.",
    focusItems: [
      "Documents uploaded",
      "OCR pending",
      "QC pending",
      "Archive progress by year",
      "Physical file references",
      "Metadata completion rate"
    ]
  }
};

export function getDashboardProfile(role: Role) {
  return dashboardProfiles[role] ?? commonProfile;
}
