import assert from "node:assert/strict";
import { AppearanceTheme } from "@prisma/client";
import { readFile } from "node:fs/promises";
import { auditRoleAppearanceChanges } from "../lib/appearance-audit";
import {
  SYSTEM_APPEARANCE_ID,
  getEffectiveTheme,
  seedAppearanceDefaults,
  themeCssValues,
  updateRoleThemeDefault,
  updateUserThemePreference
} from "../lib/theme";
import { prisma } from "../lib/prisma";

async function main() {
  await seedAppearanceDefaults();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: "user-director-1" } });
  const admin = await prisma.user.findUniqueOrThrow({ where: { id: "user-admin" } });
  const session = await prisma.session.upsert({
    where: { sessionToken: "test-appearance-admin-session" },
    update: {
      userId: admin.id,
      deviceId: "TEST-APPEARANCE-DEVICE",
      ipAddress: "203.0.113.44",
      browser: "Appearance test",
      mfaVerified: true,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      lastSeenAt: new Date()
    },
    create: {
      id: "test-appearance-admin-session",
      sessionToken: "test-appearance-admin-session",
      userId: admin.id,
      deviceId: "TEST-APPEARANCE-DEVICE",
      ipAddress: "203.0.113.44",
      browser: "Appearance test",
      mfaVerified: true,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    }
  });
  const auth = { user: admin, session, device: null };

  await prisma.portalAppearanceSetting.update({
    where: { id: SYSTEM_APPEARANCE_ID },
    data: { allowUserThemeSelection: true, systemDefaultTheme: AppearanceTheme.EXECUTIVE_NAVY }
  });
  await prisma.userAppearancePreference.deleteMany({ where: { userId: user.id } });
  await updateRoleThemeDefault(user.role, AppearanceTheme.BCB_EMERALD);

  let effective = await getEffectiveTheme(user.id);
  assert.equal(effective.theme, "BCB_EMERALD");
  assert.equal(effective.source, "role");

  await prisma.roleAppearanceSetting.delete({ where: { role: user.role } });
  effective = await getEffectiveTheme(user.id);
  assert.equal(effective.theme, "BCB_EMERALD");
  assert.equal(effective.source, "role-default");
  await updateRoleThemeDefault(user.role, AppearanceTheme.BCB_EMERALD);

  await updateUserThemePreference(user.id, AppearanceTheme.HERITAGE_BURGUNDY);
  effective = await getEffectiveTheme(user.id);
  assert.equal(effective.theme, "HERITAGE_BURGUNDY");
  assert.equal(effective.source, "user");

  effective = await getEffectiveTheme(null);
  assert.equal(effective.theme, "EXECUTIVE_NAVY");
  assert.equal(effective.source, "system");

  await prisma.portalAppearanceSetting.update({
    where: { id: SYSTEM_APPEARANCE_ID },
    data: { allowUserThemeSelection: false, systemDefaultTheme: AppearanceTheme.EXECUTIVE_NAVY }
  });
  effective = await getEffectiveTheme(user.id);
  assert.equal(effective.theme, "BCB_EMERALD");
  assert.equal(effective.source, "role");

  await assert.rejects(
    () => updateUserThemePreference(user.id, AppearanceTheme.EXECUTIVE_NAVY),
    /disabled/
  );

  const auditBefore = await prisma.auditLog.count();
  await auditRoleAppearanceChanges({
    auth,
    previousRoleMap: new Map(),
    roleDefaults: { AUDITOR: AppearanceTheme.EXECUTIVE_NAVY },
    meta: { ipAddress: "203.0.113.44", browser: "Appearance test" }
  });
  await auditRoleAppearanceChanges({
    auth,
    previousRoleMap: new Map([["AUDITOR", AppearanceTheme.EXECUTIVE_NAVY]]),
    roleDefaults: { AUDITOR: AppearanceTheme.HERITAGE_BURGUNDY },
    meta: { ipAddress: "203.0.113.44", browser: "Appearance test" }
  });
  const auditEvents = await prisma.auditLog.findMany({
    where: {
      sequence: { gt: auditBefore },
      actionType: { in: ["PORTAL_THEME_ROLE_DEFAULT_CREATED", "PORTAL_THEME_ROLE_DEFAULT_CHANGED"] }
    }
  });
  assert.ok(auditEvents.some((event) => event.actionType === "PORTAL_THEME_ROLE_DEFAULT_CREATED" && event.previousValue === null));
  assert.ok(auditEvents.some((event) => event.actionType === "PORTAL_THEME_ROLE_DEFAULT_CHANGED" && event.previousValue === "EXECUTIVE_NAVY"));

  for (const values of Object.values(themeCssValues)) {
    for (const value of Object.values(values)) {
      assert.match(value, /^(#([0-9A-Fa-f]{6})|rgba?\(.+\))$/);
    }
  }
  const tailwindConfig = await readFile("tailwind.config.ts", "utf8");
  assert.equal(tailwindConfig.includes('hsl(var(--accent))'), false);
  assert.equal(tailwindConfig.includes('hsl(var(--accent-foreground))'), false);

  await prisma.portalAppearanceSetting.update({
    where: { id: SYSTEM_APPEARANCE_ID },
    data: { allowUserThemeSelection: true, systemDefaultTheme: AppearanceTheme.EXECUTIVE_NAVY }
  });
  await prisma.userAppearancePreference.deleteMany({ where: { userId: user.id } });

  console.log("Appearance tests passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
