import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import {
  canAccessDocumentCategory,
  canViewModule,
  hasPermission,
  resolveEffect,
  visibleDashboardWidgets
} from "../lib/permissions";

const prisma = new PrismaClient();

async function main() {
  assert.deepEqual(resolveEffect([{ effect: "ALLOW" }]), {
    allowed: true,
    reason: "explicit-allow"
  });
  assert.deepEqual(resolveEffect([{ effect: "ALLOW" }, { effect: "DENY" }]), {
    allowed: false,
    reason: "explicit-deny"
  });
  assert.deepEqual(resolveEffect([]), {
    allowed: false,
    reason: "no-match"
  });

  const admin = await prisma.user.findUniqueOrThrow({ where: { id: "user-admin" } });
  const director = await prisma.user.findUniqueOrThrow({ where: { id: "user-director-1" } });
  const secretary = await prisma.user.findUniqueOrThrow({ where: { id: "user-secretary" } });
  const chairman = await prisma.user.findUniqueOrThrow({ where: { id: "user-chairman" } });
  const department = await prisma.user.findUniqueOrThrow({ where: { id: "user-department" } });
  const auditor = await prisma.user.findUniqueOrThrow({ where: { id: "user-auditor" } });

  assert.equal(await hasPermission(admin, "devices", "manage"), true);
  assert.equal(await hasPermission(admin, "meeting", "create"), true);
  assert.equal(await hasPermission(secretary, "meeting", "create"), true);
  assert.equal(await hasPermission(chairman, "meeting", "create"), false);
  assert.equal(await hasPermission(director, "meeting", "create"), false);
  assert.equal(await hasPermission(department, "meeting", "create"), false);
  assert.equal(await hasPermission(department, "admin", "view"), false);
  assert.equal(await hasPermission(auditor, "auditLogs", "view"), true);
  assert.equal(await canViewModule(department, "admin"), false);
  assert.equal(await canViewModule(auditor, "audit-logs"), true);
  assert.equal(await canAccessDocumentCategory(director, "Legal Document", "viewContent"), false);
  assert.equal(await canAccessDocumentCategory(department, "Memo", "upload"), true);

  const widgets = await visibleDashboardWidgets(auditor, ["audit-warnings", "pending-approvals"]);
  assert.equal(widgets.has("audit-warnings"), true);
  assert.equal(widgets.has("pending-approvals"), false);

  const mainWidgetKeys = [
    "current-board-pack",
    "meetings",
    "pending-approvals",
    "audit-warnings",
    "personal-action-items",
    "quick-actions"
  ];
  const adminWidgets = await visibleDashboardWidgets(admin, mainWidgetKeys);
  const secretaryWidgets = await visibleDashboardWidgets(secretary, mainWidgetKeys);
  const chairmanWidgets = await visibleDashboardWidgets(chairman, mainWidgetKeys);
  const directorWidgets = await visibleDashboardWidgets(director, mainWidgetKeys);
  const departmentWidgets = await visibleDashboardWidgets(department, mainWidgetKeys);
  assert.equal(adminWidgets.has("audit-warnings"), true);
  assert.equal(adminWidgets.has("quick-actions"), false);
  assert.equal(secretaryWidgets.has("pending-approvals"), true);
  assert.equal(chairmanWidgets.has("pending-approvals"), true);
  assert.equal(directorWidgets.has("current-board-pack"), true);
  assert.equal(directorWidgets.has("personal-action-items"), false);
  assert.equal(directorWidgets.has("audit-warnings"), false);
  assert.equal(departmentWidgets.has("meetings"), false);
  assert.equal(departmentWidgets.has("quick-actions"), true);

  const documentContentPermission = await prisma.permission.findUniqueOrThrow({
    where: { resource_action: { resource: "documents", action: "viewContent" } }
  });
  await prisma.userPermissionOverride.upsert({
    where: {
      userId_permissionId: {
        userId: admin.id,
        permissionId: documentContentPermission.id
      }
    },
    update: {
      effect: "DENY",
      reason: "Temporary test deny"
    },
    create: {
      id: "test-deny-admin-doc-content",
      userId: admin.id,
      permissionId: documentContentPermission.id,
      effect: "DENY",
      reason: "Temporary test deny"
    }
  });
  assert.equal(await hasPermission(admin, "documents", "viewContent"), false);
  await prisma.userPermissionOverride.delete({
    where: {
      userId_permissionId: {
        userId: admin.id,
        permissionId: documentContentPermission.id
      }
    }
  });
  assert.equal(await hasPermission(admin, "documents", "viewContent"), true);

  const adminViewPermission = await prisma.permission.findUniqueOrThrow({
    where: { resource_action: { resource: "admin", action: "view" } }
  });
  await prisma.userPermissionOverride.upsert({
    where: {
      userId_permissionId: {
        userId: director.id,
        permissionId: adminViewPermission.id
      }
    },
    update: {
      effect: "ALLOW",
      reason: "Temporary test allow"
    },
    create: {
      id: "test-allow-director-admin-view",
      userId: director.id,
      permissionId: adminViewPermission.id,
      effect: "ALLOW",
      reason: "Temporary test allow"
    }
  });
  assert.equal(await hasPermission(director, "admin", "view"), true);
  await prisma.userPermissionOverride.delete({
    where: {
      userId_permissionId: {
        userId: director.id,
        permissionId: adminViewPermission.id
      }
    }
  });
  assert.equal(await hasPermission(director, "admin", "view"), false);

  console.log("Permission resolution tests passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
