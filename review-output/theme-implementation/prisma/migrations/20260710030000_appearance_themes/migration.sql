CREATE TABLE "PortalAppearanceSetting" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "systemDefaultTheme" TEXT NOT NULL DEFAULT 'EXECUTIVE_NAVY',
  "allowUserThemeSelection" BOOLEAN NOT NULL DEFAULT true,
  "updatedById" TEXT,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "PortalAppearanceSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "RoleAppearanceSetting" (
  "role" TEXT NOT NULL PRIMARY KEY,
  "defaultTheme" TEXT NOT NULL,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "UserAppearancePreference" (
  "userId" TEXT NOT NULL PRIMARY KEY,
  "selectedTheme" TEXT NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "UserAppearancePreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
