import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, CircleDot, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type HeroTimelineItem = {
  label: string;
  detail: string;
  state: "completed" | "pending" | "attention";
};

type DashboardHeroProps = {
  title: string;
  description: string;
  userName: string;
  deviceId: string;
  focusItems: string[];
  timelineItems: HeroTimelineItem[];
};

const stateStyles: Record<HeroTimelineItem["state"], { icon: LucideIcon; wrapper: string; label: string }> = {
  completed: {
    icon: CheckCircle2,
    wrapper: "border-emerald-300/35 bg-emerald-400/12 text-emerald-100",
    label: "Completed"
  },
  pending: {
    icon: Clock3,
    wrapper: "border-slate-300/25 bg-slate-300/10 text-slate-200",
    label: "Pending"
  },
  attention: {
    icon: CircleDot,
    wrapper: "border-amber-300/40 bg-amber-300/14 text-amber-100",
    label: "Needs attention"
  }
};

export function DashboardHero({
  title,
  description,
  userName,
  deviceId,
  focusItems,
  timelineItems
}: DashboardHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-lg bg-bcb-navy text-white shadow-executive">
      <Image
        src="/governance-boardroom.png"
        alt="Executive board governance workspace"
        fill
        priority
        sizes="(min-width: 1024px) calc(100vw - 18rem), 100vw"
        className="object-cover opacity-34"
      />
      <div className="theme-dashboard-overlay absolute inset-0" />
      <div className="absolute inset-0 bg-black/36" />

      <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.16fr)_minmax(300px,0.84fr)] lg:p-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-white p-1.5 shadow-sm">
              <Image
                src="/bcb-logo.png"
                alt="Bangladesh Cricket Board logo"
                width={56}
                height={56}
                className="h-14 w-14 object-contain"
                priority
              />
            </div>
            <Badge variant="gold" className="border-amber-300/70 bg-amber-200 text-bcb-navy">
              Permission-aware portal
            </Badge>
          </div>

          <h2 className="mt-5 max-w-4xl text-2xl font-bold leading-tight text-white sm:text-3xl">
            {title}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base">
            {description}
          </p>
          <p className="mt-3 max-w-3xl break-words text-sm leading-6 text-slate-300">
            Signed in as <span className="font-semibold text-white">{userName}</span>. Device{" "}
            <span className="font-mono text-slate-100">{deviceId}</span> is checked before protected
            board papers render.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {focusItems.slice(0, 6).map((item) => (
              <span
                key={item}
                className="rounded-md border border-white/18 bg-white/12 px-3 py-1 text-xs font-semibold text-slate-100"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div
          data-dashboard-hero-panel
          className="rounded-lg border border-white/16 bg-[rgba(2,6,23,0.86)] p-4 shadow-2xl backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-emerald-200">Workflow status</p>
              <p className="mt-1 text-sm text-slate-300">Current governance movement</p>
            </div>
          </div>
          <div className="space-y-3">
            {timelineItems.map((item) => {
              const state = stateStyles[item.state];
              const Icon = state.icon;
              return (
                <div key={item.label} className="flex gap-3 rounded-md border border-white/8 bg-white/[0.04] p-3">
                  <div
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
                      state.wrapper
                    )}
                    aria-label={state.label}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-300">{item.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
