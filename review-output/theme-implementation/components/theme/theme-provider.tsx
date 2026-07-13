"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AppearanceThemeKey } from "@/lib/theme";

type ThemeContextValue = {
  theme: AppearanceThemeKey;
  setTheme: (theme: AppearanceThemeKey) => void;
  allowUserThemeSelection: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initialTheme,
  allowUserThemeSelection
}: {
  children: React.ReactNode;
  initialTheme: AppearanceThemeKey;
  allowUserThemeSelection: boolean;
}) {
  const [theme, setThemeState] = useState<AppearanceThemeKey>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("bcb-theme", theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      allowUserThemeSelection,
      setTheme: setThemeState
    }),
    [allowUserThemeSelection, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider.");
  return context;
}
