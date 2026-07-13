import { notFound } from "next/navigation";
import { MeetingWorkflowSteps } from "@/components/meeting-workflow-steps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/page-shell";
import { requireAuth } from "@/lib/auth";
import { hasPermission, requireModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MeetingEditPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  await requireModule(auth.user, "meetings");
  if (!(await hasPermission(auth.user, "meeting", "edit"))) notFound();
  const { id } = await params;
  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting) notFound();
  return (
    <PageShell eyebrow={meeting.meetingCode} title="Review Meeting" description="Review and edit controls for draft meeting details.">
      <MeetingWorkflowSteps meetingId={meeting.id} active="review" />
      <Card><CardHeader><CardTitle>Review</CardTitle></CardHeader><CardContent className="text-sm text-slate-600">Draft edit controls are permission-protected and ready for detailed field editing.</CardContent></Card>
    </PageShell>
  );
}
