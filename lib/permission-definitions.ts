import type { PermissionEffect, Role } from "@prisma/client";

export type PermissionDefinition = {
  resource: string;
  action: string;
  description: string;
  sensitive?: boolean;
};

export type RolePermissionDefault = {
  role: Role;
  resource: string;
  action: string;
  effect: PermissionEffect;
};

export type VisibilityDefault = {
  role: Role;
  key: string;
  effect: PermissionEffect;
  sortOrder?: number;
  size?: DashboardWidgetSize;
};

export type PortalModuleDefinition = {
  key: string;
  name: string;
  route: string;
  icon: string;
  sortOrder: number;
};

export type DashboardWidgetSize = "small" | "medium" | "large";

export type DashboardWidgetDefinition = {
  key: string;
  name: string;
  description: string;
  defaultSize: DashboardWidgetSize;
  sortOrder: number;
};

export type DocumentCategoryPermissionDefault = {
  role: Role;
  category: string;
  action: string;
  effect: PermissionEffect;
};

export type WatermarkPolicyDefault = {
  role: Role;
  category: string;
  enabled: boolean;
  includeName: boolean;
  includeRole: boolean;
  includeTimestamp: boolean;
  includeIpAddress: boolean;
  includeDeviceId: boolean;
  opacity: number;
  density: number;
};

export const moduleKeys = [
  "dashboard",
  "memo-workflow",
  "meetings",
  "board-packs",
  "documents",
  "archive",
  "minutes",
  "resolutions",
  "action-items",
  "committees",
  "access-requests",
  "notifications",
  "reports",
  "backup-dr",
  "admin",
  "audit-logs",
  "demo-journey",
  "search",
  "profile",
  "meeting-create",
  "meeting-approvals",
  "agenda-builder",
  "board-pack-assembly",
  "attendance-tracking"
] as const;

export const dashboardWidgetKeys = [
  "current-board-pack",
  "upcoming-meetings",
  "pending-acknowledgments",
  "pending-approvals",
  "recent-documents",
  "recent-minutes-resolutions",
  "committee-documents",
  "memo-workflow-status",
  "archive-progress",
  "action-items",
  "notifications",
  "audit-warnings",
  "backup-status",
  "user-statistics",
  "quick-actions",
  "governance-hero",
  "meetings",
  "documents",
  "workflow-timeline",
  "upcoming-governance-work",
  "security-dr-posture",
  "personal-action-items",
  "recent-secure-documents"
] as const;

export const portalModuleDefinitions: PortalModuleDefinition[] = [
  { key: "dashboard", name: "Dashboard", route: "/dashboard", icon: "LayoutDashboard", sortOrder: 10 },
  { key: "memo-workflow", name: "Memo Workflow", route: "/memo-workflow", icon: "FileCheck2", sortOrder: 20 },
  { key: "meetings", name: "Meetings", route: "/meetings", icon: "Landmark", sortOrder: 30 },
  { key: "board-packs", name: "Board Packs", route: "/board-packs", icon: "Boxes", sortOrder: 40 },
  { key: "documents", name: "Documents", route: "/documents", icon: "FileText", sortOrder: 50 },
  { key: "archive", name: "Archive", route: "/archive", icon: "FileArchive", sortOrder: 60 },
  { key: "minutes", name: "Minutes", route: "/minutes", icon: "NotebookTabs", sortOrder: 70 },
  { key: "resolutions", name: "Resolutions", route: "/resolutions", icon: "Signature", sortOrder: 80 },
  { key: "action-items", name: "Action Items", route: "/action-items", icon: "ListChecks", sortOrder: 90 },
  { key: "committees", name: "Committees", route: "/committees", icon: "UsersRound", sortOrder: 100 },
  { key: "access-requests", name: "Access Requests", route: "/access-requests", icon: "UserCheck", sortOrder: 110 },
  { key: "notifications", name: "Notifications", route: "/notifications", icon: "Bell", sortOrder: 120 },
  { key: "reports", name: "Reports", route: "/reports", icon: "ClipboardCheck", sortOrder: 130 },
  { key: "backup-dr", name: "Backup & DR", route: "/backup-dr", icon: "DatabaseBackup", sortOrder: 140 },
  { key: "admin", name: "Admin", route: "/admin", icon: "Settings", sortOrder: 150 },
  { key: "audit-logs", name: "Audit Logs", route: "/audit-logs", icon: "ShieldCheck", sortOrder: 160 },
  { key: "demo-journey", name: "Demo Journey", route: "/demo-journey", icon: "Gauge", sortOrder: 170 },
  { key: "search", name: "Search", route: "/search", icon: "Search", sortOrder: 180 },
  { key: "profile", name: "Profile", route: "/profile/appearance", icon: "UserCircle", sortOrder: 190 },
  { key: "meeting-create", name: "Create Meeting", route: "/meetings/new", icon: "CalendarPlus", sortOrder: 200 },
  { key: "meeting-approvals", name: "Meeting Approvals", route: "/meetings?status=pending-approval", icon: "ClipboardCheck", sortOrder: 210 },
  { key: "agenda-builder", name: "Agenda Builder", route: "/meetings", icon: "ClipboardList", sortOrder: 220 },
  { key: "board-pack-assembly", name: "Board-Pack Assembly", route: "/meetings", icon: "Boxes", sortOrder: 230 },
  { key: "attendance-tracking", name: "Attendance Tracking", route: "/meetings", icon: "UsersRound", sortOrder: 240 }
];

