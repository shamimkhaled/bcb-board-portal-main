import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ConfidentialityLevel, MemoStatus } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import { getCurrentAuth, getRequestMeta } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await hasPermission(auth.user, "memos", "create"))) {
    return NextResponse.json({ error: "Memo creation permission required" }, { status: 403 });
  }
  const body = (await request.json()) as {
    title?: string;
    originatingDepartment?: string;
    documentType?: string;
    confidentiality?: ConfidentialityLevel;
    requestedDecision?: string;
  };

  const count = await prisma.memo.count();
  const memo = await prisma.memo.create({
    data: {
      id: `memo-${randomUUID()}`,
      memoId: `BCB-MEMO-2026-${String(count + 1).padStart(3, "0")}`,
      title: body.title || "Untitled board memo",
      originatingDepartment: body.originatingDepartment || auth.user.department || "Department",
      submittedById: auth.user.id,
      documentType: body.documentType || "Memo",
      confidentiality: body.confidentiality || "INTERNAL",
      supportingAttachments: "Pending upload",
      requestedDecision: body.requestedDecision || "Decision requested from approving authority.",
      relatedCommitteeId: null,
      relatedMeetingId: null,
      status: MemoStatus.DRAFT
    }
  });

  const { ipAddress, browser } = getRequestMeta(request);
  await createAuditLog({
    user: auth.user,
    actionType: "MEMO_CREATED",
    objectType: "Memo",
    objectId: memo.id,
    ipAddress,
    browser,
    deviceId: auth.session.deviceId,
    sessionId: auth.session.sessionToken,
    result: "Success",
    remarks: "Department memo created."
  });

  return NextResponse.json({ ok: true, memoId: memo.memoId });
}
