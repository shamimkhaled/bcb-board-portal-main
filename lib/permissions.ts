import { notFound } from "next/navigation";
import type { PermissionEffect, Role, User } from "@prisma/client";
import {
  dashboardWidgetDefinitions,
  dashboardWidgetVisibilityDefaults,
  moduleVisibilityDefaults,
  portalModuleDefinitions,
  type DashboardWidgetSize
} from "@/lib/permission-definitions";
import { prisma } from "./prisma";

type PermissionUser = Pick<User, "id" | "role">;

type EffectEntry = {
  effect: PermissionEffect;
};

type VisibilityEntry = EffectEntry & {
  sortOrder?: number;
  size?: string | null;
};

export type PermissionDecision = {
  allowed: boolean;
  reason: "explicit-deny" | "explicit-allow" | "no-match";
};

export function resolveEffect(entries: EffectEntry[]): PermissionDecision {
  if (entries.some((entry) => entry.effect === "DENY")) {
    return { allowed: false, reason: "explicit-deny" };
  }
  if (entries.some((entry) => entry.effect === "ALLOW")) {
    return { allowed: true, reason: "explicit-allow" };
  }
  return { allowed: false, reason: "no-match" };
}

export async function hasPermission(user: PermissionUser, resource: string, action: string) {
  const permission = await prisma.permission.findUnique({
    where: { resource_action: { resource, action } },
    include: {
      rolePermissions: { where: { role: user.role } },
      userOverrides: { where: { userId: user.id } }
    }
  });

  if (!permission) return false;
  return resolveEffect([...permission.userOverrides, ...permission.rolePermissions]).allowed;
}

export async function requirePermission(user: PermissionUser, resource: string, action: string) {
  if (!(await hasPermission(user, resource, action))) notFound();
}

export async function canViewModule(user: PermissionUser, moduleKey: string) {
  const entries = await prisma.moduleVisibility.findMany({
    where: {
      moduleKey,
      OR: [{ userId: user.id }, { role: user.role }]
    }
  });
  return resolveVisibility(entries, systemModuleDefault(user.role, moduleKey)).allowed;
}

export async function requireModule(user: PermissionUser, moduleKey: string) {
  if (!(await canViewModule(user, moduleKey))) notFound();
}

export async function visibleModules(user: PermissionUser, moduleKeys: readonly string[]) {
  const modules = await getVisibleModules(user);
  const visible = new Set(modules.map((module) => module.key));
  return moduleKeys.filter((moduleKey) => visible.has(moduleKey));
}

export type EffectivePortalModule = {
  key: string;
  name: string;
  route: string;
  icon: string;
  sortOrder: number;
  source: "user" | "role" | "system";
};

export type EffectiveDashboardWidget = {
  key: string;
  name: string;
  description: string;
  size: DashboardWidgetSize;
  sortOrder: number;
  source: "user" | "role" | "system";
};