export const dashboardWidgetDefinitions: DashboardWidgetDefinition[] = [
  { key: "current-board-pack", name: "Current Board Pack", description: "Latest assigned board pack and acknowledgment status.", defaultSize: "large", sortOrder: 10 },
  { key: "upcoming-meetings", name: "Upcoming Meetings", description: "Board, AGM, and committee meetings coming up.", defaultSize: "medium", sortOrder: 20 },
  { key: "pending-acknowledgments", name: "Pending Acknowledgments", description: "Documents or packs awaiting the user's acknowledgment.", defaultSize: "small", sortOrder: 30 },
  { key: "pending-approvals", name: "Pending Approvals", description: "Memos and governance items awaiting approval.", defaultSize: "small", sortOrder: 40 },
  { key: "recent-documents", name: "Recent Documents", description: "Recently uploaded or published secure documents.", defaultSize: "medium", sortOrder: 50 },
  { key: "recent-minutes-resolutions", name: "Recent Minutes and Resolutions", description: "Recent minutes and resolution activity.", defaultSize: "medium", sortOrder: 60 },
  { key: "committee-documents", name: "Committee Documents", description: "Committee papers and assigned committee records.", defaultSize: "medium", sortOrder: 70 },
  { key: "memo-workflow-status", name: "Memo Workflow Status", description: "Memo submission, review, and chairman queue summary.", defaultSize: "medium", sortOrder: 80 },
  { key: "archive-progress", name: "Archive Progress", description: "Archive QC, OCR, and metadata completion progress.", defaultSize: "medium", sortOrder: 90 },
  { key: "action-items", name: "Action Items", description: "Assigned or role-relevant governance action items.", defaultSize: "medium", sortOrder: 100 },
  { key: "notifications", name: "Notifications", description: "Recent in-app governance notifications.", defaultSize: "medium", sortOrder: 110 },
  { key: "audit-warnings", name: "Audit Warnings", description: "Warning events retained in the audit log.", defaultSize: "small", sortOrder: 120 },
  { key: "backup-status", name: "Backup Status", description: "Latest backup and disaster recovery posture.", defaultSize: "medium", sortOrder: 130 },
  { key: "user-statistics", name: "User Statistics", description: "User and device summary for administrators.", defaultSize: "small", sortOrder: 140 },
  { key: "quick-actions", name: "Quick Actions", description: "Permitted high-frequency workflow shortcuts.", defaultSize: "large", sortOrder: 150 },
  { key: "governance-hero", name: "Governance Hero", description: "Role-specific dashboard introduction and timeline.", defaultSize: "large", sortOrder: 5 },
  { key: "meetings", name: "Meetings Metric", description: "Meeting count summary.", defaultSize: "small", sortOrder: 21 },
  { key: "documents", name: "Documents Metric", description: "Document repository count summary.", defaultSize: "small", sortOrder: 51 },
  { key: "workflow-timeline", name: "Workflow Timeline", description: "Governance workflow status timeline.", defaultSize: "medium", sortOrder: 81 },
  { key: "upcoming-governance-work", name: "Upcoming Governance Work", description: "Detailed upcoming governance work list.", defaultSize: "large", sortOrder: 22 },
  { key: "security-dr-posture", name: "Security and DR Posture", description: "Security, acknowledgment, archive, and backup posture.", defaultSize: "medium", sortOrder: 131 },
  { key: "personal-action-items", name: "Personal Action Items", description: "Assigned action item list.", defaultSize: "medium", sortOrder: 101 },
  { key: "recent-secure-documents", name: "Recent Secure Documents", description: "Detailed secure document list.", defaultSize: "medium", sortOrder: 52 }
];

