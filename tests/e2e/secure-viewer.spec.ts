import { test, expect } from "../fixtures/test";
import { loginAsDirector } from "../helpers/auth";
test("guessed document ID does not expose storage path", async ({ page }) => {
  await loginAsDirector(page); await page.goto("/documents/not-a-real-document");
  await expect(page.locator("body")).not.toContainText("storage/uploads");
});
test("BLOCKED rendered-page watermark coverage", async () => { test.skip(true, "QA fixture has no synthetic rendered PDF pages; viewer rendering needs a dedicated safe document adapter."); });
