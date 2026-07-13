import { test, expect } from "@playwright/test";

for (const endpoint of ["/api/meetings/create", "/api/meetings/unknown/agenda", "/api/documents/upload", "/api/admin/portal-configuration/role"]) {
  test(`unauthenticated mutation denied: ${endpoint}`, async ({ request }) => {
    const response = await request.post(endpoint, { data: {} });
    expect([401, 403, 404]).toContain(response.status());
  });
}
