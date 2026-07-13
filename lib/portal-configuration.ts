import { randomUUID } from "node:crypto";
import { PermissionEffect, Prisma, Role } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import type { AuthContext } from "@/lib/auth";
import { role as roleLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { hasPermission, canViewModule } from "@/lib/permissions";
import {
  dashboardWidgetDefinitions,
  dashboardWidgetVisibilityDefaults,
  moduleVisibilityDefaults,
  portalModuleDefinitions,
  type DashboardWidgetSize
} from "@/lib/permission-definitions";

export type PortalVisibilityValue = {
  isVisible: boolean;
  sortOrder: number;
};

export type WidgetVisibilityValue = PortalVisibilityValue & {
  size: DashboardWidgetSize;
};

export type UserPortalVisibilityValue = {
  isVisible: boolean | null;
  sortOrder: number | null;
};

export type UserWidgetVisibilityValue = UserPortalVisibilityValue & {
  size: DashboardWidgetSize | null;
};

export type PortalConfigurationAdminData = Awaited<ReturnType<typeof getPortalConfigurationAdminData>>;

export async function requirePortalConfigurationAdmin(auth: AuthContext) {
  const [moduleAllowed, manageAllowed] = await Promise.all([
    canViewModule(auth.user, "admin"),
    hasPermission(auth.user, "admin", "manage")
  ]);
  return moduleAllowed && manageAllowed;
}

export async function getPortalConfigurationAdminData() {
  await ensurePortalCatalog();

  const [modules, widgets, roleModules, userModules, roleWidgets, userWidgets, users] = await Promise.all([
    prisma.portalModule.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.dashboardWidget.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.moduleVisibility.findMany({ where: { role: { not: null } } }),
    prisma.moduleVisibility.findMany({ where: { userId: { not: null } } }),
    prisma.dashboardWidgetVisibility.findMany({ where: { role: { not: null } } }),
    prisma.dashboardWidgetVisibility.findMany({ where: { userId: { not: null } } }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, email: true, name: true, role: true, department: true, status: true }
    })
  ]);

  return {
    roles: Object.values(Role).map((value) => ({ value, label: roleLabel(value) })),
    modules: modules.map((module) => ({
      key: module.key,
      name: module.name,
      route: module.route,
      icon: module.icon,
      sortOrder: module.sortOrder,
      isActive: module.isActive
    })),
    widgets: widgets.map((widget) => ({
      key: widget.key,
      name: widget.name,
      description: widget.description,
      defaultSize: normalizeWidgetSize(widget.defaultSize),
      sortOrder: widget.sortOrder,
      isActive: widget.isActive
    })),
    users: users.map((user) => ({
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      status: user.status
    })),
    roleModules: groupRoleVisibility(roleModules, "moduleKey"),
    userModules: groupUserVisibility(userModules, users, "moduleKey"),
    roleWidgets: groupRoleWidgets(roleWidgets),
    userWidgets: groupUserWidgets(userWidgets, users)
  };
}

export async function updateRolePortalConfiguration(
  client: Prisma.TransactionClient,
  payload: ReturnType<typeof validateRolePortalPayload>
) {
  for (const [moduleKey, value] of Object.entries(payload.modules)) {
    await client.moduleVisibility.upsert({
      where: { role_moduleKey: { role: payload.role, moduleKey } },
      update: {
        effect: value.isVisible ? "ALLOW" : "DENY",
        sortOrder: value.sortOrder ?? 0
      },
      create: {
        id: stableId("module", payload.role, moduleKey),
        role: payload.role,
        moduleKey,
        effect: value.isVisible ? "ALLOW" : "DENY",
        sortOrder: value.sortOrder ?? 0
      }
    });
  }

  for (const [widgetKey, value] of Object.entries(payload.widgets)) {
    await client.dashboardWidgetVisibility.upsert({
      where: { role_widgetKey: { role: payload.role, widgetKey } },
      update: {
        effect: value.isVisible ? "ALLOW" : "DENY",
        sortOrder: value.sortOrder ?? 0,
        size: value.size ?? "medium"
      },
      create: {
        id: stableId("widget", payload.role, widgetKey),
        role: payload.role,
        widgetKey,
        effect: value.isVisible ? "ALLOW" : "DENY",
        sortOrder: value.sortOrder ?? 0,
        size: value.size ?? "medium"
      }
    });
  }
}

