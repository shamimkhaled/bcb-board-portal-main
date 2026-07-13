-- Portal decluttering and personalization controls.
-- Extends the existing visibility foundation without replacing the role enum or permission system.

ALTER TABLE "ModuleVisibility" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "DashboardWidgetVisibility" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "DashboardWidgetVisibility" ADD COLUMN "size" TEXT NOT NULL DEFAULT 'medium';

CREATE TABLE "PortalModule" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "route" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "PortalModule_key_key" ON "PortalModule"("key");

CREATE TABLE "DashboardWidget" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "defaultSize" TEXT NOT NULL DEFAULT 'medium',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "DashboardWidget_key_key" ON "DashboardWidget"("key");

