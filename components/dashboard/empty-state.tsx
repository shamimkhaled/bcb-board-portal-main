import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="rounded-md border border-dashed bg-slate-50 p-5 text-center">
      <Icon className="mx-auto h-5 w-5 text-slate-400" aria-hidden="true" />
      <p className="mt-2 text-sm font-semibold text-bcb-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}