export async function updateUserPortalOverride(
  client: Prisma.TransactionClient,
  payload: ReturnType<typeof validateUserPortalPayload>
) {
  const user = await client.user.findUnique({ where: { email: payload.userEmail } });
  if (!user) throw new Error("User not found.");

  for (const [moduleKey, value] of Object.entries(payload.modules)) {
    if (value.isVisible === null) {
      await client.moduleVisibility.deleteMany({ where: { userId: user.id, moduleKey } });
      continue;
    }
    await client.moduleVisibility.upsert({
      where: { userId_moduleKey: { userId: user.id, moduleKey } },
      update: {
        effect: value.isVisible ? "ALLOW" : "DENY",
        sortOrder: value.sortOrder ?? 0
      },
      create: {
        id: stableId("module", user.id, moduleKey),
        userId: user.id,
        moduleKey,
        effect: value.isVisible ? "ALLOW" : "DENY",
        sortOrder: value.sortOrder ?? 0
      }
    });
  }

  for (const [widgetKey, value] of Object.entries(payload.widgets)) {
    if (value.isVisible === null) {
      await client.dashboardWidgetVisibility.deleteMany({ where: { userId: user.id, widgetKey } });
      continue;
    }
    await client.dashboardWidgetVisibility.upsert({
      where: { userId_widgetKey: { userId: user.id, widgetKey } },
      update: {
        effect: value.isVisible ? "ALLOW" : "DENY",
        sortOrder: value.sortOrder ?? 0,
        size: value.size ?? "medium"
      },
      create: {
        id: stableId("widget", user.id, widgetKey),
        userId: user.id,
        widgetKey,
        effect: value.isVisible ? "ALLOW" : "DENY",
        sortOrder: value.sortOrder ?? 0,
        size: value.size ?? "medium"
      }
    });
  }

  return user;
}

export async function resetRolePortalConfiguration(client: Prisma.TransactionClient, role: Role) {
  for (const visibility of moduleVisibilityDefaults.filter((row) => row.role === role)) {
    await client.moduleVisibility.upsert({
      where: { role_moduleKey: { role, moduleKey: visibility.key } },
      update: { effect: visibility.effect, sortOrder: visibility.sortOrder ?? 0 },
      create: {
        id: stableId("module", role, visibility.key),
        role,
        moduleKey: visibility.key,
        effect: visibility.effect,
        sortOrder: visibility.sortOrder ?? 0
      }
    });
  }

  for (const visibility of dashboardWidgetVisibilityDefaults.filter((row) => row.role === role)) {
    await client.dashboardWidgetVisibility.upsert({
      where: { role_widgetKey: { role, widgetKey: visibility.key } },
      update: { effect: visibility.effect, sortOrder: visibility.sortOrder ?? 0, size: visibility.size ?? "medium" },
      create: {
        id: stableId("widget", role, visibility.key),
        role,
        widgetKey: visibility.key,
        effect: visibility.effect,
        sortOrder: visibility.sortOrder ?? 0,
        size: visibility.size ?? "medium"
      }
    });
  }
}

export async function resetUserPortalOverrides(client: Prisma.TransactionClient, userEmail: string) {
  const user = await client.user.findUnique({ where: { email: userEmail } });
  if (!user) throw new Error("User not found.");
  await Promise.all([
    client.moduleVisibility.deleteMany({ where: { userId: user.id } }),
    client.dashboardWidgetVisibility.deleteMany({ where: { userId: user.id } })
  ]);
  return user;
}

export function validateRolePortalPayload(input: unknown) {
  const payload = input as {
    role?: Role;
    modules?: Record<string, PortalVisibilityValue>;
    widgets?: Record<string, WidgetVisibilityValue>;
  };
  if (!payload.role || !Object.values(Role).includes(payload.role)) throw new Error("Invalid role.");
  return {
    role: payload.role,
    modules: validateModuleValues(payload.modules, false),
    widgets: validateWidgetValues(payload.widgets, false)
  };
}

