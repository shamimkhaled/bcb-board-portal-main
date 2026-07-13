import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { MeetingStatus, MemoStatus } from "@prisma/client";
import { assertEditableMeeting, parseAgendaPayload } from "@/lib/agenda";
import { createAuditLog } from "@/lib/audit";
import { getCurrentAuth, getRequestMeta } from "@/lib/auth";
import { canAccessDocumentCategory, hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: meetingId } = await params;
  try {
    const body = await request.json() as Record<string, unknown>;
    if (body.intent === "submit") return submitAgenda(request, auth, meetingId);
    if (!(await hasPermission(auth.user, "agenda", "create"))) return forbidden();
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    assertEditableMeeting(meeting.status);
    const data = parseAgendaPayload(body);
    await validateMemo(data.memoId, auth.user.id);
    await validateDocuments(data.documentIds, auth.user);
    const item = await prisma.$transaction(async (tx) => {
      const last = await tx.agendaItem.findFirst({ where: { meetingId }, orderBy: { sortOrder: "desc" } });
      const sortOrder = (last?.sortOrder ?? 0) + 1;
      const created = await tx.agendaItem.create({ data: {
        id: `agenda-${randomUUID()}`, meetingId, itemNumber: sortOrder, sortOrder, title: data.title,
        summary: data.summary, decisionSummary: data.summary, presenter: data.presenter,
        responsibleDepartment: data.responsibleDepartment, estimatedDuration: data.estimatedDuration,
        decisionType: data.decisionType, confidentiality: data.confidentiality,
        secretaryNotes: data.secretaryNotes ?? "", memoId: data.memoId, status: "DRAFT",
        documents: { create: data.documentIds.map((documentId) => ({ id: `agenda-document-${randomUUID()}`, documentId })) }
      }});
      if (meeting.status === MeetingStatus.DRAFT) await tx.meeting.update({ where: { id: meetingId }, data: { status: MeetingStatus.AGENDA_PREPARATION } });
      return created;
    });
    await audit(request, auth, "AGENDA_ITEM_CREATED", item.id, null, JSON.stringify(data));
    return NextResponse.json({ id: item.id }, { status: 201 });
  } catch (error) { return badRequest(error); }
}

async function submitAgenda(request: NextRequest, auth: NonNullable<Awaited<ReturnType<typeof getCurrentAuth>>>, meetingId: string) {
  if (!(await hasPermission(auth.user, "agenda", "submit"))) return forbidden();
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId }, include: { agendaItems: true, attendees: true } });
  if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  assertEditableMeeting(meeting.status);
  if (!meeting.agendaItems.length) throw new Error("Add at least one agenda item before submission.");
  if (!meeting.title || !meeting.date || !meeting.time || !meeting.venueOnlineLink) throw new Error("Complete the required meeting fields before submission.");
  if (!meeting.attendees.length) throw new Error("Add required participants before submission.");
  const chairmen = await prisma.user.findMany({ where: { role: "BOARD_CHAIRMAN", status: "Active" } });
  await prisma.$transaction(async (tx) => {
    await tx.meeting.update({ where: { id: meetingId }, data: { status: MeetingStatus.PENDING_CHAIRMAN_REVIEW } });
    await tx.notification.createMany({ data: chairmen.map((chairman) => ({ id: `notification-${randomUUID()}`, userId: chairman.id, type: "Agenda review", title: `${meeting.meetingCode} agenda requires review`, body: "The Company Secretary submitted the agenda for Chairman review.", channelLog: JSON.stringify({ inApp: "Created" }) })) });
  });
  await audit(request, auth, "AGENDA_SUBMITTED_FOR_REVIEW", meetingId, meeting.status, MeetingStatus.PENDING_CHAIRMAN_REVIEW);
  return NextResponse.json({ status: MeetingStatus.PENDING_CHAIRMAN_REVIEW });
}

async function validateMemo(memoId: string | null, userId: string) {
  if (!memoId) return;
  const memo = await prisma.memo.findFirst({ where: { id: memoId, status: { in: [MemoStatus.APPROVED, MemoStatus.MARKED_FOR_BOARD_MEETING] } } });
  if (!memo) throw new Error("The selected memo is not eligible or visible.");
  void userId;
}

async function validateDocuments(ids: string[], user: Parameters<typeof canAccessDocumentCategory>[0]) {
  for (const id of ids) {
    const document = await prisma.document.findUnique({ where: { id }, select: { documentType: true } });
    if (!document || !(await canAccessDocumentCategory(user, document.documentType, "viewMetadata"))) throw new Error("A selected document is not accessible.");
  }
}

async function audit(request: NextRequest, auth: NonNullable<Awaited<ReturnType<typeof getCurrentAuth>>>, actionType: string, objectId: string, previousValue: string | null, newValue: string | null) {
  const meta = getRequestMeta(request);
  await createAuditLog({ user: auth.user, actionType, objectType: "AgendaItem", objectId, previousValue, newValue, ...meta, deviceId: auth.session.deviceId, sessionId: auth.session.sessionToken });
}
const forbidden = () => NextResponse.json({ error: "Agenda permission required" }, { status: 403 });
const badRequest = (error: unknown) => NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request" }, { status: 400 });
