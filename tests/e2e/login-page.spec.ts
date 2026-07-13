import { test, expect } from "../fixtures/test";
import { loginAsChairman, loginAsDirector, loginAsSecretary } from "../helpers/auth";
import { QA_PASSWORD, qaUsers } from "../fixtures/qa-users";

test("@login-infra login controls receive normal pointer interaction", async ({ page }) => {
  const response = await page.goto("/login", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  const email = page.getByLabel("Email"); const password = page.getByLabel("Password");
  await email.click(); await expect(email).toBeFocused();
  await password.click(); await expect(password).toBeFocused();
  await email.fill(qaUsers.secretary.email); await password.fill(QA_PASSWORD);
  const image = page.getByTestId("login-decorative-image");
  if (await image.isVisible()) expect(await image.evaluate((element) => getComputedStyle(element).pointerEvents)).toBe("none");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByLabel("One-time passcode")).toBeVisible();
});

test("@login-infra Secretary login succeeds", async ({ page }) => loginAsSecretary(page));
test("@login-infra Chairman login succeeds", async ({ page }) => loginAsChairman(page));
test("@login-infra Director login succeeds", async ({ page }) => loginAsDirector(page));
