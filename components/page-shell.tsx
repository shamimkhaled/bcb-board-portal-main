import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageShellProps = {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PageShell({ title, description, eyebrow, actions, children, className }: PageShellProps) {
  return (
    <section className={cn("ds-enter space-y-5", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="hidden text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700 lg:block">{eyebrow}</p>
          ) : null}
          {/* Mobile title lives in app header; keep h1 for a11y/SEO but visually quieter on small screens */}
          <h1 className="mt-0 text-[1.65rem] font-bold tracking-tight text-slate-900 max-lg:sr-only lg:mt-1 lg:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm leading-6 text-slate-500 lg:mt-2">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
