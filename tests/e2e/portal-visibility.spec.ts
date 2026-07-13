import { test, expect } from "../fixtures/test";
import { loginAsDirector } from "../helpers/auth";

test("Director portal hides administration modules", async ({ page }) => {
  await loginAsDirector(page);
  await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Audit Logs" })).toHaveCount(0);
});
test("BLOCKED complete portal override browser flow", async () => { test.skip(true, "Admin override UI requires stable test IDs before production-grade automation."); });
