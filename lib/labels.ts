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
  QcStatus,
  ResolutionStatus,
  RetentionStatus,
  Role
} from "@prisma/client";

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const roleLabel: Record<Role, string> = {
  [Role.SYSTEM_ADMIN]: "System Admin",
  [Role.COMPANY_SECRETARY]: "Company Secretary",
  [Role.BOARD_CHAIRMAN]: "Board Chairman",
  [Role.DIRECTOR]: "Director",
  [Role.COMMITTEE_MEMBER]: "Committee Member",
  [Role.DEPARTMENT_USER]: "Department User",
  [Role.ARCHIVE_USER]: "Archive User",
  [Role.AUDITOR]: "Auditor"
};

export const confidentialityLabel: Record<ConfidentialityLevel, string> = {
  [ConfidentialityLevel.PUBLIC]: "Public",
  [ConfidentialityLevel.INTERNAL]: "Internal",
  [ConfidentialityLevel.RESTRICTED]: "Restricted",
  [ConfidentialityLevel.CONFIDENTIAL]: "Confidential",
  [ConfidentialityLevel.HIGHLY_CONFIDENTIAL]: "Highly Confidential"
};

export const deviceStatusLabel: Record<DeviceStatus, string> = {
  [DeviceStatus.TRUSTED]: "Trusted",
  [DeviceStatus.UNTRUSTED]: "Untrusted",
  [DeviceStatus.REVOKED]: "Revoked"
};

export function label(value: string) {
  return titleCase(value);
}

export function role(value: Role) {
  return roleLabel[value] ?? titleCase(value);
}

export function confidentiality(value: ConfidentialityLevel) {
  return confidentialityLabel[value] ?? titleCase(value);
}

export function statusLabel(
  value:
    | MemoStatus
    | DocumentStatus
    | MeetingStatus
    | MinutesStatus
    | ResolutionStatus
    | ActionStatus
    | AccessStatus
    | OcrStatus
    | QcStatus
    | RetentionStatus
    | DeviceStatus
    | MeetingType
    | string
) {
  if ((Object.values(DeviceStatus) as string[]).includes(value)) {
    return deviceStatusLabel[value as DeviceStatus];
  }
  return titleCase(value);
}

export function badgeTone(value: string) {
  const normalized = value.toLowerCase();
  if (
    normalized.includes("approved") ||
    normalized.includes("published") ||
    normalized.includes("trusted") ||
    normalized.includes("passed") ||
    normalized.includes("verified") ||
    normalized.includes("healthy") ||
    normalized.includes("completed") ||
    normalized.includes("locked")
  ) {
    return "success" as const;
  }
  if (
    normalized.includes("pending") ||
    normalized.includes("draft") ||
    normalized.includes("review") ||
    normalized.includes("prepared") ||
    normalized.includes("open") ||
    normalized.includes("progress")
  ) {
    return "warning" as const;
  }
  if (
    normalized.includes("rejected") ||
    normalized.includes("revoked") ||
    normalized.includes("overdue") ||
    normalized.includes("failed") ||
    normalized.includes("warning") ||
    normalized.includes("returned")
  ) {
    return "danger" as const;
  }
  return "neutral" as const;
}
