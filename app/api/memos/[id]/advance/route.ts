import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { MemoStatus } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import { getCurrentAuth, getRequestMeta } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

const transitionMap: Record<string, { status: MemoStatus; comment: string; permission: string }> = {
  submit: { status: MemoStatus.SUBMITTED, comment: "Memo submitted for Secretary review.", permission: "submit" },
  secretary_review: {
    status: MemoStatus.CHAIRMAN_APPROVAL_PENDING,
    comment: "Secretary reviewed memo and forwarded to Chairman.",
    permission: "secretaryReview"
  },
  return: {
    status: MemoStatus.RETURNED_FOR_CORRECTION,
    comment: "Secretary returned memo for correction.",
    permission: "secretaryReview"
  },
  chairman_approve: {
    status: MemoStatus.APPROVED,
    comment: "Chairman approved memo.",
    permission: "chairmanApprove"
  },
  reject: {
    status: MemoStatus.REJECTED,
    comment: "Chairman rejected memo.",
    permission: "chairmanApprove"
  },
  mark_for_board: {
    status: MemoStatus.MARKED_FOR_BOARD_MEETING,
    comment: "Memo marked for board meeting agenda.",
    permission: "markForBoard"
  }
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action } = (await request.json()) as { action?: string };
  const transition = action ? transitionMap[action] : null;
  if (!transition) return NextResponse.json({ error: "Unknown transition" }, { status: 400 });
  if (!(await hasPermission(auth.user, "memos", transition.permission))) {
    return NextResponse.json({ error: "Memo transition permission required" }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await prisma.memo.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Memo not found" }, { status: 404 });

  const memo = await prisma.memo.update({
    where: { id },
    data: { status: transition.status }
  });
  await prisma.memoHistory.create({
    data: {
      id: `memo-history-${randomUUID()}`,
      memoId: memo.id,
      actorId: auth.user.id,
      status: transition.status,
      comment: transition.comment
    }
  });

  const { ipAddress, browser } = getRequestMeta(request);
  await createAuditLog({
    user: auth.user,
    actionType: "MEMO_STATUS_CHANGED",
    objectType: "Memo",
    objectId: memo.id,
    previousValue: existing.status,
    newValue: memo.status,
    ipAddress,
    browser,
    deviceId: auth.session.deviceId,
    sessionId: auth.session.sessionToken,
    result: "Success",
    remarks: transition.comment
  });

  return NextResponse.json({ ok: true, status: memo.status });
}
