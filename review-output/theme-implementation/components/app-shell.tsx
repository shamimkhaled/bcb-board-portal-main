"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Palette, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { navItems } from "@/lib/navigation";
import { cn, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SessionBadge } from "@/components/session-badge";

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
  visibleModuleKeys: string[];
};

export function AppShell({ children, user, session, visibleModuleKeys }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const visibleModuleSet = new Set(visibleModuleKeys);
  const navigationItems = navItems.filter((item) => visibleModuleSet.has(item.moduleKey));
  const primaryItems = navigationItems.filter((item) => !("secondary" in item && item.secondary));

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="theme-shell min-h-screen">
      <aside
        className={cn(
          "theme-navigation fixed inset-y-0 left-0 z-40 w-72 border-r border-white/10 transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white p-1 shadow-sm">
                <Image
                  src="/bcb-logo.png"
                  alt="Bangladesh Cricket Board logo"
                  width={40}
                  height={40}
                  className="h-9 w-9 object-contain"
                  priority
                />
              </div>
              <div>
                <p className="text-sm font-bold leading-4">Directors&apos; Affairs</p>
                <p className="text-xs text-white/60">Automation Platform</p>
              </div>
            </Link>
            <button
              className="rounded-md p-2 text-white/70 hover:bg-white/10 lg:hidden"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {primaryItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/72 transition-colors hover:bg-white/10 hover:text-white",
                    active && "bg-[color:var(--theme-navigation-active)] text-bcb-navy hover:bg-[color:var(--theme-navigation-active)] hover:text-bcb-navy"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-white/10 p-4">
            <div className="rounded-lg border border-white/10 bg-white/6 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-bcb-green text-xs font-bold">
                  {initials(user.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                  <p className="truncate text-xs text-white/60">{user.roleLabel}</p>
                </div>
              </div>
              <Button
                className="mt-3 w-full border-white/15 bg-white/10 text-white hover:bg-white/15"
                variant="outline"
                size="sm"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
              <Link
                href="/profile/appearance"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Palette className="h-4 w-4" />
                Profile appearance
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {open ? (
        <button
          className="fixed inset-0 z-30 bg-bcb-navy/40 lg:hidden"
          aria-label="Close navigation overlay"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b bg-white/88 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                className="rounded-md border bg-white p-2 text-bcb-navy lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden items-center gap-2 rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-bcb-navy md:flex">
                <ShieldCheck className="h-4 w-4 text-bcb-green" />
                Secure board governance workspace
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <SessionBadge expiresAt={session.expiresAt} />
              <div className="hidden rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 sm:block">
                {session.deviceId}
              </div>
              <div className="rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-bcb-navy">
                {user.roleLabel}
              </div>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
