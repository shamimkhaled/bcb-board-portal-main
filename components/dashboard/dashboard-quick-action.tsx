import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardQuickActionProps = {
  href: string;
  title: string;
  icon: LucideIcon;
  tone?: "green" | "gold" | "red";
};

const tones = {
  green: "text-bcb-green bg-emerald-50",
  gold: "text-bcb-gold bg-amber-50",
  red: "text-bcb-red bg-red-50"
};

export function DashboardQuickAction({
  href,
  title,
  icon: Icon,
  tone = "green"
}: DashboardQuickActionProps) {
  return (
    <Link
      href={href}
      className="group rounded-lg border bg-white p-5 shadow-sm transition hover:border-bcb-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bcb-green focus-visible:ring-offset-2"
    >
      <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-md", tones[tone])}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-semibold leading-5 text-bcb-ink group-hover:text-bcb-green">
        {title}
      </p>
    </Link>
  );
}
