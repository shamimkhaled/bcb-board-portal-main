import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, NotebookPen } from "lucide-react";
import { BoardPackAckButton } from "@/components/board-pack-ack-button";
import { SecureViewer } from "@/components/secure-viewer";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { getServerMeta, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, safeJson } from "@/lib/utils";
import { hasPermission, requireModule } from "@/lib/permissions";
import { createSecureViewSession } from "@/lib/secure-document-viewer";

export const dynamic = "force-dynamic";

export default async function BoardPackDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireAuth();
  await requireModule(auth.user, "board-packs");
  if (!(await hasPermission(auth.user, "boardPacks", "view"))) notFound();
  const { id } = await params;
  const pack = await prisma.boardPack.findUnique({
    where: { id },
    include: {
      readAcknowledgments: true,
      meeting: {
        include: {
          agendaItems: {
            orderBy: { itemNumber: "asc" },
            include: {
              memo: true,
              documents: { include: { document: true } }
            }
          }
        }
      }
    }
  });

  if (!pack) notFound();

  const firstDocument = pack.meeting.agendaItems.flatMap((item) => item.documents)[0]?.document;
  const acknowledged = pack.readAcknowledgments.some((ack) => ack.userId === auth.user.id && ack.type === "ACK" && ack.boardPackId === pack.id);
  const history = safeJson<string[]>(pack.historyJson, []);
  const viewerSession = firstDocument
    ? await createSecureViewSession(auth, firstDocument, { type: "board-pack", id: pack.id }, await getServerMeta()).catch(() => null)
    : null;

  return (
    <PageShell
      eyebrow="Board Pack Viewer"
      title={pack.meeting.title}
      description={`${formatDate(pack.meeting.date)} · ${pack.meeting.time} · ${pack.meeting.venueOnlineLink}`}
      actions={<BoardPackAckButton packId={pack.id} acknowledged={acknowledged} />}
    >
      <div className="grid gap-5 xl:grid-cols-[300px_1fr_280px]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Agenda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pack.meeting.agendaItems.map((item) => (
              <div key={item.id} className="rounded-lg border bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-bcb-ink">{item.itemNumber}. {item.title}</p>
                  <StatusBadge value={item.status} />
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">{item.decisionSummary}</p>
                <div className="mt-3 space-y-1">
                  {item.documents.map((link) => (
                    <Link key={link.id} href={`/documents/${link.document.id}`} className="block rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-bcb-green hover:bg-emerald-50">
                      {link.document.documentId}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {firstDocument ? (
          viewerSession ? (
            <SecureViewer
              compact
              session={viewerSession}
              initialRead={pack.readAcknowledgments.some((ack) => ack.userId === auth.user.id && ack.type === "READ")}
              initialAck={acknowledged}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-sm text-slate-500">You are not authorized to view the first document in this board pack.</CardContent>
            </Card>
          )
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-sm text-slate-500">No document attached to this board pack.</CardContent>
          </Card>
        )}

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Private Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea className="min-h-40 w-full rounded-md border bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-bcb-green" placeholder="Private demo note per agenda item..." />
            <div className="rounded-lg border bg-amber-50 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-950">
                <Bookmark className="h-4 w-4" />
                Bookmarks
              </div>
              <p className="mt-2 text-xs leading-5 text-amber-900">Demo bookmark saved to page 1 of the active document.</p>
            </div>
            <div className="rounded-lg border bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-bcb-ink">
                <NotebookPen className="h-4 w-4 text-bcb-green" />
                Publication history
              </div>
              <div className="mt-2 space-y-1">
                {history.map((event) => (
                  <p key={event} className="text-xs leading-5 text-slate-600">{event}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
