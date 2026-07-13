-- Add configurable secure document watermark policies for role defaults and user overrides.
CREATE TABLE "WatermarkPolicy" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "category" TEXT NOT NULL,
  "role" TEXT,
  "userId" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "includeName" BOOLEAN NOT NULL DEFAULT true,
  "includeRole" BOOLEAN NOT NULL DEFAULT true,
  "includeTimestamp" BOOLEAN NOT NULL DEFAULT true,
  "includeIpAddress" BOOLEAN NOT NULL DEFAULT true,
  "includeDeviceId" BOOLEAN NOT NULL DEFAULT true,
  "opacity" INTEGER NOT NULL DEFAULT 28,
  "density" INTEGER NOT NULL DEFAULT 18,
  "reason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "WatermarkPolicy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "WatermarkPolicy_role_category_key" ON "WatermarkPolicy"("role", "category");
CREATE UNIQUE INDEX "WatermarkPolicy_userId_category_key" ON "WatermarkPolicy"("userId", "category");
CREATE INDEX "WatermarkPolicy_category_idx" ON "WatermarkPolicy"("category");
