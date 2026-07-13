import { notFound } from "next/navigation";
import { MeetingWorkflowSteps } from "@/components/meeting-workflow-steps";
import { AgendaBuilder } from "@/components/agenda-builder";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/page-shell";
import { requireAuth } from "@/lib/auth";
import { canAccessDocumentCategory, hasPermission, requireModule } from "@/lib/permissions";
import { editableMeetingStatuses } from "@/lib/agenda";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MeetingAgendaPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  await requireModule(auth.user, "meetings");
  if (!(await hasPermission(auth.user, "agenda", "view"))) notFound();
  const { id } = await params;
  const meeting = await prisma.meeting.findUnique({ where: { id }, include: { agendaItems: { orderBy: { sortOrder: "asc" }, include: { memo: { select: { id: true, memoId: true, title: true } }, documents: { include: { document: { select: { id: true, documentId: true, title: true } } } } } } } });
  if (!meeting) notFound();
  const [permissionValues, documentRows, memos] = await Promise.all([
    Promise.all(["create", "edit", "delete", "reorder", "attachDocument", "linkMemo", "submit"].map((action) => hasPermission(auth.user, "agenda", action))),
    prisma.document.findMany({ select: { id: true, documentId: true, title: true, documentType: true }, orderBy: { title: "asc" } }),
    prisma.memo.findMany({ where: { status: { in: ["APPROVED", "MARKED_FOR_BOARD_MEETING"] } }, select: { id: true, memoId: true, title: true }, orderBy: { title: "asc" } })
  ]);
  const accessibleDocuments = (await Promise.all(documentRows.map(async (document) => (await canAccessDocumentCategory(auth.user, document.documentType, "viewMetadata")) ? document : null))).filter((document): document is NonNullable<typeof document> => Boolean(document));
  const permissions = Object.fromEntries(["create", "edit", "delete", "reorder", "attachDocument", "linkMemo", "submit"].map((key, index) => [key, permissionValues[index]])) as { create: boolean; edit: boolean; delete: boolean; reorder: boolean; attachDocument: boolean; linkMemo: boolean; submit: boolean };
  return (
    <PageShell eyebrow={meeting.meetingCode} title="Agenda" description="Official meeting agenda builder and preview.">
      <MeetingWorkflowSteps meetingId={meeting.id} active="agenda" />
      <Card className="overflow-hidden"><AgendaBuilder meetingId={meeting.id} items={meeting.agendaItems} editable={editableMeetingStatuses.has(meeting.status)} permissions={permissions} documents={accessibleDocuments.map((document) => ({ id: document.id, label: `${document.documentId} — ${document.title}` }))} memos={memos.map((memo) => ({ id: memo.id, label: `${memo.memoId} — ${memo.title}` }))} /></Card>
    </PageShell>
  );
}