export function validateUserPortalPayload(input: unknown) {
  const payload = input as {
    userEmail?: string;
    modules?: Record<string, UserPortalVisibilityValue>;
    widgets?: Record<string, UserWidgetVisibilityValue>;
  };
  if (!payload.userEmail || !payload.userEmail.includes("@")) throw new Error("Select a valid user.");
  return {
    userEmail: payload.userEmail,
    modules: validateModuleValues(payload.modules, true),
    widgets: validateWidgetValues(payload.widgets, true)
  };
}

export function validateRole(input: unknown) {
  const role = (input as { role?: Role }).role;
  if (!role || !Object.values(Role).includes(role)) throw new Error("Invalid role.");
  return role;
}

export async function auditPortalConfigurationChange({
  auth,
  actionType,
  objectType,
  objectId,
  previousValue,
  newValue,
  meta
}: {
  auth: AuthContext;
  actionType: string;
  objectType: string;
  objectId: string;
  previousValue: unknown;
  newValue: unknown;
  meta: { ipAddress: string; browser: string };
}) {
  await createAuditLog({
    user: auth.user,
    actionType,
    objectType,
    objectId,
    previousValue: JSON.stringify(previousValue),
    newValue: JSON.stringify(newValue),
    ipAddress: meta.ipAddress,
    browser: meta.browser,
    deviceId: auth.session.deviceId,
    sessionId: auth.session.sessionToken,
    remarks: `${actionType} for ${objectId}.`
  });
}

export async function snapshotRolePortalConfiguration(role: Role) {
  const [modules, widgets] = await Promise.all([
    prisma.moduleVisibility.findMany({ where: { role }, orderBy: { moduleKey: "asc" } }),
    prisma.dashboardWidgetVisibility.findMany({ where: { role }, orderBy: { widgetKey: "asc" } })
  ]);
  return {
    modules: modules.map((row) => `${row.moduleKey}:${row.effect}:${row.sortOrder}`),
    widgets: widgets.map((row) => `${row.widgetKey}:${row.effect}:${row.sortOrder}:${row.size}`)
  };
}

export async function snapshotUserPortalConfiguration(userEmail: string) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) return null;
  const [modules, widgets] = await Promise.all([
    prisma.moduleVisibility.findMany({ where: { userId: user.id }, orderBy: { moduleKey: "asc" } }),
    prisma.dashboardWidgetVisibility.findMany({ where: { userId: user.id }, orderBy: { widgetKey: "asc" } })
  ]);
  return {
    modules: modules.map((row) => `${row.moduleKey}:${row.effect}:${row.sortOrder}`),
    widgets: widgets.map((row) => `${row.widgetKey}:${row.effect}:${row.sortOrder}:${row.size}`)
  };
}

async function ensurePortalCatalog() {
  for (const portalModule of portalModuleDefinitions) {
    await prisma.portalModule.upsert({
      where: { key: portalModule.key },
      update: portalModule,
      create: { id: stableId("portal-module", portalModule.key), ...portalModule, isActive: true }
    });
  }
  for (const widget of dashboardWidgetDefinitions) {
    await prisma.dashboardWidget.upsert({
      where: { key: widget.key },
      update: widget,
      create: { id: stableId("dashboard-widget", widget.key), ...widget, isActive: true }
    });
  }
}

function validateModuleValues(
  input: Record<string, { isVisible: boolean | null; sortOrder?: number | null }> | undefined,
  nullable: boolean
) {
  const output: Record<string, { isVisible: boolean | null; sortOrder: number | null }> = {};
  const allowed = new Set(portalModuleDefinitions.map((module) => module.key));
  for (const [key, value] of Object.entries(input ?? {})) {
    if (!allowed.has(key)) throw new Error(`Unknown module: ${key}`);
    if (value.isVisible !== null && typeof value.isVisible !== "boolean") throw new Error("Invalid module visibility.");
    if (!nullable && value.isVisible === null) throw new Error("Role visibility cannot inherit.");
    output[key] = {
      isVisible: value.isVisible,
      sortOrder: normalizeSort(value.sortOrder)
    };
  }
  return output;
}

