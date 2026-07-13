import type { MeetingStatus, Role } from "@prisma/client";

export type MeetingListView = "all" | "draft" | "pending-approval" | "published" | "completed";

const pendingChairmanReviewStatuses: MeetingStatus[] = [
  "PENDING_CHAIRMAN_REVIEW",
  // Retain visibility for records created before the current workflow status was introduced.
  "AGENDA_PREPARED"
];

export function isMeetingVisibleInList(status: MeetingStatus, requested: string, role: Role) {
  const view = normalizeMeetingListView(requested);

  // Secretary and Chairman deliberately share the submitted-meeting scope. Role is
  // explicit here so a later role scope cannot accidentally hide the review queue.
  if (view === "pending-approval" && (role === "COMPANY_SECRETARY" || role === "BOARD_CHAIRMAN")) {
    return pendingChairmanReviewStatuses.includes(status);
  }
  if (view === "draft") return status === "DRAFT";
  if (view === "pending-approval") return pendingChairmanReviewStatuses.includes(status);
  if (view === "published") return ["APPROVED_FOR_PUBLICATION", "PUBLISHED", "BOARD_PACK_PUBLISHED", "MEETING_HELD"].includes(status);
  if (view === "completed") return ["COMPLETED", "MINUTES_APPROVED", "RESOLUTIONS_PUBLISHED", "ARCHIVED"].includes(status);
  return true;
}

export function normalizeMeetingListView(requested: string): MeetingListView {
  return ["draft", "pending-approval", "published", "completed"].includes(requested)
    ? requested as MeetingListView
    : "all";
}

export function pendingApprovalLabel(role: Role) {
  return role === "BOARD_CHAIRMAN" ? "Meetings Awaiting Approval" : "Pending Approval";
}
