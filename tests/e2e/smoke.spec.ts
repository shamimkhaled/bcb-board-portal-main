import { test, expect } from "../fixtures/test";
import { loginAsSecretary, loginAsSystemAdmin } from "../helpers/auth";

test("@smoke login, dashboard, meetings and agenda builder", async ({ page, qaRunId }) => {
  await loginAsSecretary(page);
  await expect(page.getByRole("heading", { name: "Board Secretary dashboard" })).toBeVisible();
  await page.goto("/meetings");
  await expect(page.getByRole("heading", { name: "Meetings" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create Meeting" }).first()).toBeVisible();
  await page.goto(`/meetings/${qaRunId}-meeting-draft/agenda`);
  await expect(page.getByRole("button", { name: "Add Agenda Item" }).first()).toBeVisible();
});

test("@smoke health and authorised audit page", async ({ page }) => {
  const health = await page.request.get("/api/health");
  expect(health.ok()).toBeTruthy();
  expect(await health.json()).toMatchObject({ status: "ok", database: "connected" });
  await loginAsSystemAdmin(page);
  await page.goto("/audit-logs");
  await expect(page.getByRole("heading", { name: /Audit/i })).toBeVisible();
});
