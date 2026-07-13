"use client";

import { useState, useTransition } from "react";
import type { Role } from "@prisma/client";
import { appearanceThemeKeys, themeLabels, type AppearanceThemeKey } from "@/lib/theme";
import { role as roleLabel } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { ThemePreviewCard } from "@/components/theme/theme-preview-card";

export function AdminAppearanceForm({
  systemDefaultTheme,
  allowUserThemeSelection,
  roleDefaults
}: {
  systemDefaultTheme: AppearanceThemeKey;
  allowUserThemeSelection: boolean;
  roleDefaults: Record<Role, AppearanceThemeKey>;
}) {
  const [systemTheme, setSystemTheme] = useState(systemDefaultTheme);
  const [allowSelection, setAllowSelection] = useState(allowUserThemeSelection);
  const [roles, setRoles] = useState(roleDefaults);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function save() {
    if (!window.confirm("Save portal appearance defaults? This affects the default theme users receive by role.")) return;
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/admin/appearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemDefaultTheme: systemTheme,
          allowUserThemeSelection: allowSelection,
          roleDefaults: roles
        })
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(payload?.error ?? "Appearance settings could not be saved.");
        return;
      }
      setMessage("Appearance settings saved.");
    });
  }

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase text-slate-600">System default</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {appearanceThemeKeys.map((theme) => (
            <ThemePreviewCard key={theme} theme={theme} selected={systemTheme === theme} onSelect={() => setSystemTheme(theme)} />
          ))}
        </div>
      </section>

      <label className="flex items-center gap-3 rounded-md border bg-slate-50 p-3 text-sm font-semibold text-bcb-ink">
        <input type="checkbox" checked={allowSelection} onChange={(event) => setAllowSelection(event.target.checked)} />
        Allow users to change their personal theme
      </label>

      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase text-slate-600">Role defaults</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {Object.entries(roles).map(([role, selectedTheme]) => (
            <label key={role} className="grid gap-2 rounded-md border bg-white p-3">
              <span className="text-sm font-semibold text-bcb-ink">{roleLabel(role as Role)}</span>
              <select
                value={selectedTheme}
                onChange={(event) =>
                  setRoles((current) => ({ ...current, [role]: event.target.value as AppearanceThemeKey }))
                }
                className="h-10 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {appearanceThemeKeys.map((theme) => (
                  <option key={theme} value={theme}>
                    {themeLabels[theme]}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </section>
      {message ? <p className="text-sm font-semibold text-bcb-green">{message}</p> : null}
      <Button onClick={save} disabled={isPending}>{isPending ? "Saving..." : "Save appearance defaults"}</Button>
    </div>
  );
}
