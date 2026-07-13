import { test, expect } from "../fixtures/test";
import { authenticatedHeaders, loginAsAuditor, loginAsDirector, loginAsSecretary } from "../helpers/auth";

test("Director cannot create meetings or edit official agenda", async ({ page, qaRunId }) => {
  await loginAsDirector(page); await page.goto("/meetings");
  await expect(page.getByRole("link", { name: "Create Meeting" })).toHaveCount(0);
  await page.goto(`/meetings/${qaRunId}-meeting-draft/agenda`);
  await expect(page.getByRole("button", { name: "Add Agenda Item" })).toHaveCount(0);
});
test("Secretary can create and submit", async ({ page, qaRunId }) => {
  await loginAsSecretary(page); await page.goto("/meetings");
  await expect(page.getByRole("link", { name: "Create Meeting" }).first()).toBeVisible();
  await page.goto(`/meetings/${qaRunId}-meeting-draft/agenda`);
  await expect(page.getByRole("button", { name: "Submit for Chairman Review" })).toBeVisible();
});
test("Auditor cannot mutate meetings", async ({ page, qaRunId }) => {
  await loginAsAuditor(page);
  const response = await page.request.post(`/api/meetings/${qaRunId}-meeting-draft/agenda`, { headers: await authenticatedHeaders(page), data: { title: "Denied" } });
  expect(response.status()).toBe(403);
});
test("BLOCKED CEO permission matrix", async () => { test.skip(true, "CHIEF_EXECUTIVE_OFFICER role is absent from Prisma."); });
