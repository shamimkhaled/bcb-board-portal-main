import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  tone?: "green" | "red" | "navy" | "gold";
};

const tones = {
  green: "bg-[color:color-mix(in_srgb,var(--theme-success)_12%,white)] text-[color:var(--theme-success)]",
  red: "bg-[color:color-mix(in_srgb,var(--theme-danger)_12%,white)] text-[color:var(--theme-danger)]",
  navy: "bg-slate-100 text-bcb-navy",
  gold: "bg-[color:color-mix(in_srgb,var(--theme-primary)_16%,white)] text-[color:var(--theme-primary)]"
};

export function MetricCard({ label, value, detail, icon: Icon, tone = "green" }: MetricCardProps) {
  return (
    <Card className="ds-enter overflow-hidden">
      <CardContent className="flex items-start gap-4 p-5">
        <div className={cn("rounded-ds p-2.5", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-bcb-ink">{value}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}
