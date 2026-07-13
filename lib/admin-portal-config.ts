import { randomUUID } from "node:crypto";
import { PermissionEffect, Prisma, Role } from "@prisma/client";
import {
  dashboardWidgetKeys,
  documentCategories,
  documentCategoryActions,
  moduleKeys,
  permissionDefinitions
} from "@/lib/permission-definitions";
import { role as roleLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { hasPermission, canViewModule } from "@/lib/permissions";
import type { AuthContext } from "@/lib/auth";

export type EffectValue = "ALLOW" | "DENY";
export type NullableEffectValue = EffectValue | null;

export type WatermarkSettings = {
  enabled: boolean;
  includeName: boolean;
  includeRole: boolean;
  includeTimestamp: boolean;
  includeIpAddress: boolean;
  includeDeviceId: boolean;
  opacity: number;
  density: number;
};

export type AdminPortalConfig = Awaited<ReturnType<typeof getAdminPortalConfig>>;

export const roleOptions = Object.values(Role).map((value) => ({
  value,
  label: roleLabel(value)
}));

const permissionKeys = new Set(permissionDefinitions.map((permission) => permissionKey(permission.resource, permission.action)));
const moduleKeySet = new Set<string>(moduleKeys);
const widgetKeySet = new Set<string>(dashboardWidgetKeys);
const categorySet = new Set<string>(documentCategories);
const categoryActionSet = new Set<string>(documentCategoryActions);

export function permissionKey(resource: string, action: string) {
  return `${resource}:${action}`;
}

export function categoryPermissionKey(category: string, action: string) {
  return `${category}::${action}`;
}

export function splitPermissionKey(key: string) {
  const [resource, action] = key.split(":");
  return { resource, action };
}

export function splitCategoryPermissionKey(key: string) {
  const [category, action] = key.split("::");
  return { category, action };
}

export async function requirePortalConfigAdmin(auth: AuthContext) {
  const [moduleAllowed, manageAllowed] = await Promise.all([
    canViewModule(auth.user, "admin"),
    hasPermission(auth.user, "admin", "manage")
  ]);

  if (!moduleAllowed || !manageAllowed) {
    return false;
  }

  return true;
}

export async function getAdminPortalConfig() {
  const [permissions, users, rolePermissions, userPermissionOverrides, modules, widgets, categories, watermarks] =
    await Promise.all([
      prisma.permission.findMany({ orderBy: [{ resource: "asc" }, { action: "asc" }] }),
      prisma.user.findMany({
        orderBy: { name: "asc" },
        select: { id: true, email: true, name: true, role: true, department: true, status: true }
      }),
      prisma.rolePermission.findMany({ include: { permission: true } }),
      prisma.userPermissionOverride.findMany({ include: { permission: true, user: { select: { email: true } } } }),
      prisma.moduleVisibility.findMany(),
      prisma.dashboardWidgetVisibility.findMany(),
      prisma.documentCategoryPermission.findMany(),
      prisma.watermarkPolicy.findMany({ include: { user: { select: { email: true } } } })
    ]);

  return {
    roles: roleOptions,
    users: users.map((user) => ({
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      status: user.status
    })),
    permissionDefinitions: permissions.map((permission) => ({
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
      sensitive: permission.sensitive
    })),
    moduleKeys,
    dashboardWidgetKeys,
    documentCategories,
    documentCategoryActions,
    rolePermissions: groupByRole(
      rolePermissions,
      (row) => permissionKey(row.permission.resource, row.permission.action),
      (row) => row.effect
    ),
    userPermissionOverrides: groupByUserEmail(
      userPermissionOverrides,
      (row) => permissionKey(row.permission.resource, row.permission.action),
      (row) => row.effect
    ),
    roleModules: groupByRole(
      modules.filter((row) => row.role),
      (row) => row.moduleKey,
      (row) => row.effect
    ),
    userModules: groupByUserId(
      modules.filter((row) => row.userId),
      users,
      (row) => row.moduleKey,
      (row) => row.effect
    ),
    roleWidgets: groupByRole(
      widgets.filter((row) => row.role),
      (row) => row.widgetKey,
      (row) => row.effect
    ),
    userWidgets: groupByUserId(
      widgets.filter((row) => row.userId),
      users,
      (row) => row.widgetKey,
      (row) => row.effect
    ),
    roleDocumentCategories: groupByRole(
      categories.filter((row) => row.role),
      (row) => categoryPermissionKey(row.category, row.action),
      (row) => row.effect
    ),
    userDocumentCategories: groupByUserId(
      categories.filter((row) => row.userId),
      users,
      (row) => categoryPermissionKey(row.category, row.action),
      (row) => row.effect
    ),
    roleWatermarks: groupByRole(
      watermarks.filter((row) => row.role),
      (row) => row.category,
      (row) => watermarkFromRow(row)
    ),
    userWatermarks: groupByWatermarkUser(watermarks.filter((row) => row.userId))
  };
}

export function validateRolePayload(input: unknown) {
  const payload = input as {
    role?: Role;
    permissions?: Record<string, EffectValue>;
    modules?: Record<string, EffectValue>;
    widgets?: Record<string, EffectValue>;
    categories?: Record<string, EffectValue>;
    watermarks?: Record<string, WatermarkSettings>;
  };

  if (!payload.role || !Object.values(Role).includes(payload.role)) throw new Error("Invalid role.");

  return {
    role: payload.role,
    permissions: validateEffectMap(payload.permissions, permissionKeys, "permission"),
    modules: validateEffectMap(payload.modules, moduleKeySet, "module"),
    widgets: validateEffectMap(payload.widgets, widgetKeySet, "dashboard widget"),
    categories: validateCategoryEffectMap(payload.categories),
    watermarks: validateWatermarks(payload.watermarks)
  };
}

export function validateUserPayload(input: unknown) {
  const payload = input as {
    userEmail?: string;
    permissions?: Record<string, NullableEffectValue>;
    modules?: Record<string, NullableEffectValue>;
    widgets?: Record<string, NullableEffectValue>;
    categories?: Record<string, NullableEffectValue>;
    watermarks?: Record<string, WatermarkSettings | null>;
  };

  if (!payload.userEmail || !payload.userEmail.includes("@")) throw new Error("Select a valid user.");

  return {
    userEmail: payload.userEmail,
    permissions: validateNullableEffectMap(payload.permissions, permissionKeys, "permission"),
    modules: validateNullableEffectMap(payload.modules, moduleKeySet, "module"),
    widgets: validateNullableEffectMap(payload.widgets, widgetKeySet, "dashboard widget"),
    categories: validateNullableCategoryEffectMap(payload.categories),
    watermarks: validateNullableWatermarks(payload.watermarks)
  };
}

export async function saveRoleConfig(client: Prisma.TransactionClient, payload: ReturnType<typeof validateRolePayload>) {
  const permissions = await client.permission.findMany();
  const permissionIdByKey = new Map(permissions.map((permission) => [permissionKey(permission.resource, permission.action), permission.id]));

  for (const [key, effect] of Object.entries(payload.permissions)) {
    const permissionId = permissionIdByKey.get(key);
    if (!permissionId) continue;
    await client.rolePermission.upsert({
      where: { role_permissionId: { role: payload.role, permissionId } },
      update: { effect },
      create: {
        id: stableId("role-perm", payload.role, permissionId),
        role: payload.role,
        permissionId,
        effect
      }
    });
  }

  for (const [moduleKey, effect] of Object.entries(payload.modules)) {
    await client.moduleVisibility.upsert({
      where: { role_moduleKey: { role: payload.role, moduleKey } },
      update: { effect },
      create: { id: stableId("module", payload.role, moduleKey), role: payload.role, moduleKey, effect }
    });
  }

  for (const [widgetKey, effect] of Object.entries(payload.widgets)) {
    await client.dashboardWidgetVisibility.upsert({
      where: { role_widgetKey: { role: payload.role, widgetKey } },
      update: { effect },
      create: { id: stableId("widget", payload.role, widgetKey), role: payload.role, widgetKey, effect }
    });
  }

  for (const [key, effect] of Object.entries(payload.categories)) {
    const { category, action } = splitCategoryPermissionKey(key);
    await client.documentCategoryPermission.upsert({
      where: { role_category_action: { role: payload.role, category, action } },
      update: { effect },
      create: { id: stableId("doc-cat", payload.role, category, action), role: payload.role, category, action, effect }
    });
  }

  for (const [category, policy] of Object.entries(payload.watermarks)) {
    await client.watermarkPolicy.upsert({
      where: { role_category: { role: payload.role, category } },
      update: policy,
      create: { id: stableId("watermark", payload.role, category), role: payload.role, category, ...policy }
    });
  }
}

export async function saveUserOverrides(client: Prisma.TransactionClient, payload: ReturnType<typeof validateUserPayload>) {
  const user = await client.user.findUnique({ where: { email: payload.userEmail } });
  if (!user) throw new Error("User not found.");

  const permissions = await client.permission.findMany();
  const permissionIdByKey = new Map(permissions.map((permission) => [permissionKey(permission.resource, permission.action), permission.id]));

  for (const [key, effect] of Object.entries(payload.permissions)) {
    const permissionId = permissionIdByKey.get(key);
    if (!permissionId) continue;
    if (!effect) {
      await client.userPermissionOverride.deleteMany({ where: { userId: user.id, permissionId } });
      continue;
    }
    await client.userPermissionOverride.upsert({
      where: { userId_permissionId: { userId: user.id, permissionId } },
      update: { effect },
      create: { id: stableId("user-perm", user.id, permissionId), userId: user.id, permissionId, effect }
    });
  }

  for (const [moduleKey, effect] of Object.entries(payload.modules)) {
    if (!effect) {
      await client.moduleVisibility.deleteMany({ where: { userId: user.id, moduleKey } });
      continue;
    }
    await client.moduleVisibility.upsert({
      where: { userId_moduleKey: { userId: user.id, moduleKey } },
      update: { effect },
      create: { id: stableId("module", user.id, moduleKey), userId: user.id, moduleKey, effect }
    });
  }

  for (const [widgetKey, effect] of Object.entries(payload.widgets)) {
    if (!effect) {
      await client.dashboardWidgetVisibility.deleteMany({ where: { userId: user.id, widgetKey } });
      continue;
    }
    await client.dashboardWidgetVisibility.upsert({
      where: { userId_widgetKey: { userId: user.id, widgetKey } },
      update: { effect },
      create: { id: stableId("widget", user.id, widgetKey), userId: user.id, widgetKey, effect }
    });
  }

  for (const [key, effect] of Object.entries(payload.categories)) {
    const { category, action } = splitCategoryPermissionKey(key);
    if (!effect) {
      await client.documentCategoryPermission.deleteMany({ where: { userId: user.id, category, action } });
      continue;
    }
    await client.documentCategoryPermission.upsert({
      where: { userId_category_action: { userId: user.id, category, action } },
      update: { effect },
      create: { id: stableId("doc-cat", user.id, category, action), userId: user.id, category, action, effect }
    });
  }

  for (const [category, policy] of Object.entries(payload.watermarks)) {
    if (!policy) {
      await client.watermarkPolicy.deleteMany({ where: { userId: user.id, category } });
      continue;
    }
    await client.watermarkPolicy.upsert({
      where: { userId_category: { userId: user.id, category } },
      update: policy,
      create: { id: stableId("watermark", user.id, category), userId: user.id, category, ...policy }
    });
  }

  return user;
}

export async function resetUserOverrides(client: Prisma.TransactionClient, userEmail: string) {
  const user = await client.user.findUnique({ where: { email: userEmail } });
  if (!user) throw new Error("User not found.");

  await Promise.all([
    client.userPermissionOverride.deleteMany({ where: { userId: user.id } }),
    client.moduleVisibility.deleteMany({ where: { userId: user.id } }),
    client.dashboardWidgetVisibility.deleteMany({ where: { userId: user.id } }),
    client.documentCategoryPermission.deleteMany({ where: { userId: user.id } }),
    client.watermarkPolicy.deleteMany({ where: { userId: user.id } })
  ]);

  return user;
}

function validateEffectMap(input: Record<string, EffectValue> | undefined, allowedKeys: Set<string>, label: string) {
  const entries = Object.entries(input ?? {});
  for (const [key, effect] of entries) {
    if (!allowedKeys.has(key)) throw new Error(`Unknown ${label}: ${key}`);
    if (!Object.values(PermissionEffect).includes(effect)) throw new Error(`Invalid ${label} effect.`);
  }
  return Object.fromEntries(entries) as Record<string, EffectValue>;
}

function validateNullableEffectMap(input: Record<string, NullableEffectValue> | undefined, allowedKeys: Set<string>, label: string) {
  const entries = Object.entries(input ?? {});
  for (const [key, effect] of entries) {
    if (!allowedKeys.has(key)) throw new Error(`Unknown ${label}: ${key}`);
    if (effect !== null && !Object.values(PermissionEffect).includes(effect)) throw new Error(`Invalid ${label} effect.`);
  }
  return Object.fromEntries(entries) as Record<string, NullableEffectValue>;
}

function validateCategoryEffectMap(input: Record<string, EffectValue> | undefined) {
  const entries = Object.entries(input ?? {});
  for (const [key, effect] of entries) {
    const { category, action } = splitCategoryPermissionKey(key);
    if (!categorySet.has(category) || !categoryActionSet.has(action)) throw new Error(`Unknown document category permission: ${key}`);
    if (!Object.values(PermissionEffect).includes(effect)) throw new Error("Invalid document category effect.");
  }
  return Object.fromEntries(entries) as Record<string, EffectValue>;
}

function validateNullableCategoryEffectMap(input: Record<string, NullableEffectValue> | undefined) {
  const entries = Object.entries(input ?? {});
  for (const [key, effect] of entries) {
    const { category, action } = splitCategoryPermissionKey(key);
    if (!categorySet.has(category) || !categoryActionSet.has(action)) throw new Error(`Unknown document category permission: ${key}`);
    if (effect !== null && !Object.values(PermissionEffect).includes(effect)) throw new Error("Invalid document category effect.");
  }
  return Object.fromEntries(entries) as Record<string, NullableEffectValue>;
}

function validateWatermarks(input: Record<string, WatermarkSettings> | undefined) {
  const entries = Object.entries(input ?? {});
  for (const [category, policy] of entries) {
    if (!categorySet.has(category)) throw new Error(`Unknown watermark category: ${category}`);
    validateWatermarkPolicy(policy);
  }
  return Object.fromEntries(entries) as Record<string, WatermarkSettings>;
}

function validateNullableWatermarks(input: Record<string, WatermarkSettings | null> | undefined) {
  const entries = Object.entries(input ?? {});
  for (const [category, policy] of entries) {
    if (!categorySet.has(category)) throw new Error(`Unknown watermark category: ${category}`);
    if (policy) validateWatermarkPolicy(policy);
  }
  return Object.fromEntries(entries) as Record<string, WatermarkSettings | null>;
}

function validateWatermarkPolicy(policy: WatermarkSettings) {
  const flags = [
    policy.enabled,
    policy.includeName,
    policy.includeRole,
    policy.includeTimestamp,
    policy.includeIpAddress,
    policy.includeDeviceId
  ];
  if (flags.some((flag) => typeof flag !== "boolean")) throw new Error("Invalid watermark boolean setting.");
  if (!Number.isInteger(policy.opacity) || policy.opacity < 10 || policy.opacity > 80) {
    throw new Error("Watermark opacity must be between 10 and 80.");
  }
  if (!Number.isInteger(policy.density) || policy.density < 8 || policy.density > 48) {
    throw new Error("Watermark density must be between 8 and 48.");
  }
}

function groupByRole<T, V>(rows: T[], keyOf: (row: T) => string, valueOf: (row: T) => V) {
  const grouped: Record<string, Record<string, V>> = {};
  for (const row of rows) {
    const role = String((row as { role?: Role | null }).role);
    grouped[role] ??= {};
    grouped[role][keyOf(row)] = valueOf(row);
  }
  return grouped;
}

function groupByUserEmail<T extends { user: { email: string } }, V>(rows: T[], keyOf: (row: T) => string, valueOf: (row: T) => V) {
  const grouped: Record<string, Record<string, V>> = {};
  for (const row of rows) {
    grouped[row.user.email] ??= {};
    grouped[row.user.email][keyOf(row)] = valueOf(row);
  }
  return grouped;
}

function groupByUserId<T extends { userId: string | null }, V>(
  rows: T[],
  users: { id?: string; email: string }[],
  keyOf: (row: T) => string,
  valueOf: (row: T) => V
) {
  const emailById = new Map<string, string>();
  for (const user of users) {
    if (user.id) emailById.set(user.id, user.email);
  }
  const grouped: Record<string, Record<string, V>> = {};
  for (const row of rows) {
    if (!row.userId) continue;
    const email = emailById.get(row.userId);
    if (!email) continue;
    grouped[email] ??= {};
    grouped[email][keyOf(row)] = valueOf(row);
  }
  return grouped;
}

function groupByWatermarkUser(rows: Array<Prisma.WatermarkPolicyGetPayload<{ include: { user: { select: { email: true } } } }>>) {
  const grouped: Record<string, Record<string, WatermarkSettings>> = {};
  for (const row of rows) {
    if (!row.user?.email) continue;
    grouped[row.user.email] ??= {};
    grouped[row.user.email][row.category] = watermarkFromRow(row);
  }
  return grouped;
}

function watermarkFromRow(row: {
  enabled: boolean;
  includeName: boolean;
  includeRole: boolean;
  includeTimestamp: boolean;
  includeIpAddress: boolean;
  includeDeviceId: boolean;
  opacity: number;
  density: number;
}) {
  return {
    enabled: row.enabled,
    includeName: row.includeName,
    includeRole: row.includeRole,
    includeTimestamp: row.includeTimestamp,
    includeIpAddress: row.includeIpAddress,
    includeDeviceId: row.includeDeviceId,
    opacity: row.opacity,
    density: row.density
  };
}

function stableId(...parts: string[]) {
  const value = parts.join("-").replace(/[^a-zA-Z0-9_-]/g, "-");
  return value.length > 180 ? `${value.slice(0, 160)}-${randomUUID()}` : value;
}