export const documentCategories = [
  "*",
  "Board Paper",
  "AGM Document",
  "Committee Paper",
  "Meeting Notice",
  "Agenda",
  "Minutes",
  "Resolution",
  "Policy",
  "Correspondence",
  "Memo",
  "Financial Approval",
  "Legal Document",
  "Supporting Attachment",
  "Archive Document"
] as const;

export const documentCategoryActions = ["viewMetadata", "viewContent", "upload", "approve"] as const;

export const permissionDefinitions: PermissionDefinition[] = [
  { resource: "dashboard", action: "view", description: "View dashboard." },
  { resource: "memos", action: "view", description: "View memo workflow." },
  { resource: "memos", action: "create", description: "Create department or board memos." },
  { resource: "memos", action: "submit", description: "Submit memos for review." },
  { resource: "memos", action: "secretaryReview", description: "Review, return, and forward memos as Secretary." },
  { resource: "memos", action: "chairmanApprove", description: "Approve or reject memos as Chairman.", sensitive: true },
  { resource: "memos", action: "markForBoard", description: "Mark approved memos for board meeting agenda." },
  { resource: "meetings", action: "view", description: "View meetings." },
  { resource: "meetings", action: "manage", description: "Create and manage meetings.", sensitive: true },
  { resource: "meeting", action: "view", description: "View assigned or published meetings." },
  { resource: "meeting", action: "create", description: "Create draft meetings.", sensitive: true },
  { resource: "meeting", action: "edit", description: "Edit draft meeting details.", sensitive: true },
  { resource: "meeting", action: "submit", description: "Submit meetings for chairman review.", sensitive: true },
  { resource: "meeting", action: "approve", description: "Approve or return meetings.", sensitive: true },
  { resource: "meeting", action: "publish", description: "Publish approved meetings.", sensitive: true },
  { resource: "meeting", action: "manageParticipants", description: "Manage meeting participants.", sensitive: true },
  { resource: "agenda", action: "view", description: "View meeting agenda." },
  { resource: "agenda", action: "create", description: "Create meeting agenda items.", sensitive: true },
  { resource: "agenda", action: "edit", description: "Edit meeting agenda items.", sensitive: true },
  { resource: "agenda", action: "delete", description: "Delete draft meeting agenda items.", sensitive: true },
  { resource: "agenda", action: "reorder", description: "Reorder meeting agenda items.", sensitive: true },
  { resource: "agenda", action: "attachDocument", description: "Attach accessible documents to agenda items.", sensitive: true },
  { resource: "agenda", action: "linkMemo", description: "Link approved memos to agenda items.", sensitive: true },
  { resource: "agenda", action: "submit", description: "Submit an agenda for chairman review.", sensitive: true },
  { resource: "boardPacks", action: "view", description: "View board packs." },
  { resource: "boardPacks", action: "acknowledge", description: "Acknowledge assigned board packs." },
  { resource: "boardPacks", action: "manage", description: "Compile and manage board packs.", sensitive: true },
  { resource: "boardPacks", action: "publish", description: "Publish board packs.", sensitive: true },
  { resource: "documents", action: "viewMetadata", description: "View document repository metadata." },
  { resource: "documents", action: "viewContent", description: "View protected document content.", sensitive: true },
  { resource: "documents", action: "upload", description: "Upload and register documents." },
  { resource: "documents", action: "approve", description: "Approve or final-lock documents.", sensitive: true },
  { resource: "documents", action: "read", description: "Mark a document as read." },
  { resource: "documents", action: "acknowledge", description: "Acknowledge a document." },
  { resource: "documents", action: "annotate", description: "Create secure viewer annotations." },
  { resource: "documents", action: "download", description: "Download protected document content.", sensitive: true },
  { resource: "documents", action: "print", description: "Print protected document content.", sensitive: true },
  { resource: "documents", action: "share", description: "Share protected document links or exports.", sensitive: true },
  { resource: "documents", action: "manageAccess", description: "Manage restricted document access.", sensitive: true },
  { resource: "archive", action: "view", description: "View archive module." },
  { resource: "archive", action: "manage", description: "Manage archive records and QC.", sensitive: true },
  { resource: "archive", action: "lock", description: "Final-lock archive records.", sensitive: true },
  { resource: "minutes", action: "view", description: "View minutes." },
  { resource: "minutes", action: "manage", description: "Draft and manage minutes.", sensitive: true },
  { resource: "minutes", action: "approve", description: "Approve minutes.", sensitive: true },
  { resource: "minutes", action: "lock", description: "Lock minutes.", sensitive: true },
  { resource: "resolutions", action: "view", description: "View resolutions." },
  { resource: "resolutions", action: "manage", description: "Create and update resolutions.", sensitive: true },
  { resource: "resolutions", action: "publish", description: "Publish resolutions.", sensitive: true },
  { resource: "actionItems", action: "view", description: "View action items." },
  { resource: "actionItems", action: "manage", description: "Create and assign action items.", sensitive: true },
  { resource: "actionItems", action: "updateAssigned", description: "Update assigned action item status." },
  { resource: "actionItems", action: "close", description: "Approve action item closure.", sensitive: true },
  { resource: "committees", action: "view", description: "View committees." },
  { resource: "committees", action: "manage", description: "Manage committees.", sensitive: true },
  { resource: "accessRequests", action: "view", description: "View restricted access requests." },
  { resource: "accessRequests", action: "create", description: "Create restricted access requests." },
  { resource: "accessRequests", action: "decide", description: "Approve or reject restricted access requests.", sensitive: true },
  { resource: "notifications", action: "viewOwn", description: "View own notifications." },
  { resource: "notifications", action: "updateOwn", description: "Mark own notifications read." },
  { resource: "reports", action: "view", description: "View reports." },
  { resource: "backup", action: "view", description: "View backup and DR posture.", sensitive: true },
  { resource: "backup", action: "manage", description: "Manage backup and DR operations.", sensitive: true },
  { resource: "admin", action: "view", description: "View admin panel.", sensitive: true },
  { resource: "admin", action: "manage", description: "Manage users, roles, and setup.", sensitive: true },
  { resource: "auditLogs", action: "view", description: "View audit logs.", sensitive: true },
  { resource: "auditLogs", action: "verify", description: "Verify audit hash chain.", sensitive: true },
  { resource: "auditLogs", action: "export", description: "Export audit logs.", sensitive: true },
  { resource: "devices", action: "manage", description: "Manage device trust status.", sensitive: true }
];

