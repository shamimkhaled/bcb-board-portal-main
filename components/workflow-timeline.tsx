import { CheckCircle2, CircleDot, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

type TimelineItem = {
  label: string;
  detail?: string;
  state?: "done" | "active" | "pending";
};

export function WorkflowTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const Icon = item.state === "done" ? CheckCircle2 : item.state === "active" ? CircleDot : Clock3;
        return (
          <div key={`${item.label}-${index}`} className="flex gap-3">
            <div
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
                item.state === "done" && "border-emerald-200 bg-emerald-50 text-bcb-green",
                item.state === "active" && "border-amber-200 bg-amber-50 text-amber-700",
                (!item.state || item.state === "pending") && "border-slate-200 bg-white text-slate-400"
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-bcb-ink">{item.label}</p>
              {item.detail ? <p className="text-xs leading-5 text-slate-500">{item.detail}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
