import { notFound } from "next/navigation";
import { MeetingWorkflowSteps } from "@/components/meeting-workflow-steps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/page-shell";
import { requireAuth } from "@/lib/auth";
import { hasPermission, requireModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MeetingAttendeesPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  await requireModule(auth.user, "meetings");
  if (!(await hasPermission(auth.user, "meeting", "view"))) notFound();
  const { id } = await params;
  const meeting = await prisma.meeting.findUnique({ where: { id }, include: { attendees: { include: { user: true } } } });
  if (!meeting) notFound();
  return (
    <PageShell eyebrow={meeting.meetingCode} title="Participants" description="Meeting participant and attendance response tracking.">
      <MeetingWorkflowSteps meetingId={meeting.id} active="participants" />
      <Card>
        <CardHeader><CardTitle>Participants</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {meeting.attendees.map((attendee) => (
            <div key={attendee.id} className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm">
              <span className="font-semibold text-bcb-ink">{attendee.user.name}</span>
              <span className="text-xs font-semibold text-slate-500">{attendee.status}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}