const allRoles: Role[] = [
  "SYSTEM_ADMIN",
  "COMPANY_SECRETARY",
  "BOARD_CHAIRMAN",
  "DIRECTOR",
  "COMMITTEE_MEMBER",
  "DEPARTMENT_USER",
  "ARCHIVE_USER",
  "AUDITOR"
] as Role[];

const governanceRoles: Role[] = [
  "SYSTEM_ADMIN",
  "COMPANY_SECRETARY",
  "BOARD_CHAIRMAN",
  "DIRECTOR",
  "COMMITTEE_MEMBER"
] as Role[];

const viewOnlyResources = [
  "dashboard:view",
  "meetings:view",
  "boardPacks:view",
  "documents:viewMetadata",
  "documents:viewContent",
  "documents:read",
  "documents:acknowledge",
  "minutes:view",
  "resolutions:view",
  "actionItems:view",
  "committees:view",
  "accessRequests:create",
  "notifications:viewOwn",
  "notifications:updateOwn",
  "reports:view"
];

function roleAllow(role: Role, pairs: string[]): RolePermissionDefault[] {
  return pairs.map((pair) => {
    const [resource, action] = pair.split(":");
    return { role, resource, action, effect: "ALLOW" as PermissionEffect };
  });
}

function roleDeny(role: Role, pairs: string[]): RolePermissionDefault[] {
  return pairs.map((pair) => {
    const [resource, action] = pair.split(":");
    return { role, resource, action, effect: "DENY" as PermissionEffect };
  });
}

