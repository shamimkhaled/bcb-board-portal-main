import { test, expect } from "@playwright/test";
test("unauthenticated document actions are denied", async ({ request }) => {
  const response = await request.post("/api/documents/QA-DOC/read");
  expect([401, 403, 404]).toContain(response.status());
});
