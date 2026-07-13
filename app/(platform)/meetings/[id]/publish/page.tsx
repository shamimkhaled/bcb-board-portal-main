import { notFound } from "next/navigation";
import { MeetingWorkflowSteps } from "@/components/meeting-workflow-steps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/page-shell";
import { requireAuth } from "@/lib/auth";
import { hasPermission, requireModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MeetingPublishPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  await requireModule(auth.user, "meetings");
  if (!(await hasPermission(auth.user, "meeting", "publish"))) notFound();
  const { id } = await params;
  const meeting = await prisma.meeting.findUnique({ where: { id }, include: { attendees: true, agendaItems: true, boardPacks: true } });
  if (!meeting) notFound();
  return (
    <PageShell eyebrow={meeting.meetingCode} title="Publish Meeting" description="Validate meeting details, participants, agenda, and board-pack readiness before publication.">
      <MeetingWorkflowSteps meetingId={meeting.id} active="publish" />
      <Card>
        <CardHeader><CardTitle>Publication Readiness</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Readiness label="Participants" ok={meeting.attendees.length > 0} />
          <Readiness label="Agenda" ok={meeting.agendaItems.length > 0} />
          <Readiness label="Board pack" ok={meeting.boardPacks.length > 0} />
        </CardContent>
      </Card>
    </PageShell>
  );
}

function Readiness({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={ok ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-900" : "rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900"}>
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-1 text-xs">{ok ? "Ready" : "Needs attention"}</p>
    </div>
  );
}