export const rolePermissionDefaults: RolePermissionDefault[] = [
  ...allRoles.flatMap((role) => roleAllow(role, ["dashboard:view", "notifications:viewOwn", "notifications:updateOwn"])),
  ...governanceRoles.flatMap((role) =>
    roleAllow(role, [
      "meetings:view",
      "boardPacks:view",
      "boardPacks:acknowledge",
      "documents:viewMetadata",
      "documents:viewContent",
      "documents:read",
      "documents:acknowledge",
      "minutes:view",
      "resolutions:view",
      "actionItems:view",
      "committees:view",
      "accessRequests:create",
      "reports:view"
    ])
  ),
  ...roleAllow("SYSTEM_ADMIN" as Role, permissionDefinitions.map((permission) => `${permission.resource}:${permission.action}`)),
  ...roleAllow("COMPANY_SECRETARY" as Role, [
    ...viewOnlyResources,
    "memos:view",
    "memos:create",
    "memos:submit",
    "memos:secretaryReview",
    "memos:markForBoard",
    "meetings:manage",
    "meeting:view",
    "meeting:create",
    "meeting:edit",
    "meeting:submit",
    "meeting:publish",
    "meeting:manageParticipants",
    "agenda:view",
    "agenda:create",
    "agenda:edit",
    "agenda:delete",
    "agenda:reorder",
    "agenda:attachDocument",
    "agenda:linkMemo",
    "agenda:submit",
    "boardPacks:manage",
    "boardPacks:publish",
    "documents:upload",
    "documents:approve",
    "documents:manageAccess",
    "minutes:manage",
    "minutes:lock",
    "resolutions:manage",
    "resolutions:publish",
    "actionItems:manage",
    "actionItems:close",
    "committees:manage",
    "accessRequests:view",
    "accessRequests:decide",
    "backup:view"
  ]),
  ...roleAllow("BOARD_CHAIRMAN" as Role, [
    ...viewOnlyResources,
    "meeting:view",
    "meeting:approve",
    "agenda:view",
    "memos:view",
    "memos:chairmanApprove",
    "documents:approve",
    "minutes:approve",
    "minutes:lock",
    "resolutions:publish",
    "actionItems:close",
    "accessRequests:view",
    "accessRequests:decide",
    "backup:view"
  ]),
  ...roleAllow("DIRECTOR" as Role, [...viewOnlyResources, "meeting:view", "agenda:view", "memos:view", "actionItems:updateAssigned"]),
  ...roleAllow("COMMITTEE_MEMBER" as Role, [...viewOnlyResources, "meeting:view", "agenda:view", "memos:view", "memos:create", "memos:submit", "actionItems:updateAssigned"]),
  ...roleAllow("DEPARTMENT_USER" as Role, [
    "dashboard:view",
    "memos:view",
    "memos:create",
    "memos:submit",
    "documents:viewMetadata",
    "documents:upload",
    "documents:read",
    "documents:acknowledge",
    "accessRequests:create",
    "notifications:viewOwn",
    "notifications:updateOwn",
    "meeting:view",
    "agenda:view",
    "actionItems:view",
    "actionItems:updateAssigned"
  ]),
  ...roleAllow("ARCHIVE_USER" as Role, [
    "dashboard:view",
    "documents:viewMetadata",
    "documents:viewContent",
    "documents:upload",
    "documents:read",
    "documents:acknowledge",
    "archive:view",
    "archive:manage",
    "archive:lock",
    "accessRequests:create",
    "notifications:viewOwn",
    "notifications:updateOwn",
    "meeting:view",
    "agenda:view",
    "actionItems:view",
    "actionItems:updateAssigned",
    "reports:view"
  ]),
  ...roleAllow("AUDITOR" as Role, [
    "dashboard:view",
    "documents:viewMetadata",
    "accessRequests:view",
    "reports:view",
    "auditLogs:view",
    "auditLogs:verify",
    "auditLogs:export",
    "backup:view",
    "notifications:viewOwn",
    "notifications:updateOwn",
    "meeting:view",
    "agenda:view"
  ]),
  ...roleAllow("SYSTEM_ADMIN" as Role, [
    "meeting:view",
    "meeting:create",
    "meeting:edit",
    "meeting:submit",
    "meeting:approve",
    "meeting:publish",
    "meeting:manageParticipants",
    "agenda:view",
    "agenda:create",
    "agenda:edit",
    "agenda:delete",
    "agenda:reorder",
    "agenda:attachDocument",
    "agenda:linkMemo",
    "agenda:submit"
  ]),
  ...roleDeny("DIRECTOR" as Role, ["meeting:create", "meeting:edit", "meeting:publish", "meeting:manageParticipants", "agenda:create", "agenda:edit", "agenda:reorder"]),
  ...roleDeny("COMMITTEE_MEMBER" as Role, ["meeting:create", "meeting:edit", "meeting:publish", "meeting:manageParticipants", "agenda:create", "agenda:edit", "agenda:reorder"]),
  ...roleDeny("DEPARTMENT_USER" as Role, ["meeting:create", "meeting:edit", "meeting:publish", "meeting:manageParticipants", "agenda:create", "agenda:edit", "agenda:reorder"]),
  ...roleDeny("ARCHIVE_USER" as Role, ["meeting:create", "meeting:edit", "meeting:publish", "meeting:manageParticipants", "agenda:create", "agenda:edit", "agenda:reorder"]),
  ...roleDeny("AUDITOR" as Role, ["meeting:create", "meeting:edit", "meeting:publish", "meeting:manageParticipants", "agenda:create", "agenda:edit", "agenda:reorder"]),
  ...roleDeny("DEPARTMENT_USER" as Role, ["admin:view", "auditLogs:view", "documents:approve", "documents:manageAccess"]),
  ...roleAllow("SYSTEM_ADMIN" as Role, ["documents:download", "documents:print", "documents:share", "documents:annotate"]),
  ...roleAllow("COMPANY_SECRETARY" as Role, ["documents:annotate"]),
  ...governanceRoles.flatMap((role) => roleAllow(role, ["documents:annotate"])),
  ...roleDeny("AUDITOR" as Role, ["admin:manage", "devices:manage", "memos:chairmanApprove", "documents:approve"])
];

