export const QA_PASSWORD = "BCB-QA-Only-Password-2026!";
export const QA_OTP = "123456";

export const qaUsers = {
  admin: { id: "qa-user-admin", email: "admin@qa.bcb.test", name: "QA System Admin", role: "SYSTEM_ADMIN" },
  secretary: { id: "qa-user-secretary", email: "secretary@qa.bcb.test", name: "QA Company Secretary", role: "COMPANY_SECRETARY" },
  chairman: { id: "qa-user-chairman", email: "chairman@qa.bcb.test", name: "QA Board Chairman", role: "BOARD_CHAIRMAN" },
  director: { id: "qa-user-director", email: "director@qa.bcb.test", name: "QA Director", role: "DIRECTOR" },
  committee: { id: "qa-user-committee", email: "committee@qa.bcb.test", name: "QA Committee Member", role: "COMMITTEE_MEMBER" },
  department: { id: "qa-user-department", email: "department@qa.bcb.test", name: "QA Department User", role: "DEPARTMENT_USER" },
  archive: { id: "qa-user-archive", email: "archive@qa.bcb.test", name: "QA Archive User", role: "ARCHIVE_USER" },
  auditor: { id: "qa-user-auditor", email: "auditor@qa.bcb.test", name: "QA Auditor", role: "AUDITOR" }
} as const;

// BLOCKED: CHIEF_EXECUTIVE_OFFICER is not present in the application's Prisma Role enum.
export const qaCeoBlocker = "CHIEF_EXECUTIVE_OFFICER role is not implemented";
