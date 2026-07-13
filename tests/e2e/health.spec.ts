import { test, expect } from "../fixtures/test";
test("@health-infra health, login and static asset remain available", async ({ page }) => {
  for (let index = 0; index < 3; index++) {
    const health = await page.request.get("/api/health");
    expect(health.status()).toBe(200); expect(await health.json()).toMatchObject({ status: "ok", database: "connected" });
  }
  expect((await page.request.get("/login")).status()).toBe(200);
  expect((await page.request.get("/governance-boardroom.png")).status()).toBe(200);
});