const roleModules: Record<Role, string[]> = {
  SYSTEM_ADMIN: [...moduleKeys],
  COMPANY_SECRETARY: [...moduleKeys],
  BOARD_CHAIRMAN: [
    "dashboard",
    "memo-workflow",
    "meetings",
    "board-packs",
    "documents",
    "minutes",
    "resolutions",
    "action-items",
    "committees",
    "access-requests",
    "notifications",
    "reports",
    "backup-dr",
    "audit-logs",
    "demo-journey",
    "search",
    "profile",
    "meeting-approvals"
  ],
  DIRECTOR: [
    "dashboard",
    "board-packs",
    "meetings",
    "minutes",
    "resolutions",
    "documents",
    "notifications",
    "search",
    "profile"
  ],
  COMMITTEE_MEMBER: [
    "dashboard",
    "memo-workflow",
    "meetings",
    "board-packs",
    "documents",
    "minutes",
    "resolutions",
    "action-items",
    "committees",
    "access-requests",
    "notifications",
    "reports",
    "demo-journey",
    "search",
    "profile"
  ],
  DEPARTMENT_USER: ["dashboard", "memo-workflow", "documents", "action-items", "access-requests", "notifications", "demo-journey", "search", "profile"],
  ARCHIVE_USER: ["dashboard", "documents", "archive", "action-items", "access-requests", "notifications", "reports", "demo-journey", "search", "profile"],
  AUDITOR: ["dashboard", "access-requests", "reports", "backup-dr", "audit-logs", "notifications", "demo-journey", "search", "profile"]
};

export const moduleVisibilityDefaults: VisibilityDefault[] = allRoles.flatMap((role) =>
  moduleKeys.map((key, index) => ({
    role,
    key,
    effect: roleModules[role].includes(key) ? ("ALLOW" as PermissionEffect) : ("DENY" as PermissionEffect),
    sortOrder: roleModules[role].includes(key)
      ? (roleModules[role].indexOf(key) + 1) * 10
      : portalModuleDefinitions.find((module) => module.key === key)?.sortOrder ?? index
  }))
);

