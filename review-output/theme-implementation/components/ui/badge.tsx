import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold",
  {
    variants: {
      variant: {
        neutral: "border-slate-200 bg-white text-slate-700",
        success: "border-[color:color-mix(in_srgb,var(--theme-success)_34%,white)] bg-[color:color-mix(in_srgb,var(--theme-success)_12%,white)] text-[color:var(--theme-success)]",
        warning: "border-[color:color-mix(in_srgb,var(--theme-warning)_36%,white)] bg-[color:color-mix(in_srgb,var(--theme-warning)_14%,white)] text-amber-900",
        danger: "border-[color:color-mix(in_srgb,var(--theme-danger)_34%,white)] bg-[color:color-mix(in_srgb,var(--theme-danger)_12%,white)] text-[color:var(--theme-danger)]",
        navy: "border-slate-700 bg-bcb-navy text-white",
        gold: "border-amber-300 bg-amber-50 text-bcb-navy"
      }
    },
    defaultVariants: {
      variant: "neutral"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
