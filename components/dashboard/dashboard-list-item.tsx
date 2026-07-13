import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DashboardListItemProps = {
  href?: string;
  title: string;
  detail?: string;
  meta?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "attention";
};

export function DashboardListItem({
  href,
  title,
  detail,
  meta,
  icon,
  tone = "default"
}: DashboardListItemProps) {
  const className = cn(
    "flex min-w-0 flex-col gap-3 rounded-md border bg-white p-3 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bcb-green focus-visible:ring-offset-2 md:flex-row md:items-start md:justify-between",
    "hover:border-bcb-green",
    tone === "attention" && "border-amber-200 bg-amber-50/70 hover:border-amber-400"
  );

  const content = (
    <>
      <div className="flex min-w-0 gap-3">
        {icon ? <div className="mt-0.5 shrink-0">{icon}</div> : null}
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold leading-5 text-bcb-ink">{title}</p>
          {detail ? <p className="mt-1 break-words text-xs leading-5 text-slate-500">{detail}</p> : null}
        </div>
      </div>
      {meta ? <div className="shrink-0 md:text-right">{meta}</div> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
