import { test, expect } from "../fixtures/test";
import { authenticatedHeaders, loginAsDirector, loginAsSecretary } from "../helpers/auth";

test("@smoke Secretary can open agenda form and validation is enforced", async ({ page, qaRunId }) => {
  await loginAsSecretary(page); await page.goto(`/meetings/${qaRunId}-meeting-draft/agenda`);
  await page.getByRole("button", { name: "Add Agenda Item" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Save Agenda Item" }).click();
  await expect(page.getByLabel("Title")).toHaveAttribute("required", "");
});

test("Director agenda is read-only and mutation API is forbidden", async ({ page, qaRunId }) => {
  await loginAsDirector(page); await page.goto(`/meetings/${qaRunId}-meeting-draft/agenda`);
  await expect(page.getByRole("button", { name: "Add Agenda Item" })).toHaveCount(0);
  const response = await page.request.post(`/api/meetings/${qaRunId}-meeting-draft/agenda`, { headers: await authenticatedHeaders(page), data: { title: "Denied" } });
  expect(response.status()).toBe(403);
});

test("BLOCKED complete agenda lifecycle", async () => {
  test.skip(true, "Chairman return/approve and publication APIs are not implemented.");
});
