import { PrismaClient } from "@prisma/client";
import {
  dashboardWidgetVisibilityDefaults,
  dashboardWidgetDefinitions,
  documentCategoryPermissionDefaults,
  moduleVisibilityDefaults,
  permissionDefinitions,
  portalModuleDefinitions,
  rolePermissionDefaults,
  watermarkPolicyDefaults
} from "../lib/permission-definitions";

function stableId(...parts: string[]) {
  return parts.join("-").replace(/[^a-zA-Z0-9_-]/g, "-");
}

export async function seedPermissionDefaultsForClient(client: PrismaClient) {
  const permissionIds = new Map<string, string>();

  for (const module of portalModuleDefinitions) {
    await client.portalModule.upsert({
      where: { key: module.key },
      update: {
        name: module.name,
        route: module.route,
        icon: module.icon,
        sortOrder: module.sortOrder,
        isActive: true
      },
      create: {
        id: stableId("portal-module", module.key),
        key: module.key,
        name: module.name,
        route: module.route,
        icon: module.icon,
        sortOrder: module.sortOrder,
        isActive: true
      }
    });
  }

  for (const widget of dashboardWidgetDefinitions) {
    await client.dashboardWidget.upsert({
      where: { key: widget.key },
      update: {
        name: widget.name,
        description: widget.description,
        defaultSize: widget.defaultSize,
        sortOrder: widget.sortOrder,
        isActive: true
      },
      create: {
        id: stableId("dashboard-widget", widget.key),
        key: widget.key,
        name: widget.name,
        description: widget.description,
        defaultSize: widget.defaultSize,
        sortOrder: widget.sortOrder,
        isActive: true
      }
    });
  }

  for (const permission of permissionDefinitions) {
    const id = stableId("perm", permission.resource, permission.action);
    permissionIds.set(`${permission.resource}:${permission.action}`, id);
    await client.permission.upsert({
      where: { resource_action: { resource: permission.resource, action: permission.action } },
      update: {
        description: permission.description,
        sensitive: permission.sensitive ?? false
      },
      create: {
        id,
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
        sensitive: permission.sensitive ?? false
      }
    });
  }

  for (const rolePermission of rolePermissionDefaults) {
    const permissionId = permissionIds.get(`${rolePermission.resource}:${rolePermission.action}`);
    if (!permissionId) continue;
    await client.rolePermission.upsert({
      where: { role_permissionId: { role: rolePermission.role, permissionId } },
      update: { effect: rolePermission.effect },
      create: {
        id: stableId("role-perm", rolePermission.role, permissionId),
        role: rolePermission.role,
        permissionId,
        effect: rolePermission.effect
      }
    });
  }

  for (const visibility of moduleVisibilityDefaults) {
    await client.moduleVisibility.upsert({
      where: { role_moduleKey: { role: visibility.role, moduleKey: visibility.key } },
      update: { effect: visibility.effect, sortOrder: visibility.sortOrder ?? 0 },
      create: {
        id: stableId("module", visibility.role, visibility.key),
        moduleKey: visibility.key,
        role: visibility.role,
        effect: visibility.effect,
        sortOrder: visibility.sortOrder ?? 0
      }
    });
  }

  for (const visibility of dashboardWidgetVisibilityDefaults) {
    await client.dashboardWidgetVisibility.upsert({
      where: { role_widgetKey: { role: visibility.role, widgetKey: visibility.key } },
      update: { effect: visibility.effect, sortOrder: visibility.sortOrder ?? 0, size: visibility.size ?? "medium" },
      create: {
        id: stableId("widget", visibility.role, visibility.key),
        widgetKey: visibility.key,
        role: visibility.role,
        effect: visibility.effect,
        sortOrder: visibility.sortOrder ?? 0,
        size: visibility.size ?? "medium"
      }
    });
  }

  for (const categoryPermission of documentCategoryPermissionDefaults) {
    await client.documentCategoryPermission.upsert({
      where: {
        role_category_action: {
          role: categoryPermission.role,
          category: categoryPermission.category,
          action: categoryPermission.action
        }
      },
      update: { effect: categoryPermission.effect },
      create: {
        id: stableId("doc-cat", categoryPermission.role, categoryPermission.category, categoryPermission.action),
        category: categoryPermission.category,
        action: categoryPermission.action,
        role: categoryPermission.role,
        effect: categoryPermission.effect
      }
    });
  }

  for (const policy of watermarkPolicyDefaults) {
    await client.watermarkPolicy.upsert({
      where: { role_category: { role: policy.role, category: policy.category } },
      update: {
        enabled: policy.enabled,
        includeName: policy.includeName,
        includeRole: policy.includeRole,
        includeTimestamp: policy.includeTimestamp,
        includeIpAddress: policy.includeIpAddress,
        includeDeviceId: policy.includeDeviceId,
        opacity: policy.opacity,
        density: policy.density
      },
      create: {
        id: stableId("watermark", policy.role, policy.category),
        category: policy.category,
        role: policy.role,
        enabled: policy.enabled,
        includeName: policy.includeName,
        includeRole: policy.includeRole,
        includeTimestamp: policy.includeTimestamp,
        includeIpAddress: policy.includeIpAddress,
        includeDeviceId: policy.includeDeviceId,
        opacity: policy.opacity,
        density: policy.density
      }
    });
  }
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seedPermissionDefaultsForClient(prisma)
    .then(async () => {
      await prisma.$disconnect();
      console.log("Seeded permission defaults.");
    })
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