function validateWidgetValues(
  input: Record<string, { isVisible: boolean | null; sortOrder?: number | null; size?: string | null }> | undefined,
  nullable: boolean
) {
  const output: Record<string, { isVisible: boolean | null; sortOrder: number | null; size: DashboardWidgetSize | null }> = {};
  const allowed = new Set(dashboardWidgetDefinitions.map((widget) => widget.key));
  for (const [key, value] of Object.entries(input ?? {})) {
    if (!allowed.has(key)) throw new Error(`Unknown widget: ${key}`);
    if (value.isVisible !== null && typeof value.isVisible !== "boolean") throw new Error("Invalid widget visibility.");
    if (!nullable && value.isVisible === null) throw new Error("Role widget visibility cannot inherit.");
    output[key] = {
      isVisible: value.isVisible,
      sortOrder: normalizeSort(value.sortOrder),
      size: value.size ? normalizeWidgetSize(value.size) : null
    };
  }
  return output;
}

function normalizeSort(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  if (!Number.isInteger(value) || value < 0 || value > 9999) throw new Error("Sort order must be between 0 and 9999.");
  return value;
}

function normalizeWidgetSize(value: string): DashboardWidgetSize {
  if (value === "small" || value === "medium" || value === "large") return value;
  throw new Error("Invalid widget size.");
}

function groupRoleVisibility<T extends { role: Role | null; effect: PermissionEffect; sortOrder: number }>(
  rows: T[],
  key: keyof T
) {
  const grouped: Record<string, Record<string, PortalVisibilityValue>> = {};
  for (const row of rows) {
    if (!row.role) continue;
    grouped[row.role] ??= {};
    grouped[row.role][String(row[key])] = {
      isVisible: row.effect === "ALLOW",
      sortOrder: row.sortOrder
    };
  }
  return grouped;
}

function groupUserVisibility<T extends { userId: string | null; effect: PermissionEffect; sortOrder: number }>(
  rows: T[],
  users: { id: string; email: string }[],
  key: keyof T
) {
  const emailById = new Map(users.map((user) => [user.id, user.email]));
  const grouped: Record<string, Record<string, UserPortalVisibilityValue>> = {};
  for (const row of rows) {
    if (!row.userId) continue;
    const email = emailById.get(row.userId);
    if (!email) continue;
    grouped[email] ??= {};
    grouped[email][String(row[key])] = {
      isVisible: row.effect === "ALLOW",
      sortOrder: row.sortOrder
    };
  }
  return grouped;
}

function groupRoleWidgets(rows: Array<{ role: Role | null; widgetKey: string; effect: PermissionEffect; sortOrder: number; size: string }>) {
  const grouped: Record<string, Record<string, WidgetVisibilityValue>> = {};
  for (const row of rows) {
    if (!row.role) continue;
    grouped[row.role] ??= {};
    grouped[row.role][row.widgetKey] = {
      isVisible: row.effect === "ALLOW",
      sortOrder: row.sortOrder,
      size: normalizeWidgetSize(row.size)
    };
  }
  return grouped;
}

function groupUserWidgets(
  rows: Array<{ userId: string | null; widgetKey: string; effect: PermissionEffect; sortOrder: number; size: string }>,
  users: { id: string; email: string }[]
) {
  const emailById = new Map(users.map((user) => [user.id, user.email]));
  const grouped: Record<string, Record<string, UserWidgetVisibilityValue>> = {};
  for (const row of rows) {
    if (!row.userId) continue;
    const email = emailById.get(row.userId);
    if (!email) continue;
    grouped[email] ??= {};
    grouped[email][row.widgetKey] = {
      isVisible: row.effect === "ALLOW",
      sortOrder: row.sortOrder,
      size: normalizeWidgetSize(row.size)
    };
  }
  return grouped;
}

function stableId(...parts: string[]) {
  const value = parts.join("-").replace(/[^a-zA-Z0-9_-]/g, "-");
  return value.length > 180 ? `${value.slice(0, 160)}-${randomUUID()}` : value;
}
