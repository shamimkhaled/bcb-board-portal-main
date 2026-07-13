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
    background: "#071726",
    backgroundSecondary: "#0D2235",
    surface: "#F8FAFC",
    surfaceElevated: "#FFFFFF",
    glassSurface: "rgba(12, 31, 49, 0.88)",
    foreground: "#F8FAFC",
    foregroundSecondary: "#CBD5E1",
    foregroundMuted: "#94A3B8",
    primary: "#D6A84B",
    primaryHover: "#E4BD69",
    primaryForeground: "#071726",
    secondary: "#0D2235",
    border: "rgba(255,255,255,0.14)",
    focusRing: "#D6A84B",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    information: "#38BDF8",
    navigationBackground: "#071726",
    navigationActive: "#F8FAFC",
    dashboardOverlay: "rgba(3, 8, 19, 0.78)",
    viewerBackground: "#F8FAFC",
    watermarkColour: "#006A4E"
  },
  BCB_EMERALD: {
    background: "#071B17",
    backgroundSecondary: "#0C2A23",
    surface: "#F7FAF8",
    surfaceElevated: "#FFFFFF",
    glassSurface: "rgba(10, 42, 35, 0.88)",
    foreground: "#F7FAF8",
    foregroundSecondary: "#D2E2DC",
    foregroundMuted: "#91AAA1",
    primary: "#C8A85A",
    primaryHover: "#E0C074",
    primaryForeground: "#071B17",
    secondary: "#2FA37C",
    border: "rgba(196,224,214,0.16)",
    focusRing: "#C8A85A",
    success: "#34D399",
    warning: "#F4B942",
    danger: "#F87171",
    information: "#5CC8E8",
    navigationBackground: "#071B17",
    navigationActive: "#F7FAF8",
    dashboardOverlay: "rgba(7, 27, 23, 0.78)",
    viewerBackground: "#F7FAF8",
    watermarkColour: "#2FA37C"
  },
  HERITAGE_BURGUNDY: {
    background: "#211014",
    backgroundSecondary: "#321820",
    surface: "#FFF9F2",
    surfaceElevated: "#FFFFFF",
    glassSurface: "rgba(51, 24, 32, 0.90)",
    foreground: "#FFF9F2",
    foregroundSecondary: "#E8DCD8",
    foregroundMuted: "#BBA5A7",
    primary: "#D4B06A",
    primaryHover: "#E2C17D",
    primaryForeground: "#211014",
    secondary: "#9D4E5E",
    border: "rgba(255,235,218,0.15)",
    focusRing: "#D4B06A",
    success: "#5EC18A",
    warning: "#EAB65B",
    danger: "#F27575",
    information: "#7EB6D9",
    navigationBackground: "#211014",
    navigationActive: "#FFF9F2",
    dashboardOverlay: "rgba(33, 16, 20, 0.80)",
    viewerBackground: "#FFF9F2",
    watermarkColour: "#9D4E5E"
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
  return {
    theme: ((roleSetting?.defaultTheme ?? defaultRoleThemes[user.role] ?? system.systemDefaultTheme) as AppearanceThemeKey),
    source: roleSetting ? ("role" as const) : ("system" as const),
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
