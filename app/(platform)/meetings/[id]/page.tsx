import Link from "next/link";
import { notFound } from "next/navigation";
import type React from "react";
import { MeetingWorkflowSteps } from "@/components/meeting-workflow-steps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireAuth } from "@/lib/auth";
import { confidentiality, statusLabel } from "@/lib/labels";
import { hasPermission, requireModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate, safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  await requireModule(auth.user, "meetings");
  if (!(await hasPermission(auth.user, "meeting", "view"))) notFound();
  const { id } = await params;
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      attendees: { include: { user: true } },
      agendaItems: { orderBy: { itemNumber: "asc" }, include: { documents: { include: { document: true } } } },
      boardPacks: true
    }
  });
  if (!meeting) notFound();
  const timeline = safeJson<string[]>(meeting.timelineJson, []);
  const myAttendance = meeting.attendees.find((attendee) => attendee.userId === auth.user.id);
  const linkedDocuments = meeting.agendaItems.flatMap((item) =>
    item.documents.map((link) => ({
      id: link.document.id,
      title: link.document.title,
      uploadedAt: link.document.createdAt
    }))
  );

  return (
    <PageShell
      eyebrow={meeting.meetingCode}
      title={meeting.title}
      description={`${formatDate(meeting.date)} ${meeting.time} · ${meeting.venueOnlineLink}`}
      actions={<StatusBadge value={meeting.status} />}
    >
      <div className="lg:hidden space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-bold text-bcb-ink">Attendance</h2>
          <p className="mt-2 text-sm text-slate-600">
            {myAttendance
              ? `Your attendance status: ${myAttendance.status}.`
              : "You are not listed as an attendee for this meeting."}
          </p>
          <Link
            href={`/meetings/${meeting.id}/attendees`}
            className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[#006A4E]"
          >
            View participants
          </Link>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-bold text-bcb-ink">Agenda</h2>
          <ol className="mt-3 space-y-2">
            {meeting.agendaItems.map((item) => (
              <li key={item.id} className="text-sm text-slate-700">
                {item.itemNumber}. {item.title}
              </li>
            ))}
            {meeting.agendaItems.length === 0 ? <li className="text-sm text-slate-500">No agenda items yet.</li> : null}
          </ol>
          <Link
            href={`/meetings/${meeting.id}/agenda`}
            className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[#006A4E]"
          >
            Open agenda builder
          </Link>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-bold text-bcb-ink">Documents</h2>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <span>Title</span>
              <span>Uploaded</span>
              <span />
            </div>
            {linkedDocuments.map((document) => (
              <div key={document.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-t border-slate-100 pt-3 text-sm">
                <span className="font-medium text-slate-800">{document.title}</span>
                <span className="text-xs text-slate-500">{formatDate(document.uploadedAt)}</span>
                <Link href={`/documents/${document.id}`} className="min-h-11 min-w-11 content-center text-right text-sm font-semibold text-[#006A4E]">
                  View
                </Link>
              </div>
            ))}
            {linkedDocuments.length === 0 ? <p className="text-sm text-slate-500">No linked documents yet.</p> : null}
          </div>
        </section>
      </div>

      <div className="hidden lg:block">
        <MeetingWorkflowSteps meetingId={meeting.id} active="details" />
        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Info label="Status" value={<StatusBadge value={meeting.status} />} />
              <Info label="Confidentiality" value={confidentiality(meeting.confidentiality)} />
              <Info label="Agenda items" value={meeting.agendaItems.length} />
              <Info label="Participants" value={meeting.attendees.length} />
              <Info label="Board packs" value={meeting.boardPacks.length} />
              <Info label="Type" value={statusLabel(meeting.meetingType)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Meeting Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {timeline.map((item) => (
                <p key={item} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {item}
                </p>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-bold text-bcb-ink">{value}</div>
    </div>
  );
}