const widgetRoles: Record<Role, string[]> = {
  SYSTEM_ADMIN: [
    "governance-hero",
    "user-statistics",
    "audit-warnings",
    "backup-status",
    "notifications"
  ],
  COMPANY_SECRETARY: [...dashboardWidgetKeys],
  BOARD_CHAIRMAN: [...dashboardWidgetKeys],
  DIRECTOR: [
    "current-board-pack",
    "upcoming-meetings",
    "pending-acknowledgments",
    "recent-minutes-resolutions",
    "committee-documents",
    "notifications"
  ],
  COMMITTEE_MEMBER: [
    "governance-hero",
    "meetings",
    "documents",
    "workflow-timeline",
    "upcoming-governance-work",
    "personal-action-items",
    "recent-secure-documents",
    "notifications",
    "quick-actions"
  ],
  DEPARTMENT_USER: ["governance-hero", "pending-approvals", "documents", "personal-action-items", "notifications", "quick-actions"],
  ARCHIVE_USER: ["governance-hero", "documents", "security-dr-posture", "personal-action-items", "notifications", "quick-actions"],
  AUDITOR: ["governance-hero", "audit-warnings", "security-dr-posture", "notifications"]
};

export const dashboardWidgetVisibilityDefaults: VisibilityDefault[] = allRoles.flatMap((role) =>
  dashboardWidgetKeys.map((key, index) => {
    const definition = dashboardWidgetDefinitions.find((widget) => widget.key === key);
    return {
      role,
      key,
      effect: widgetRoles[role].includes(key) ? ("ALLOW" as PermissionEffect) : ("DENY" as PermissionEffect),
      sortOrder: definition?.sortOrder ?? index,
      size: definition?.defaultSize
    };
  })
);

function categoryAllow(role: Role, category: string, actions: readonly string[]): DocumentCategoryPermissionDefault[] {
  return actions.map((action) => ({ role, category, action, effect: "ALLOW" as PermissionEffect }));
}

function categoryDeny(role: Role, category: string, actions: readonly string[]): DocumentCategoryPermissionDefault[] {
  return actions.map((action) => ({ role, category, action, effect: "DENY" as PermissionEffect }));
}

export const documentCategoryPermissionDefaults: DocumentCategoryPermissionDefault[] = [
  ...allRoles.flatMap((role) => categoryAllow(role, "*", ["viewMetadata"])),
  ...governanceRoles.flatMap((role) => categoryAllow(role, "*", ["viewContent"])),
  ...categoryAllow("SYSTEM_ADMIN" as Role, "*", documentCategoryActions),
  ...categoryAllow("COMPANY_SECRETARY" as Role, "*", documentCategoryActions),
  ...categoryAllow("BOARD_CHAIRMAN" as Role, "*", ["viewMetadata", "viewContent", "approve"]),
  ...categoryAllow("DEPARTMENT_USER" as Role, "Memo", ["viewMetadata", "upload"]),
  ...categoryAllow("DEPARTMENT_USER" as Role, "Financial Approval", ["viewMetadata", "upload"]),
  ...categoryAllow("DEPARTMENT_USER" as Role, "Supporting Attachment", ["viewMetadata", "upload"]),
  ...categoryAllow("ARCHIVE_USER" as Role, "Archive Document", documentCategoryActions),
  ...categoryAllow("ARCHIVE_USER" as Role, "*", ["viewMetadata", "viewContent"]),
  ...categoryAllow("AUDITOR" as Role, "*", ["viewMetadata"]),
  ...categoryDeny("DIRECTOR" as Role, "Legal Document", ["viewContent"]),
  ...categoryDeny("DEPARTMENT_USER" as Role, "Legal Document", ["viewContent", "approve"]),
  ...categoryDeny("AUDITOR" as Role, "*", ["upload", "approve"])
];

const baseWatermarkPolicy = {
  enabled: true,
  includeName: true,
  includeRole: true,
  includeTimestamp: true,
  includeIpAddress: true,
  includeDeviceId: true,
  opacity: 28,
  density: 18
};

export const watermarkPolicyDefaults: WatermarkPolicyDefault[] = [
  ...allRoles.map((role) => ({
    role,
    category: "*",
    ...baseWatermarkPolicy
  })),
  ...allRoles.map((role) => ({
    role,
    category: "Legal Document",
    ...baseWatermarkPolicy,
    opacity: 34,
    density: 22
  })),
  ...governanceRoles.map((role) => ({
    role,
    category: "Board Paper",
    ...baseWatermarkPolicy,
    opacity: 32,
    density: 20
  }))
];
