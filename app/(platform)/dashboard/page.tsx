import {
  Archive,
  Bell,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  FileText,
  LockKeyhole,
  ShieldCheck,
  Signature,
  UsersRound
} from "lucide-react";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardListItem } from "@/components/dashboard/dashboard-list-item";
import { DashboardQuickAction } from "@/components/dashboard/dashboard-quick-action";
import { DashboardWidgetCard } from "@/components/dashboard/dashboard-widget-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { MetricCard } from "@/components/metric-card";
import { PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireAuth } from "@/lib/auth";
import { getDashboardProfile } from "@/lib/dashboard-config";
import { role } from "@/lib/labels";
import { getVisibleWidgets, requireModule } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate, percent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const auth = await requireAuth();
  await requireModule(auth.user, "dashboard");

  const effectiveWidgets = await getVisibleWidgets(auth.user);
  const widgets = new Set(effectiveWidgets.map((widget) => widget.key));
  const [
    meetingCount,
    pendingMemos,
    documents,
    pendingAcks,
    actions,
    notifications,
    backup,
    upcomingMeetings,
    recentDocs,
    auditWarnings,
    archiveRecords,
    packs,
    minutes,
    resolutions,
    committeeDocuments
  ] = await Promise.all([
    prisma.meeting.count(),
    prisma.memo.count({
      where: {
        status: {
          in: ["SUBMITTED", "UNDER_SECRETARY_REVIEW", "CHAIRMAN_APPROVAL_PENDING"]
        }
      }
    }),
    prisma.document.findMany(),
    prisma.readAcknowledgment.count({
      where: { userId: auth.user.id, type: "ACK" }
    }),
    prisma.actionItem.findMany({
      where: auth.user.role === "DIRECTOR" ? { responsibleUserId: auth.user.id } : {},
      orderBy: { dueDate: "asc" },
      take: 5,
      include: { responsibleUser: true }
    }),
    prisma.notification.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.backupStatus.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.meeting.findMany({
      orderBy: { date: "asc" },
      take: 4,
      include: { boardPacks: true }
    }),
    prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.auditLog.count({ where: { result: "Warning" } }),
    prisma.archiveRecord.findMany(),
    prisma.boardPack.findMany({ include: { readAcknowledgments: true, meeting: true } }),
    prisma.minute.findMany({ orderBy: { updatedAt: "desc" }, take: 3, include: { meeting: true } }),
    prisma.resolution.findMany({ orderBy: { dateApproved: "desc" }, take: 3 }),
    prisma.document.findMany({ where: { documentType: "Committee Paper" }, orderBy: { createdAt: "desc" }, take: 3 })
  ]);

  const profile = getDashboardProfile(auth.user.role);
  const archiveComplete = percent(
    archiveRecords.filter((record) => record.finalLocked || record.metadataComplete >= 90).length,
    archiveRecords.length
  );

  return (
    <PageShell eyebrow={role(auth.user.role)} title={profile.title} description={profile.description}>
      {widgets.has("governance-hero") ? (
        <DashboardHero
          title="Secure board packs, approvals, archives, and audit posture in one executive workspace."
          description={profile.description}
          userName={auth.user.name}
          deviceId={auth.session.deviceId}
          focusItems={profile.focusItems}
          timelineItems={[
            { label: "Memo submitted", detail: "Department to Secretary", state: "completed" },
            {
              label: "Chairman approval",
              detail: `${pendingMemos} items need attention`,
              state: pendingMemos ? "attention" : "completed"
            },
            {
              label: "Board pack published",
              detail: `${packs.length} pack records seeded`,
              state: packs.length ? "completed" : "pending"
            },
            { label: "Minutes and resolutions", detail: "Draft, approve, publish", state: "pending" }
          ]}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {widgets.has("pending-acknowledgments") ? (
          <MetricCard
            label="Pending acknowledgments"
            value={pendingAcks}
            detail="Documents and packs acknowledged by you"
            icon={LockKeyhole}
            tone="green"
          />
        ) : null}
        {widgets.has("meetings") ? (
          <MetricCard
            label="Meetings"
            value={meetingCount}
            detail="Board, AGM, and committee meetings"
            icon={CalendarDays}
            tone="navy"
          />
        ) : null}
        {widgets.has("pending-approvals") ? (
          <MetricCard
            label="Pending approvals"
            value={pendingMemos}
            detail="Memos in review or chairman queue"
            icon={FileCheck2}
            tone="gold"
          />
        ) : null}
        {widgets.has("documents") ? (
          <MetricCard
            label="Documents"
            value={documents.length}
            detail="Repository records across 2022-2026"
            icon={FileText}
            tone="green"
          />
        ) : null}
        {widgets.has("audit-warnings") ? (
          <MetricCard
            label="Audit warnings"
            value={auditWarnings}
            detail="Warning events retained for review"
            icon={ShieldCheck}
            tone={auditWarnings ? "red" : "green"}
          />
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {widgets.has("current-board-pack") ? (
          <DashboardWidgetCard title="Current Board Pack">
            {packs.length ? (
              packs.slice(0, 3).map((pack) => (
                <DashboardListItem
                  key={pack.id}
                  href={`/board-packs/${pack.id}`}
                  title={pack.packCode}
                  detail={`${pack.meeting.title} - ${pack.status}`}
                  meta={<StatusBadge value={pack.status} />}
                />
              ))
            ) : (
              <EmptyState icon={UsersRound} title="No current board pack" description="Assigned board packs will appear here after publication." />
            )}
          </DashboardWidgetCard>
        ) : null}

        {widgets.has("upcoming-meetings") ? (
          <DashboardWidgetCard title="Upcoming Meetings">
            {upcomingMeetings.length ? (
              upcomingMeetings.map((meeting) => (
                <DashboardListItem
                  key={meeting.id}
                  href="/meetings"
                  title={meeting.title}
                  detail={`${formatDate(meeting.date)} at ${meeting.time}`}
                  meta={<StatusBadge value={meeting.status} />}
                />
              ))
            ) : (
              <EmptyState icon={CalendarDays} title="No upcoming meetings" description="Upcoming meetings will appear here once scheduled." />
            )}
          </DashboardWidgetCard>
        ) : null}

        {widgets.has("recent-minutes-resolutions") ? (
          <DashboardWidgetCard title="Recent Minutes and Resolutions">
            {[...minutes, ...resolutions].length ? (
              <>
                {minutes.map((minute) => (
                  <DashboardListItem key={minute.id} href="/minutes" title={minute.minutesCode} detail={`${minute.meeting.title} - ${minute.status}`} />
                ))}
                {resolutions.map((resolution) => (
                  <DashboardListItem key={resolution.id} href="/resolutions" title={resolution.resolutionNumber} detail={resolution.title} />
                ))}
              </>
            ) : (
              <EmptyState icon={Signature} title="No minutes or resolutions" description="Recent governance records will appear after publication." />
            )}
          </DashboardWidgetCard>
        ) : null}

        {widgets.has("committee-documents") ? (
          <DashboardWidgetCard title="Committee Documents">
            {committeeDocuments.length ? (
              committeeDocuments.map((document) => (
                <DashboardListItem
                  key={document.id}
                  href={`/documents/${document.id}`}
                  title={document.title}
                  detail={`${document.documentId} - ${document.confidentiality}`}
                />
              ))
            ) : (
              <EmptyState icon={FileText} title="No committee documents" description="Committee papers assigned to this portal will appear here." />
            )}
          </DashboardWidgetCard>
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        {widgets.has("upcoming-governance-work") ? (
          <DashboardWidgetCard title="Upcoming Governance Work">
            {upcomingMeetings.length ? (
              upcomingMeetings.map((meeting) => (
                <DashboardListItem
                  key={meeting.id}
                  href="/meetings"
                  title={meeting.title}
                  detail={`${formatDate(meeting.date)} at ${meeting.time}`}
                  meta={<StatusBadge value={meeting.status} />}
                />
              ))
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No upcoming meetings"
                description="Governance work will appear here once meetings are scheduled."
              />
            )}
          </DashboardWidgetCard>
        ) : null}

        {widgets.has("security-dr-posture") || widgets.has("backup-status") || widgets.has("archive-progress") ? (
          <DashboardWidgetCard title="Security and DR Posture" contentClassName="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-slate-50 p-3">
                <LockKeyhole className="h-5 w-5 text-bcb-green" aria-hidden="true" />
                <p className="mt-2 text-2xl font-bold text-bcb-navy">{pendingAcks}</p>
                <p className="text-xs text-slate-500">Your acknowledgments</p>
              </div>
              <div className="rounded-lg border bg-slate-50 p-3">
                <Archive className="h-5 w-5 text-bcb-gold" aria-hidden="true" />
                <p className="mt-2 text-2xl font-bold text-bcb-navy">{archiveComplete}%</p>
                <p className="text-xs text-slate-500">Archive completion</p>
              </div>
            </div>
            {backup ? (
              <div className="rounded-lg border bg-emerald-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-emerald-950">Backup status</p>
                  <StatusBadge value={backup.backupStatus} />
                </div>
                <p className="mt-2 text-sm text-emerald-800">DR readiness score: {backup.drReadinessScore}/100</p>
              </div>
            ) : (
              <EmptyState
                icon={ShieldCheck}
                title="No DR status available"
                description="Backup posture will appear after the first production backup signal is recorded."
              />
            )}
          </DashboardWidgetCard>
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {widgets.has("personal-action-items") || widgets.has("action-items") ? (
          <DashboardWidgetCard title="Personal Action Items">
            {actions.length ? (
              actions.map((action) => (
                <DashboardListItem
                  key={action.id}
                  title={action.title}
                  detail={`Due ${formatDate(action.dueDate)} - ${action.responsibleUser.name}`}
                  meta={<StatusBadge value={action.status} />}
                  tone={action.status === "OVERDUE" ? "attention" : "default"}
                />
              ))
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="No action items"
                description="Assigned actions will appear here when decisions require follow-up."
              />
            )}
          </DashboardWidgetCard>
        ) : null}

        {widgets.has("recent-secure-documents") || widgets.has("recent-documents") ? (
          <DashboardWidgetCard title="Recent Secure Documents">
            {recentDocs.length ? (
              recentDocs.map((document) => (
                <DashboardListItem
                  key={document.id}
                  href={`/documents/${document.id}`}
                  title={document.title}
                  detail={`${document.documentId} - ${document.documentType}`}
                  icon={<FileText className="h-4 w-4 text-bcb-green" aria-hidden="true" />}
                />
              ))
            ) : (
              <EmptyState
                icon={FileText}
                title="No secure documents"
                description="Recently available documents will appear here after upload or publication."
              />
            )}
          </DashboardWidgetCard>
        ) : null}

        {widgets.has("notifications") ? (
          <DashboardWidgetCard title="Notifications">
            {notifications.length ? (
              notifications.map((notification) => (
                <DashboardListItem
                  key={notification.id}
                  title={notification.title}
                  detail={notification.body}
                  icon={<Bell className="h-4 w-4 text-bcb-red" aria-hidden="true" />}
                />
              ))
            ) : (
              <EmptyState
                icon={Bell}
                title="No notifications"
                description="Alerts and board workflow notices will appear here."
              />
            )}
          </DashboardWidgetCard>
        ) : null}
      </div>

      {widgets.has("quick-actions") ? (
        <div className="grid gap-4 md:grid-cols-3">
          <DashboardQuickAction
            href="/memo-workflow"
            icon={FileCheck2}
            title="Submit and approve board memo"
            tone="green"
          />
          <DashboardQuickAction
            href="/board-packs"
            icon={UsersRound}
            title="Publish and acknowledge board pack"
            tone="gold"
          />
          <DashboardQuickAction
            href="/resolutions"
            icon={Signature}
            title="Generate resolution and action items"
            tone="red"
          />
        </div>
      ) : null}
    </PageShell>
  );
}
