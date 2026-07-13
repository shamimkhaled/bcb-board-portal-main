import { expect, type Page } from "@playwright/test";
import { QA_OTP, QA_PASSWORD, qaUsers } from "../fixtures/qa-users";

type QaUserKey = keyof typeof qaUsers;
export async function loginAs(page: Page, key: QaUserKey) {
  const navigation = await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 30_000 });
  expect(navigation?.status(), "AUTHENTICATION_UI: login page response").toBe(200);
  const email = page.getByLabel("Email");
  const password = page.getByLabel("Password");
  const continueButton = page.getByRole("button", { name: "Continue" });
  await expect(email).toBeVisible(); await expect(email).toBeEnabled();
  await expect(password).toBeVisible(); await expect(password).toBeEnabled();
  await expect(continueButton).toBeVisible(); await expect(continueButton).toBeEnabled();
  await email.fill(qaUsers[key].email);
  await password.fill(QA_PASSWORD);
  const loginResponsePromise = page.waitForResponse((response) => response.url().endsWith("/api/auth/login") && response.request().method() === "POST", { timeout: 30_000 });
  await continueButton.click();
  const loginResponse = await loginResponsePromise;
  if (!loginResponse.ok()) throw new Error(`AUTHENTICATION_UI: login API ${loginResponse.status()} ${await loginResponse.text()}`);
  const otp = page.getByLabel("One-time passcode");
  await expect(otp).toBeVisible({ timeout: 15_000 });
  await otp.fill(QA_OTP);
  const verifyButton = page.getByRole("button", { name: "Verify MFA" });
  await expect(verifyButton).toBeEnabled();
  const mfaResponsePromise = page.waitForResponse((response) => response.url().endsWith("/api/auth/mfa") && response.request().method() === "POST", { timeout: 30_000 });
  await verifyButton.click();
  const mfaResponse = await mfaResponsePromise;
  if (!mfaResponse.ok()) throw new Error(`AUTHENTICATION_UI: MFA API ${mfaResponse.status()} ${await mfaResponse.text()}`);
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
}
export const loginAsSystemAdmin = (page: Page) => loginAs(page, "admin");
export const loginAsSecretary = (page: Page) => loginAs(page, "secretary");
export const loginAsChairman = (page: Page) => loginAs(page, "chairman");
export const loginAsDirector = (page: Page) => loginAs(page, "director");
export const loginAsCommitteeMember = (page: Page) => loginAs(page, "committee");
export const loginAsDepartmentUser = (page: Page) => loginAs(page, "department");
export const loginAsArchiveUser = (page: Page) => loginAs(page, "archive");
export const loginAsAuditor = (page: Page) => loginAs(page, "auditor");
export async function loginAsCEO() { throw new Error("BLOCKED: CHIEF_EXECUTIVE_OFFICER role is not implemented."); }

export async function authenticatedHeaders(page: Page) {
  const cookies = await page.context().cookies();
  return { cookie: cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ") };
}
