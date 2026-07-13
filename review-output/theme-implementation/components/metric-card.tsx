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
  green: "bg-[color:color-mix(in_srgb,var(--theme-success)_14%,white)] text-[color:var(--theme-success)]",
  red: "bg-[color:color-mix(in_srgb,var(--theme-danger)_14%,white)] text-[color:var(--theme-danger)]",
  navy: "bg-[color:color-mix(in_srgb,var(--theme-background)_10%,white)] text-bcb-navy",
  gold: "bg-[color:color-mix(in_srgb,var(--theme-primary)_18%,white)] text-bcb-gold"
};

export function MetricCard({ label, value, detail, icon: Icon, tone = "green" }: MetricCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-start gap-4 p-5">
        <div className={cn("rounded-lg p-2.5", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-bcb-navy">{value}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}
