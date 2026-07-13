import { notFound } from "next/navigation";
import { MeetingWorkflowSteps } from "@/components/meeting-workflow-steps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireAuth } from "@/lib/auth";
import { hasPermission, requireModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MeetingBoardPackPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  await requireModule(auth.user, "meetings");
  if (!(await hasPermission(auth.user, "boardPacks", "view"))) notFound();
  const { id } = await params;
  const meeting = await prisma.meeting.findUnique({ where: { id }, include: { boardPacks: true } });
  if (!meeting) notFound();
  return (
    <PageShell eyebrow={meeting.meetingCode} title="Board Pack" description="Board-pack assembly and publication history for this meeting.">
      <MeetingWorkflowSteps meetingId={meeting.id} active="board-pack" />
      <Card>
        <CardHeader><CardTitle>Board Packs</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {meeting.boardPacks.map((pack) => (
            <div key={pack.id} className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm">
              <span className="font-semibold text-bcb-ink">{pack.packCode}</span>
              <StatusBadge value={pack.status} />
            </div>
          ))}
          {!meeting.boardPacks.length ? <p className="text-sm text-slate-500">No board pack has been created for this meeting.</p> : null}
        </CardContent>
      </Card>
    </PageShell>
  );
}
