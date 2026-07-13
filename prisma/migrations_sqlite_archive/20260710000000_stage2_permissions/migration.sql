-- Stage 2: role-based and user-level authorization foundation.

CREATE TABLE "Permission" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "resource" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "sensitive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "Permission_resource_action_key" ON "Permission"("resource", "action");
CREATE INDEX "Permission_resource_idx" ON "Permission"("resource");

CREATE TABLE "RolePermission" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "role" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "effect" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "RolePermission_role_permissionId_key" ON "RolePermission"("role", "permissionId");
CREATE INDEX "RolePermission_role_idx" ON "RolePermission"("role");

CREATE TABLE "UserPermissionOverride" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "effect" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserPermissionOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserPermissionOverride_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "UserPermissionOverride_userId_permissionId_key" ON "UserPermissionOverride"("userId", "permissionId");
CREATE INDEX "UserPermissionOverride_userId_idx" ON "UserPermissionOverride"("userId");

CREATE TABLE "ModuleVisibility" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "moduleKey" TEXT NOT NULL,
  "role" TEXT,
  "userId" TEXT,
  "effect" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ModuleVisibility_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ModuleVisibility_role_moduleKey_key" ON "ModuleVisibility"("role", "moduleKey");
CREATE UNIQUE INDEX "ModuleVisibility_userId_moduleKey_key" ON "ModuleVisibility"("userId", "moduleKey");
CREATE INDEX "ModuleVisibility_moduleKey_idx" ON "ModuleVisibility"("moduleKey");

CREATE TABLE "DashboardWidgetVisibility" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "widgetKey" TEXT NOT NULL,
  "role" TEXT,
  "userId" TEXT,
  "effect" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DashboardWidgetVisibility_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "DashboardWidgetVisibility_role_widgetKey_key" ON "DashboardWidgetVisibility"("role", "widgetKey");
CREATE UNIQUE INDEX "DashboardWidgetVisibility_userId_widgetKey_key" ON "DashboardWidgetVisibility"("userId", "widgetKey");
CREATE INDEX "DashboardWidgetVisibility_widgetKey_idx" ON "DashboardWidgetVisibility"("widgetKey");

CREATE TABLE "DocumentCategoryPermission" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "category" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "role" TEXT,
  "userId" TEXT,
  "effect" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentCategoryPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "DocumentCategoryPermission_role_category_action_key" ON "DocumentCategoryPermission"("role", "category", "action");
CREATE UNIQUE INDEX "DocumentCategoryPermission_userId_category_action_key" ON "DocumentCategoryPermission"("userId", "category", "action");
CREATE INDEX "DocumentCategoryPermission_category_action_idx" ON "DocumentCategoryPermission"("category", "action");
