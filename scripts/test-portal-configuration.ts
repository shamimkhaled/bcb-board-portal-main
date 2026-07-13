import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { seedPermissionDefaultsForClient } from "./seed-permissions";
import {
  canViewModule,
  getVisibleModules,
  getVisibleWidgets,
  hasPermission
} from "../lib/permissions";
import {
  resetRolePortalConfiguration,
  resetUserPortalOverrides,
  updateRolePortalConfiguration,
  updateUserPortalOverride
} from "../lib/portal-configuration";

const prisma = new PrismaClient();

async function main() {
  await seedPermissionDefaultsForClient(prisma);

  const director = await prisma.user.findUniqueOrThrow({ where: { id: "user-director-1" } });
  const department = await prisma.user.findUniqueOrThrow({ where: { id: "user-department" } });

  const directorModules = await getVisibleModules(director);
  assert.deepEqual(
    directorModules.map((module) => module.key),
    ["dashboard", "board-packs", "meetings", "minutes", "resolutions", "documents", "notifications", "search", "profile"]
  );
  assert.equal(directorModules.some((module) => module.key === "reports"), false);

  const directorWidgets = await getVisibleWidgets(director);
  assert.deepEqual(
    directorWidgets.map((widget) => widget.key),
    [
      "current-board-pack",
      "upcoming-meetings",
      "pending-acknowledgments",
      "recent-minutes-resolutions",
      "committee-documents",
      "notifications"
    ]
  );
  assert.equal(directorWidgets.length, 6);

  await prisma.$transaction((client) =>
    updateRolePortalConfiguration(client, {
      role: "DIRECTOR",
      modules: {
        dashboard: { isVisible: true, sortOrder: 10 },
        reports: { isVisible: true, sortOrder: 11 }
      },
      widgets: {
        notifications: { isVisible: true, sortOrder: 1, size: "small" },
        "current-board-pack": { isVisible: true, sortOrder: 2, size: "large" }
      }
    })
  );
  const reorderedWidgets = await getVisibleWidgets(director);
  assert.equal(reorderedWidgets[0].key, "notifications");
  assert.equal(reorderedWidgets[0].size, "small");
  assert.equal(await canViewModule(director, "reports"), true);

  await prisma.$transaction((client) =>
    updateUserPortalOverride(client, {
      userEmail: department.email,
      modules: {
        dashboard: { isVisible: null, sortOrder: null },
        reports: { isVisible: true, sortOrder: 12 }
      },
      widgets: {
        notifications: { isVisible: false, sortOrder: 15, size: "medium" }
      }
    })
  );
  assert.equal(await canViewModule(department, "reports"), true);
  assert.equal((await getVisibleWidgets(department)).some((widget) => widget.key === "notifications"), false);

  await prisma.$transaction((client) => resetUserPortalOverrides(client, department.email));
  assert.equal(await canViewModule(department, "reports"), false);

  await prisma.$transaction((client) => resetRolePortalConfiguration(client, "DIRECTOR"));
  assert.equal(await canViewModule(director, "reports"), false);
  assert.equal(await hasPermission(director, "admin", "manage"), false);
  assert.equal(await hasPermission(director, "reports", "view"), true);

  console.log("Portal configuration tests passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    void prisma.$disconnect();
  });
