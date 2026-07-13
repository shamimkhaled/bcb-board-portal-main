import { test, expect } from "../fixtures/test";
import { loginAsArchiveUser } from "../helpers/auth";
test("Archive User can open archive module", async ({ page }) => {
  await loginAsArchiveUser(page); await page.goto("/archive");
  await expect(page.getByRole("heading", { name: "Archive", exact: true })).toBeVisible();
});
test("BLOCKED archive mutation lifecycle", async () => { test.skip(true, "Archive import, QC update and final-lock APIs are not implemented."); });
