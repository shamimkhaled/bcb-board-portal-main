import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "../fixtures/test";
import { loginAsSecretary } from "../helpers/auth";

test("dashboard has no critical accessibility violations", async ({ page }, testInfo) => {
  await loginAsSecretary(page);
  const results = await new AxeBuilder({ page }).analyze();
  await testInfo.attach("axe-results", { body: JSON.stringify(results.violations, null, 2), contentType: "application/json" });
  expect(results.violations.filter((item) => item.impact === "critical")).toEqual([]);
});
test("BLOCKED all-theme visual matrix", async () => { test.skip(true, "Theme matrix requires isolated per-user preference fixtures and approved visual baselines."); });
