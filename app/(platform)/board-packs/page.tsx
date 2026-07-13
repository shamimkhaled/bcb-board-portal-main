import Link from "next/link";
import { Boxes, CheckCircle2, Eye } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime, percent } from "@/lib/utils";
import { requireModule } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function BoardPacksPage() {
  const auth = await requireAuth();
  await requireModule(auth.user, "board-packs");
  const packs = await prisma.boardPack.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      meeting: { include: { agendaItems: { include: { documents: true } } } },
      publishedBy: true,
      readAcknowledgments: true
    }
  });

  return (
    <PageShell
      eyebrow="Secure Board Packs"
      title="Board Packs"
      description="Agenda-wise document bundles with publication history, private notes, bookmarks, read tracking, and director acknowledgment status."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Board packs" value={packs.length} detail="Published or ready for publication" icon={Boxes} tone="navy" />
        <MetricCard label="Read events" value={packs.reduce((sum, pack) => sum + pack.readAcknowledgments.filter((ack) => ack.type === "READ").length, 0)} detail="Page-level secure viewer reads" icon={Eye} tone="green" />
        <MetricCard label="Acknowledgments" value={packs.reduce((sum, pack) => sum + pack.readAcknowledgments.filter((ack) => ack.type === "ACK").length, 0)} detail="Document and pack acknowledgment records" icon={CheckCircle2} tone="gold" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {packs.map((pack) => {
          const docCount = pack.meeting.agendaItems.reduce((sum, item) => sum + item.documents.length, 0);
          const ackRate = percent(pack.readAcknowledgments.filter((ack) => ack.type === "ACK").length, Math.max(1, docCount));
          return (
            <Card key={pack.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-bcb-green">{pack.packCode}</p>
                    <CardTitle className="mt-2">{pack.meeting.title}</CardTitle>
                  </div>
                  <StatusBadge value={pack.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Agenda documents</p>
                    <p className="mt-1 text-2xl font-bold text-bcb-navy">{docCount}</p>
                  </div>
                  <div className="rounded-lg border bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Acknowledgment</p>
                    <p className="mt-1 text-2xl font-bold text-bcb-navy">{ackRate}%</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  Published by {pack.publishedBy?.name ?? "Not yet published"} · {formatDateTime(pack.publishedAt)}
                </p>
                <Button asChild className="w-full">
                  <Link href={`/board-packs/${pack.id}`}>Open board pack viewer</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
