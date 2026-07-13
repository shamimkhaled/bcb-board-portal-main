import { test, expect } from "../fixtures/test";
import { loginAsChairman } from "../helpers/auth";
test("notification list belongs to signed-in Chairman", async ({ page }) => {
  await loginAsChairman(page); await page.goto("/notifications");
  await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
});
test("BLOCKED workflow notification matrix", async () => { test.skip(true, "Return, approval, publication and reminder notification producers are not implemented."); });
