"use client";

import { useState, useTransition } from "react";
import { appearanceThemeKeys, type AppearanceThemeKey } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { ThemePreviewCard } from "@/components/theme/theme-preview-card";
import { useTheme } from "@/components/theme/theme-provider";

export function ThemeSelector({ currentTheme }: { currentTheme: AppearanceThemeKey }) {
  const { theme, setTheme, allowUserThemeSelection } = useTheme();
  const [selected, setSelected] = useState<AppearanceThemeKey>(theme ?? currentTheme);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function save() {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/profile/appearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedTheme: selected })
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(payload?.error ?? "Theme preference could not be saved.");
        return;
      }
      setTheme(selected);
      setMessage("Appearance preference saved.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {appearanceThemeKeys.map((themeKey) => (
          <ThemePreviewCard
            key={themeKey}
            theme={themeKey}
            selected={selected === themeKey}
            disabled={!allowUserThemeSelection}
            onSelect={() => setSelected(themeKey)}
          />
        ))}
      </div>
      {!allowUserThemeSelection ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
          Personal theme selection is disabled by an administrator.
        </p>
      ) : null}
      {message ? <p className="text-sm font-semibold text-bcb-green">{message}</p> : null}
      <Button onClick={save} disabled={isPending || !allowUserThemeSelection}>
        {isPending ? "Saving..." : "Save appearance"}
      </Button>
    </div>
  );
}
