"use client";

import { CheckCircle2 } from "lucide-react";
import { themeCssValues, themeLabels, type AppearanceThemeKey } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemePreviewCard({
  theme,
  selected,
  disabled,
  onSelect
}: {
  theme: AppearanceThemeKey;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const values = themeCssValues[theme];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "appearance-panel rounded-lg border p-3 text-left shadow-sm transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
        selected && "appearance-selected"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold">{themeLabels[theme]}</p>
          <p className="appearance-muted-text mt-1 text-xs">Semantic token palette</p>
        </div>
        {selected ? <CheckCircle2 className="h-5 w-5 text-[color:var(--theme-success)]" /> : null}
      </div>
      <div className="mt-4 grid grid-cols-5 gap-1">
        {[
          values.background,
          values.backgroundSecondary,
          values.primary,
          values.secondary,
          values.danger
        ].map((colour) => (
          <span key={colour} className="h-8 rounded-md border" style={{ background: colour }} />
        ))}
      </div>
    </button>
  );
}
