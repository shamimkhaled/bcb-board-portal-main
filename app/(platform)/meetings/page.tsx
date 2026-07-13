import Link from "next/link";
import { CalendarDays, ClipboardList, Plus, UsersRound } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { confidentiality, role, statusLabel } from "@/lib/labels";
import { formatDate, safeJson } from "@/lib/utils";
import { getVisibleModules, hasPermission, requireModule } from "@/lib/permissions";
import { isMeetingVisibleInList, pendingApprovalLabel } from "@/lib/meeting-list-filter";

export const dynamic = "force-dynamic";

export default async function MeetingsPage({
  searchParams
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const auth = await requireAuth();
  await requireModule(auth.user, "meetings");
  const requested = (await searchParams)?.status ?? "all";
  const canCreateMeeting = await hasPermission(auth.user, "meeting", "create");
  const visibleModules = await getVisibleModules(auth.user);
  const visibleMeetingModules = visibleModules
    .filter((module) =>
      ["meetings", "meeting-create", "meeting-approvals", "agenda-builder", "board-pack-assembly", "attendance-tracking"].includes(
        module.key
      )
    )
    .map((module) => module.key);
  const diagnosticPermissions = {
    "meeting.view": await hasPermission(auth.user, "meeting", "view"),
    "meeting.create": canCreateMeeting,
    "meeting.edit": await hasPermission(auth.user, "meeting", "edit"),
    "meeting.submit": await hasPermission(auth.user, "meeting", "submit"),
    "meeting.approve": await hasPermission(auth.user, "meeting", "approve"),
    "meeting.publish": await hasPermission(auth.user, "meeting", "publish"),
    "meeting.manageParticipants": await hasPermission(auth.user, "meeting", "manageParticipants"),
    "agenda.view": await hasPermission(auth.user, "agenda", "view"),
    "agenda.create": await hasPermission(auth.user, "agenda", "create"),
    "agenda.edit": await hasPermission(auth.user, "agenda", "edit"),
    "agenda.reorder": await hasPermission(auth.user, "agenda", "reorder")
  };
  if (process.env.NODE_ENV !== "production") {
    console.log("[meeting-diagnostics]", {
      userId: auth.user.id,
      role: auth.user.role,
      effectivePermissions: diagnosticPermissions,
      visibleMeetingModules,
      meetingCreate: canCreateMeeting
    });
  }
  const meetings = await prisma.meeting.findMany({
    orderBy: { date: "asc" },
    include: {
      committee: true,
      attendees: { include: { user: true } },
      agendaItems: {
        orderBy: { itemNumber: "asc" },
        include: { memo: true, documents: { include: { document: true } } }
      },
      boardPacks: true
    }
  });
  const filteredMeetings = meetings.filter((meeting) => isMeetingVisibleInList(meeting.status, requested, auth.user.role));
  const actions = (
    <>
      {canCreateMeeting ? (
        <Button asChild className="min-h-11">
          <Link href="/meetings/new">
            <Plus className="h-4 w-4" />
            Create Meeting
          </Link>
        </Button>
      ) : null}
    </>
  );

  const signedInLabel = `Signed in as ${auth.user.name.split(" ")[0]?.toLowerCase() ?? "user"} · ${role(auth.user.role)}`;

  return (
    <PageShell
      eyebrow="Meeting Management"
      title="Meetings"
      description="Meetings you've been invited to, most recent first."
      actions={
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <span className="inline-flex items-center justify-center rounded-full bg-[color:var(--theme-navigation-active)] px-3 py-1.5 text-xs font-semibold text-primary lg:hidden">
            {signedInLabel}
          </span>
          {actions}
        </div>
      }
    >
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible">
        {[
          ["/meetings", "All Meetings"],
          ["/meetings/new", "Create Meeting"],
          ["/meetings?status=draft", "Draft Meetings"],
          ["/meetings?status=pending-approval", pendingApprovalLabel(auth.user.role)],
          ["/meetings?status=published", "Published Meetings"],
          ["/meetings?status=completed", "Completed Meetings"]
        ].map(([href, label]) => {
          if (href === "/meetings/new" && !canCreateMeeting) return null;
          return (
            <Link
              key={href}
              href={href}
              className="min-h-11 shrink-0 rounded-full border bg-white px-4 py-2 text-sm font-semibold text-bcb-ink hover:border-bcb-green hover:text-bcb-green"
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="hidden gap-4 md:grid md:grid-cols-3">
        <MetricCard label="Meetings" value={filteredMeetings.length} detail="Visible meeting records" icon={CalendarDays} tone="navy" />
        <MetricCard
          label="Agenda items"
          value={filteredMeetings.reduce((sum, meeting) => sum + meeting.agendaItems.length, 0)}
          detail="Agenda-wise paper bundles"
          icon={ClipboardList}
          tone="green"
        />
        <MetricCard
          label="Attendees"
          value={filteredMeetings.reduce((sum, meeting) => sum + meeting.attendees.length, 0)}
          detail="Attendance and invite tracking"
          icon={UsersRound}
          tone="gold"
        />
      </div>

      {/* Mobile Document Hub-style meeting cards */}
      <div className="space-y-3 lg:hidden">
        {filteredMeetings.map((meeting) => (
          <Link
            key={meeting.id}
            href={`/meetings/${meeting.id}`}
            className="block rounded-ds-lg border border-slate-200 bg-white p-4 shadow-ds transition active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-base font-bold text-bcb-ink">{meeting.title}</h2>
              <StatusBadge value={meeting.status} />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              When: {formatDate(meeting.date)} {meeting.time}
            </p>
            <p className="mt-1 text-sm text-slate-600">Location: {meeting.venueOnlineLink}</p>
          </Link>
        ))}
        {filteredMeetings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No meetings match this filter.
          </div>
        ) : null}
      </div>

      {/* Desktop rich cards */}
      <div className="hidden space-y-5 lg:block">
        {filteredMeetings.map((meeting) => {
          const timeline = safeJson<string[]>(meeting.timelineJson, []);
          return (
            <Card key={meeting.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase text-bcb-green">{meeting.meetingCode}</span>
                      <StatusBadge value={meeting.status} />
                    </div>
                    <CardTitle className="mt-2">{meeting.title}</CardTitle>
                    <p className="mt-2 text-sm text-slate-500">
                      {statusLabel(meeting.meetingType)} · {formatDate(meeting.date)} · {meeting.time} · {meeting.venueOnlineLink}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-slate-50 px-3 py-2 text-sm font-semibold text-bcb-ink">
                    {confidentiality(meeting.confidentiality)}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/meetings/${meeting.id}`}
                    className="rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-bcb-ink hover:border-bcb-green"
                  >
                    Meeting Details
                  </Link>
                  <Link
                    href={`/meetings/${meeting.id}/agenda`}
                    className="rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-bcb-ink hover:border-bcb-green"
                  >
                    Agenda
                  </Link>
                  <Link
                    href={`/meetings/${meeting.id}/attendees`}
                    className="rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-bcb-ink hover:border-bcb-green"
                  >
                    Participants
                  </Link>
                  <Link
                    href={`/meetings/${meeting.id}/board-pack`}
                    className="rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-bcb-ink hover:border-bcb-green"
                  >
                    Board Pack
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-3">
                  {meeting.agendaItems.map((item) => (
                    <div key={item.id} className="rounded-lg border bg-white p-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm font-bold text-bcb-navy">
                            Agenda {item.itemNumber}: {item.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">{item.decisionSummary}</p>
                        </div>
                        <StatusBadge value={item.status} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.memo ? (
                          <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                            {item.memo.memoId}
                          </span>
                        ) : null}
                        {item.documents.map((link) => (
                          <span key={link.id} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                            {link.document.documentId}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-bcb-ink">Attendees</p>
                    <div className="mt-3 space-y-2">
                      {meeting.attendees.map((attendee) => (
                        <div key={attendee.id} className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-slate-700">{attendee.user.name}</span>
                          <span className="text-xs text-slate-500">{attendee.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <p className="text-sm font-semibold text-bcb-ink">Meeting timeline</p>
                    <div className="mt-3 space-y-2">
                      {timeline.map((event, index) => (
                        <div key={event} className="flex gap-3 text-sm text-slate-700">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-bcb-green text-xs font-bold text-white">
                            {index + 1}
                          </span>
                          {event}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
