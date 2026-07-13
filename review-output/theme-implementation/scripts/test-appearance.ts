import assert from "node:assert/strict";
import { AppearanceTheme } from "@prisma/client";
import {
  SYSTEM_APPEARANCE_ID,
  getEffectiveTheme,
  seedAppearanceDefaults,
  updateRoleThemeDefault,
  updateUserThemePreference
} from "../lib/theme";
import { prisma } from "../lib/prisma";

async function main() {
  await seedAppearanceDefaults();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: "user-director-1" } });

  await prisma.userAppearancePreference.deleteMany({ where: { userId: user.id } });
  await updateRoleThemeDefault(user.role, AppearanceTheme.BCB_EMERALD);

  let effective = await getEffectiveTheme(user.id);
  assert.equal(effective.theme, "BCB_EMERALD");
  assert.equal(effective.source, "role");

  await updateUserThemePreference(user.id, AppearanceTheme.HERITAGE_BURGUNDY);
  effective = await getEffectiveTheme(user.id);
  assert.equal(effective.theme, "HERITAGE_BURGUNDY");
  assert.equal(effective.source, "user");

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
