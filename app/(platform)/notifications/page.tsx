import { Bell } from "lucide-react";
import { NotificationReadButton } from "@/components/notification-read-button";
import { PageShell } from "@/components/page-shell";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime, safeJson } from "@/lib/utils";
import { requireModule } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const auth = await requireAuth();
  await requireModule(auth.user, "notifications");
  const notifications = await prisma.notification.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <PageShell
      eyebrow="Notification Center"
      title="Notifications"
      description="In-app notifications, simulated email/SMS/push logs, and the rule that confidential documents are never attached to notifications."
    >
      <div className="hidden gap-4 md:grid md:grid-cols-3">
        <MetricCard label="Notifications" value={notifications.length} detail="Your in-app queue" icon={Bell} tone="navy" />
        <MetricCard
          label="Unread"
          value={notifications.filter((notification) => !notification.isRead).length}
          detail="Awaiting review"
          icon={Bell}
          tone="gold"
        />
        <MetricCard
          label="Read"
          value={notifications.filter((notification) => notification.isRead).length}
          detail="Completed notifications"
          icon={Bell}
          tone="green"
        />
      </div>

      <div className="space-y-3 lg:hidden">
        {notifications.map((notification) => (
          <article
            key={notification.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={notification.isRead ? "Read" : "Unread"} />
              <span className="text-xs font-bold uppercase text-[#006A4E]">{notification.type}</span>
            </div>
            <h2 className="mt-2 text-base font-bold text-[#0a4d3c]">{notification.title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{notification.body}</p>
            <p className="mt-2 text-xs text-slate-500">{formatDateTime(notification.createdAt)}</p>
            <div className="mt-3">
              <NotificationReadButton id={notification.id} disabled={notification.isRead} />
            </div>
          </article>
        ))}
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No notifications yet.
          </div>
        ) : null}
      </div>

      <Card className="hidden lg:block">
        <CardHeader>
          <CardTitle>In-app Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.map((notification) => {
            const channelLog = safeJson<Record<string, string>>(notification.channelLog, {});
            return (
              <div key={notification.id} className="rounded-lg border bg-white p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={notification.isRead ? "Read" : "Unread"} />
                      <span className="text-xs font-bold uppercase text-bcb-green">{notification.type}</span>
                    </div>
                    <p className="mt-2 font-semibold text-bcb-ink">{notification.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{notification.body}</p>
                    <p className="mt-2 text-xs text-slate-500">{formatDateTime(notification.createdAt)}</p>
                  </div>
                  <div className="space-y-2">
                    <NotificationReadButton id={notification.id} disabled={notification.isRead} />
                    <div className="rounded-md bg-slate-50 p-2 text-xs text-slate-600">
                      {Object.entries(channelLog).map(([key, value]) => (
                        <p key={key}>
                          <span className="font-semibold">{key}:</span> {value}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </PageShell>
  );
}
