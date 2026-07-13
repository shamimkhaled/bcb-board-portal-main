import assert from "node:assert/strict";
import { MeetingStatus, Role } from "@prisma/client";
import { isMeetingVisibleInList, pendingApprovalLabel } from "../lib/meeting-list-filter";

const submitted = MeetingStatus.PENDING_CHAIRMAN_REVIEW;

assert.equal(
  isMeetingVisibleInList(submitted, "all", Role.COMPANY_SECRETARY),
  true,
  "submitted meeting appears in All Meetings"
);
assert.equal(
  isMeetingVisibleInList(submitted, "pending-approval", Role.COMPANY_SECRETARY),
  true,
  "submitted meeting appears in Pending Approval for Secretary"
);
assert.equal(
  isMeetingVisibleInList(submitted, "pending-approval", Role.BOARD_CHAIRMAN),
  true,
  "submitted meeting appears in Awaiting Approval for Chairman"
);
assert.equal(
  isMeetingVisibleInList(submitted, "draft", Role.COMPANY_SECRETARY),
  false,
  "submitted meeting no longer appears in Draft"
);
assert.equal(pendingApprovalLabel(Role.BOARD_CHAIRMAN), "Meetings Awaiting Approval");
assert.equal(pendingApprovalLabel(Role.COMPANY_SECRETARY), "Pending Approval");

console.log("Meeting list filter tests passed.");
