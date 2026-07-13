import { test, expect } from "../fixtures/test";
import { loginAsChairman, loginAsSecretary } from "../helpers/auth";
import { PrismaClient, type MeetingStatus } from "@prisma/client";

async function assertSeededStatus(qaRunId: string, status: MeetingStatus) {
  const prisma = new PrismaClient();
  try {
    const row = await prisma.meeting.findUnique({ where: { id: `${qaRunId}-meeting-${status.toLowerCase()}` }, select: { status: true, title: true } });
    expect(row, `TEST_DATA: missing ${status} fixture`).not.toBeNull();
    expect(row?.status).toBe(status);
    expect(row?.title).toBe(`${qaRunId} ${status} meeting`);
  } finally { await prisma.$disconnect(); }
}

test("submitted meeting regression: all, pending, not draft", async ({ page, qaRunId }) => {
  await assertSeededStatus(qaRunId, "PENDING_CHAIRMAN_REVIEW");
  await loginAsSecretary(page);
  const title = `${qaRunId} PENDING_CHAIRMAN_REVIEW meeting`;
  await page.goto("/meetings");
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  await page.goto("/meetings?status=pending-approval");
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  await page.goto("/meetings?status=draft");
  await expect(page.getByText(title, { exact: true })).toHaveCount(0);
});

test("Chairman sees submitted meeting awaiting approval", async ({ page, qaRunId }) => {
  await assertSeededStatus(qaRunId, "PENDING_CHAIRMAN_REVIEW");
  await loginAsChairman(page);
  await page.goto("/meetings?status=pending-approval");
  await expect(page.getByText(`${qaRunId} PENDING_CHAIRMAN_REVIEW meeting`, { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Meetings Awaiting Approval" })).toBeVisible();
});

for (const [status, filter] of [["DRAFT", "draft"], ["PUBLISHED", "published"], ["COMPLETED", "completed"]] as const) {
  test(`${status} appears in ${filter}`, async ({ page, qaRunId }) => {
    await assertSeededStatus(qaRunId, status);
    await loginAsSecretary(page); await page.goto(`/meetings?status=${filter}`);
    await expect(page.getByText(`${qaRunId} ${status} meeting`, { exact: true })).toBeVisible();
  });
}

test("BLOCKED status tabs: returned, approved and archived", async () => {
  test.skip(true, "Application has no Returned, Approved, or Archived meeting tabs yet.");
});
