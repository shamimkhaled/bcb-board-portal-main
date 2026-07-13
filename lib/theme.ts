import type { AppearanceTheme, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const appearanceThemeKeys = ["EXECUTIVE_NAVY", "BCB_EMERALD", "HERITAGE_BURGUNDY"] as const;
export type AppearanceThemeKey = (typeof appearanceThemeKeys)[number];

export const SYSTEM_APPEARANCE_ID = "portal-appearance";

export const themeLabels: Record<AppearanceThemeKey, string> = {
  EXECUTIVE_NAVY: "Executive Navy",
  BCB_EMERALD: "BCB Emerald",
  HERITAGE_BURGUNDY: "Heritage Burgundy"
};

export const themeCssValues: Record<AppearanceThemeKey, Record<string, string>> = {
  EXECUTIVE_NAVY: {
    background: "#0b1220",
    backgroundSecondary: "#152033",
    surface: "#f4f6f8",
    surfaceElevated: "#FFFFFF",
    glassSurface: "rgba(255, 255, 255, 0.82)",
    foreground: "#0f172a",
    foregroundSecondary: "#334155",
    foregroundMuted: "#64748b",
    primary: "#c9a227",
    primaryHover: "#dbb43a",
    primaryForeground: "#0b1220",
    secondary: "#0b6e4f",
    border: "rgba(15,23,42,0.08)",
    focusRing: "#0b6e4f",
    success: "#16a34a",
    warning: "#d97706",
    danger: "#dc2626",
    information: "#0284c7",
    navigationBackground: "#ffffff",
    navigationActive: "#ecf8f3",
    dashboardOverlay: "rgba(11, 18, 32, 0.55)",
    viewerBackground: "#FFFFFF",
    watermarkColour: "#0b6e4f"
  },
  BCB_EMERALD: {
    background: "#062018",
    backgroundSecondary: "#0c2f26",
    surface: "#f3faf7",
    surfaceElevated: "#FFFFFF",
    glassSurface: "rgba(255, 255, 255, 0.84)",
    foreground: "#0b1f19",
    foregroundSecondary: "#1f3d34",
    foregroundMuted: "#5b7a70",
    primary: "#c8a85a",
    primaryHover: "#d9bb70",
    primaryForeground: "#062018",
    secondary: "#0d8f66",
    border: "rgba(11,31,25,0.08)",
    focusRing: "#0d8f66",
    success: "#16a34a",
    warning: "#d97706",
    danger: "#dc2626",
    information: "#0891b2",
    navigationBackground: "#ffffff",
    navigationActive: "#e8f7f1",
    dashboardOverlay: "rgba(6, 32, 24, 0.55)",
    viewerBackground: "#FFFFFF",
    watermarkColour: "#0d8f66"
  },
  HERITAGE_BURGUNDY: {
    background: "#1c1014",
    backgroundSecondary: "#2a171d",
    surface: "#faf6f3",
    surfaceElevated: "#FFFFFF",
    glassSurface: "rgba(255, 255, 255, 0.86)",
    foreground: "#1c1014",
    foregroundSecondary: "#3f2a30",
    foregroundMuted: "#7a6369",
    primary: "#c9a46a",
    primaryHover: "#d8b57e",
    primaryForeground: "#1c1014",
    secondary: "#8f3f52",
    border: "rgba(28,16,20,0.08)",
    focusRing: "#8f3f52",
    success: "#16a34a",
    warning: "#d97706",
    danger: "#dc2626",
    information: "#0284c7",
    navigationBackground: "#ffffff",
    navigationActive: "#f7ecef",
    dashboardOverlay: "rgba(28, 16, 20, 0.55)",
    viewerBackground: "#FFFFFF",
    watermarkColour: "#8f3f52"
  }
};

export const defaultRoleThemes: Record<Role, AppearanceThemeKey> = {
  SYSTEM_ADMIN: "EXECUTIVE_NAVY",
  COMPANY_SECRETARY: "EXECUTIVE_NAVY",
  BOARD_CHAIRMAN: "EXECUTIVE_NAVY",
  DIRECTOR: "BCB_EMERALD",
  COMMITTEE_MEMBER: "BCB_EMERALD",
  DEPARTMENT_USER: "BCB_EMERALD",
  ARCHIVE_USER: "HERITAGE_BURGUNDY",
  AUDITOR: "EXECUTIVE_NAVY"
};

export function isAppearanceTheme(value: string): value is AppearanceThemeKey {
  return appearanceThemeKeys.includes(value as AppearanceThemeKey);
}

export async function getSystemThemeSettings() {
  const settings = await prisma.portalAppearanceSetting.findUnique({ where: { id: SYSTEM_APPEARANCE_ID } });
  return {
    systemDefaultTheme: ((settings?.systemDefaultTheme ?? "EXECUTIVE_NAVY") as AppearanceThemeKey),
    allowUserThemeSelection: settings?.allowUserThemeSelection ?? true
  };
}

export async function getEffectiveTheme(userId?: string | null) {
  const system = await getSystemThemeSettings();
  if (!userId) return { theme: system.systemDefaultTheme, source: "system" as const, ...system };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { appearancePreference: true }
  });
  if (!user) return { theme: system.systemDefaultTheme, source: "system" as const, ...system };

  if (system.allowUserThemeSelection && user.appearancePreference?.selectedTheme) {
    return {
      theme: user.appearancePreference.selectedTheme as AppearanceThemeKey,
      source: "user" as const,
      ...system
    };
  }

  const roleSetting = await prisma.roleAppearanceSetting.findUnique({ where: { role: user.role } });
  if (roleSetting) {
    return {
      theme: roleSetting.defaultTheme as AppearanceThemeKey,
      source: "role" as const,
      ...system
    };
  }
  const builtInRoleTheme = defaultRoleThemes[user.role];
  if (builtInRoleTheme) {
    return {
      theme: builtInRoleTheme,
      source: "role-default" as const,
      ...system
    };
  }
  return {
    theme: system.systemDefaultTheme,
    source: "system" as const,
    ...system
  };
}

export async function updateUserThemePreference(userId: string, selectedTheme: AppearanceTheme) {
  const settings = await getSystemThemeSettings();
  if (!settings.allowUserThemeSelection) {
    throw new Error("Personal theme selection is currently disabled by an administrator.");
  }
  return prisma.userAppearancePreference.upsert({
    where: { userId },
    update: { selectedTheme },
    create: { userId, selectedTheme }
  });
}

export async function updateRoleThemeDefault(role: Role, defaultTheme: AppearanceTheme) {
  return prisma.roleAppearanceSetting.upsert({
    where: { role },
    update: { defaultTheme },
    create: { role, defaultTheme }
  });
}

export async function seedAppearanceDefaults() {
  await prisma.portalAppearanceSetting.upsert({
    where: { id: SYSTEM_APPEARANCE_ID },
    update: {},
    create: {
      id: SYSTEM_APPEARANCE_ID,
      systemDefaultTheme: "EXECUTIVE_NAVY",
      allowUserThemeSelection: true
    }
  });

  for (const [role, defaultTheme] of Object.entries(defaultRoleThemes)) {
    await prisma.roleAppearanceSetting.upsert({
      where: { role: role as Role },
      update: {},
      create: { role: role as Role, defaultTheme }
    });
  }
}
