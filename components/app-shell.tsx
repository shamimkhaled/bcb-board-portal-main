"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  FileText,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Palette,
  Search
} from "lucide-react";
import { useMemo, useState } from "react";
import { navItems } from "@/lib/navigation";
import { cn, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { SessionBadge } from "@/components/session-badge";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { PushOptIn } from "@/components/pwa/push-opt-in";
import { VisitedPageTracker } from "@/components/pwa/visited-page-tracker";
import { PullToRefresh } from "@/components/mobile/pull-to-refresh";

type AppShellProps = {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    role: string;
    roleLabel: string;
  };
  session: {
    expiresAt: string;
    deviceId: string;
  };
  navigationItems: Array<{
    href: string;
    label: string;
    moduleKey: string;
    secondary?: boolean;
  }>;
};

export function AppShell({ children, user, session, navigationItems }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryItems = navigationItems.filter((item) => !("secondary" in item && item.secondary));

  const mobileTabs = useMemo(() => {
    const byHref = new Map(primaryItems.map((item) => [item.href, item]));
    return [
      {
        href: "/dashboard",
        label: "Home",
        icon: LayoutDashboard,
        available: byHref.has("/dashboard"),
        active: pathname === "/dashboard" || pathname.startsWith("/dashboard/")
      },
      {
        href: "/meetings",
        label: "Meetings",
        icon: navItems.find((n) => n.href === "/meetings")?.icon ?? LayoutDashboard,
        available: byHref.has("/meetings"),
        active: pathname.startsWith("/meetings")
      },
      {
        href: byHref.has("/search") ? "/search" : "/documents",
        label: byHref.has("/search") ? "Search" : "Docs",
        icon: byHref.has("/search") ? Search : FileText,
        available: byHref.has("/search") || byHref.has("/documents"),
        active: pathname.startsWith("/search") || pathname.startsWith("/documents")
      },
      {
        href: "/notifications",
        label: "Alerts",
        icon: Bell,
        available: byHref.has("/notifications"),
        active: pathname.startsWith("/notifications")
      }
    ].filter((tab) => tab.available);
  }, [pathname, primaryItems]);

  const moreItems = useMemo(() => {
    const covered = new Set(["/dashboard", "/meetings", "/search", "/documents", "/notifications"]);
    return primaryItems.filter((item) => !covered.has(item.href));
  }, [primaryItems]);

  const moreActive = moreItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const pageTitle =
    primaryItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.label ?? "BCB Portal";

  return (
    <div className="min-h-screen bg-[#eef2f0] pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:bg-[#f3f5f4] lg:pb-0">
      <VisitedPageTracker />
      <OfflineBanner />

      {/* Desktop: compact icon + label rail (app-like, not enterprise drawer) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[88px] flex-col border-r border-slate-200/80 bg-[#05382c] text-white lg:flex xl:w-[240px]">
        <Link href="/dashboard" className="flex h-16 items-center justify-center gap-3 border-b border-white/10 px-3 xl:justify-start xl:px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white p-1">
            <Image src="/bcb-logo.png" alt="BCB" width={32} height={32} className="h-8 w-8 object-contain" priority />
          </div>
          <div className="hidden min-w-0 xl:block">
            <p className="truncate text-sm font-bold">BCB Portal</p>
            <p className="truncate text-[11px] text-emerald-100/70">Directors</p>
          </div>
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4 xl:px-3">
          {primaryItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = navItems.find((n) => n.href === item.href)?.icon ?? LayoutDashboard;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "flex min-h-12 items-center justify-center gap-3 rounded-2xl px-2 text-sm font-medium text-emerald-50/75 transition hover:bg-white/10 hover:text-white xl:justify-start xl:px-3",
                  active && "bg-white text-[#05382c] shadow-ds-float hover:bg-white hover:text-[#05382c]"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="hidden truncate xl:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="hidden xl:block">
            <div className="mb-3 flex items-center gap-2 px-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/20 text-xs font-bold">
                {initials(user.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-[11px] text-emerald-100/60">{user.roleLabel}</p>
              </div>
            </div>
            <PushOptIn />
            <Button className="mt-2 w-full border-white/20 bg-white/10 text-white hover:bg-white/15" variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
            <Link
              href="/profile/appearance"
              className="mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/15 text-xs font-semibold text-emerald-50"
            >
              <Palette className="h-4 w-4" />
              Appearance
            </Link>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex min-h-12 w-full items-center justify-center rounded-2xl text-emerald-50/80 hover:bg-white/10 xl:hidden"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>

      <div className="lg:pl-[88px] xl:pl-[240px]">
        {/* Mobile app header */}
        <header className="sticky top-0 z-20 bg-[#05382c] text-white lg:hidden">
          <div className="flex h-14 items-center justify-between gap-3 px-4 pb-1 pt-[env(safe-area-inset-top)]">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200/80">BCB Portal</p>
              <h1 className="truncate text-lg font-bold tracking-tight">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-2">
              <SessionBadge expiresAt={session.expiresAt} />
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-[11px] font-bold">
                {initials(user.name)}
              </div>
            </div>
          </div>
          <div className="h-3 rounded-b-[1.25rem] bg-[#eef2f0]" />
        </header>

        {/* Desktop top bar */}
        <header className="sticky top-0 z-20 hidden border-b border-slate-200/80 bg-white/80 backdrop-blur-xl lg:block">
          <div className="flex h-16 items-center justify-between gap-4 px-6 xl:px-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700/80">Workspace</p>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-2">
              <SessionBadge expiresAt={session.expiresAt} />
              <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                {user.roleLabel}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <PullToRefresh>{children}</PullToRefresh>
        </main>
      </div>

      {/* Floating pill tab bar — native app pattern */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
        aria-label="Primary"
      >
        <div
          className="mx-auto grid max-w-lg gap-1 rounded-[1.75rem] border border-white/60 bg-[#05382c]/95 p-1.5 shadow-ds-float backdrop-blur-xl"
          style={{ gridTemplateColumns: `repeat(${mobileTabs.length + 1}, minmax(0, 1fr))` }}
        >
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[1.25rem] text-[10px] font-semibold transition",
                  tab.active ? "bg-white text-[#05382c]" : "text-emerald-100/70"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={tab.active ? 2.5 : 2} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[1.25rem] text-[10px] font-semibold",
              moreActive || moreOpen ? "bg-white text-[#05382c]" : "text-emerald-100/70"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More modules">
        <div className="space-y-1">
          {moreItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = navItems.find((n) => n.href === item.href)?.icon ?? LayoutDashboard;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex min-h-14 items-center gap-3 rounded-2xl px-3 text-[15px] font-semibold text-slate-800 transition active:bg-slate-100",
                  active && "bg-emerald-50 text-emerald-800"
                )}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Icon className="h-5 w-5" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-3 px-1 pb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#05382c] text-sm font-bold text-white">
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.roleLabel}</p>
            </div>
          </div>
          <PushOptIn />
          <Link
            href="/profile/appearance"
            onClick={() => setMoreOpen(false)}
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 text-sm font-semibold"
          >
            <Palette className="h-4 w-4" />
            Appearance
          </Link>
          <Button className="w-full rounded-2xl" variant="outline" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </BottomSheet>

      <InstallPrompt />
    </div>
  );
}