export async function getVisibleModules(user: PermissionUser): Promise<EffectivePortalModule[]> {
  const entries = await prisma.moduleVisibility.findMany({
    where: {
      OR: [{ userId: user.id }, { role: user.role }]
    }
  });

  const dbModules = await prisma.portalModule.findMany({ where: { isActive: true } }).catch(() => []);
  const definitions = dbModules.length
    ? dbModules.map((module) => ({
        key: module.key,
        name: module.name,
        route: module.route,
        icon: module.icon,
        sortOrder: module.sortOrder
      }))
    : portalModuleDefinitions;

  return definitions
    .map((module) => {
      const decision = resolveVisibility(
        entries.filter((entry) => entry.moduleKey === module.key),
        systemModuleDefault(user.role, module.key)
      );
      return {
        ...module,
        sortOrder: decision.sortOrder ?? module.sortOrder,
        source: decision.source
      };
    })
    .filter((module) => resolveVisibility(
      entries.filter((entry) => entry.moduleKey === module.key),
      systemModuleDefault(user.role, module.key)
    ).allowed)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export async function getVisibleWidgets(user: PermissionUser): Promise<EffectiveDashboardWidget[]> {
  const entries = await prisma.dashboardWidgetVisibility.findMany({
    where: {
      OR: [{ userId: user.id }, { role: user.role }]
    }
  });

  const dbWidgets = await prisma.dashboardWidget.findMany({ where: { isActive: true } }).catch(() => []);
  const definitions = dbWidgets.length
    ? dbWidgets.map((widget) => ({
        key: widget.key,
        name: widget.name,
        description: widget.description,
        defaultSize: widget.defaultSize as DashboardWidgetSize,
        sortOrder: widget.sortOrder
      }))
    : dashboardWidgetDefinitions;

  return definitions
    .map((widget) => {
      const decision = resolveVisibility(
        entries.filter((entry) => entry.widgetKey === widget.key),
        systemWidgetDefault(user.role, widget.key)
      );
      return {
        key: widget.key,
        name: widget.name,
        description: widget.description,
        size: normalizeWidgetSize(decision.size ?? widget.defaultSize),
        sortOrder: decision.sortOrder ?? widget.sortOrder,
        source: decision.source
      };
    })
    .filter((widget) => resolveVisibility(
      entries.filter((entry) => entry.widgetKey === widget.key),
      systemWidgetDefault(user.role, widget.key)
    ).allowed)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export async function getEffectivePortalConfiguration(user: PermissionUser) {
  const [modules, widgets] = await Promise.all([getVisibleModules(user), getVisibleWidgets(user)]);
  return { modules, widgets };
}

function resolveVisibility(entries: VisibilityEntry[], fallback: VisibilityEntry & { source?: "system" }) {
  const userEntry = entries.find((entry) => "userId" in entry && (entry as { userId?: string | null }).userId);
  if (userEntry) {
    return {
      allowed: userEntry.effect === "ALLOW",
      sortOrder: userEntry.sortOrder,
      size: userEntry.size,
      source: "user" as const
    };
  }

  const roleEntry = entries.find((entry) => "role" in entry && (entry as { role?: Role | null }).role);
  if (roleEntry) {
    return {
      allowed: roleEntry.effect === "ALLOW",
      sortOrder: roleEntry.sortOrder,
      size: roleEntry.size,
      source: "role" as const
    };
  }

  return {
    allowed: fallback.effect === "ALLOW",
    sortOrder: fallback.sortOrder,
    size: fallback.size,
    source: "system" as const
  };
}

function systemModuleDefault(role: Role, moduleKey: string): VisibilityEntry {
  const defaultRow = moduleVisibilityDefaults.find((row) => row.role === role && row.key === moduleKey);
  return { effect: defaultRow?.effect ?? "DENY", sortOrder: defaultRow?.sortOrder ?? 0 };
}

function systemWidgetDefault(role: Role, widgetKey: string): VisibilityEntry {
  const defaultRow = dashboardWidgetVisibilityDefaults.find((row) => row.role === role && row.key === widgetKey);
  return { effect: defaultRow?.effect ?? "DENY", sortOrder: defaultRow?.sortOrder ?? 0, size: defaultRow?.size ?? "medium" };
}

function normalizeWidgetSize(size: string | null | undefined): DashboardWidgetSize {
  return size === "small" || size === "large" ? size : "medium";
}

export async function visibleDashboardWidgets(user: PermissionUser, widgetKeys: readonly string[]) {
  const widgets = await getVisibleWidgets(user);
  return new Set(
    widgets.filter((widget) => widgetKeys.includes(widget.key as (typeof widgetKeys)[number])).map((widget) => widget.key)
  );
}

export async function canViewDashboardWidget(user: PermissionUser, widgetKey: string) {
  const widgets = await visibleDashboardWidgets(user, [widgetKey]);
  return widgets.has(widgetKey);
}

export async function canAccessDocumentCategory(
  user: PermissionUser,
  category: string,
  action: "viewMetadata" | "viewContent" | "upload" | "approve"
) {
  const entries = await prisma.documentCategoryPermission.findMany({
    where: {
      action,
      category: { in: [category, "*"] },
      OR: [{ userId: user.id }, { role: user.role }]
    }
  });

  return resolveEffect(entries).allowed;
}

export async function hasDocumentContentAccess(
  user: PermissionUser,
  document: { documentType: string }
) {
  const [canViewContent, canViewCategory] = await Promise.all([
    hasPermission(user, "documents", "viewContent"),
    canAccessDocumentCategory(user, document.documentType, "viewContent")
  ]);
  return canViewContent && canViewCategory;
}

export async function hasDocumentMetadataAccess(
  user: PermissionUser,
  document: { documentType: string }
) {
  const [canViewMetadata, canViewCategory] = await Promise.all([
    hasPermission(user, "documents", "viewMetadata"),
    canAccessDocumentCategory(user, document.documentType, "viewMetadata")
  ]);
  return canViewMetadata && canViewCategory;
}

export async function permittedRoleControls(role: Role, user: PermissionUser) {
  const [secretary, chairman, admin] = await Promise.all([
    hasPermission(user, "memos", "secretaryReview"),
    hasPermission(user, "memos", "chairmanApprove"),
    hasPermission(user, "admin", "manage")
  ]);

  return {
    canSecretary: secretary,
    canChairman: chairman,
    canAdmin: role === "SYSTEM_ADMIN" && admin
  };
}
