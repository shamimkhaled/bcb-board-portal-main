import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { MemoStatus } from "@prisma/client";
import { assertEditableMeeting, parseAgendaPayload } from "@/lib/agenda";
import { createAuditLog } from "@/lib/audit";
import { getCurrentAuth, getRequestMeta } from "@/lib/auth";
import { canAccessDocumentCategory, hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const auth = await getCurrentAuth();
  if (!auth) return jsonError("Unauthorized", 401);
  const { id: meetingId, itemId } = await context.params;
  try {
    const item = await loadItem(meetingId, itemId);
    const body = await request.json() as Record<string, unknown>;
    const intent = String(body.intent ?? "edit");
    if (intent === "reorder") {
      if (!(await hasPermission(auth.user, "agenda", "reorder"))) return jsonError("Agenda reorder permission required", 403);
      const direction = body.direction === "up" ? -1 : body.direction === "down" ? 1 : 0;
      if (!direction) throw new Error("Invalid reorder direction.");
      const sibling = await prisma.agendaItem.findFirst({ where: { meetingId, sortOrder: direction < 0 ? { lt: item.sortOrder } : { gt: item.sortOrder } }, orderBy: { sortOrder: direction < 0 ? "desc" : "asc" } });
      if (sibling) await prisma.$transaction([
        prisma.agendaItem.update({ where: { id: item.id }, data: { sortOrder: sibling.sortOrder, itemNumber: sibling.itemNumber } }),
        prisma.agendaItem.update({ where: { id: sibling.id }, data: { sortOrder: item.sortOrder, itemNumber: item.itemNumber } })
      ]);
      await audit(request, auth, "AGENDA_REORDERED", item.id, String(item.sortOrder), sibling ? String(sibling.sortOrder) : String(item.sortOrder));
    } else if (intent === "attach") {
      if (!(await hasPermission(auth.user, "agenda", "attachDocument"))) return jsonError("Document attachment permission required", 403);
      const documentId = String(body.documentId ?? "");
      const document = await prisma.document.findUnique({ where: { id: documentId }, select: { id: true, documentType: true } });
      if (!document || !(await canAccessDocumentCategory(auth.user, document.documentType, "viewMetadata"))) throw new Error("Document is not accessible.");
      await prisma.agendaDocument.upsert({ where: { agendaItemId_documentId: { agendaItemId: item.id, documentId } }, update: {}, create: { id: `agenda-document-${randomUUID()}`, agendaItemId: item.id, documentId } });
      await audit(request, auth, "AGENDA_DOCUMENT_ATTACHED", item.id, null, documentId);
    } else if (intent === "linkMemo") {
      if (!(await hasPermission(auth.user, "agenda", "linkMemo"))) return jsonError("Memo linking permission required", 403);
      const memoId = String(body.memoId ?? "");
      const memo = await prisma.memo.findFirst({ where: { id: memoId, status: { in: [MemoStatus.APPROVED, MemoStatus.MARKED_FOR_BOARD_MEETING] } } });
      if (!memo) throw new Error("Memo is not eligible or visible.");
      await prisma.agendaItem.update({ where: { id: item.id }, data: { memoId } });
      await audit(request, auth, "AGENDA_MEMO_LINKED", item.id, item.memoId, memoId);
    } else {
      if (!(await hasPermission(auth.user, "agenda", "edit"))) return jsonError("Agenda edit permission required", 403);
      const data = parseAgendaPayload(body);
      const { documentIds: _documentIds, ...updateData } = data;
      const updated = await prisma.agendaItem.update({ where: { id: item.id }, data: { ...updateData, secretaryNotes: data.secretaryNotes ?? "", decisionSummary: data.summary } });
      await audit(request, auth, "AGENDA_ITEM_UPDATED", item.id, JSON.stringify(item), JSON.stringify(updated));
    }
    return NextResponse.json({ ok: true });
  } catch (error) { return jsonError(error instanceof Error ? error.message : "Invalid request", 400); }
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await getCurrentAuth();
  if (!auth) return jsonError("Unauthorized", 401);
  if (!(await hasPermission(auth.user, "agenda", "delete"))) return jsonError("Agenda delete permission required", 403);
  const { id: meetingId, itemId } = await context.params;
  try {
    const item = await loadItem(meetingId, itemId);
    if (item.status !== "DRAFT") throw new Error("Only draft agenda items can be deleted.");
    await prisma.$transaction(async (tx) => {
      await tx.agendaItem.delete({ where: { id: item.id } });
      const remaining = await tx.agendaItem.findMany({ where: { meetingId }, orderBy: { sortOrder: "asc" } });
      for (let index = 0; index < remaining.length; index++) await tx.agendaItem.update({ where: { id: remaining[index].id }, data: { sortOrder: index + 1, itemNumber: index + 1 } });
    });
    await audit(request, auth, "AGENDA_ITEM_REMOVED", item.id, JSON.stringify(item), null);
    return NextResponse.json({ ok: true });
  } catch (error) { return jsonError(error instanceof Error ? error.message : "Invalid request", 400); }
}

async function loadItem(meetingId: string, itemId: string) {
  const item = await prisma.agendaItem.findFirst({ where: { id: itemId, meetingId }, include: { meeting: true } });
  if (!item) throw new Error("Agenda item not found.");
  assertEditableMeeting(item.meeting.status);
  return item;
}

async function audit(request: NextRequest, auth: NonNullable<Awaited<ReturnType<typeof getCurrentAuth>>>, actionType: string, objectId: string, previousValue: string | null, newValue: string | null) {
  await createAuditLog({ user: auth.user, actionType, objectType: "AgendaItem", objectId, previousValue, newValue, ...getRequestMeta(request), deviceId: auth.session.deviceId, sessionId: auth.session.sessionToken });
}
const jsonError = (error: string, status: number) => NextResponse.json({ error }, { status });
