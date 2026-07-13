import { test as base } from "@playwright/test";

export const test = base.extend<{ qaRunId: string }>({
  qaRunId: [process.env.QA_RUN_ID ?? `QA-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}`, { option: true }],
  page: async ({ page }, use, testInfo) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("requestfailed", (request) => networkErrors.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? "failed"}`));
    page.on("response", (response) => { if (response.url().includes("/_next/static/") && response.status() >= 400) networkErrors.push(`STATIC ${response.status()} ${response.url()}`); });
    await use(page);
    if (consoleErrors.length) await testInfo.attach("console-errors", { body: consoleErrors.join("\n"), contentType: "text/plain" });
    if (networkErrors.length) await testInfo.attach("network-errors", { body: networkErrors.join("\n"), contentType: "text/plain" });
    if (networkErrors.some((entry) => entry.includes("/_next/static/"))) throw new Error(`INFRASTRUCTURE: Next.js static asset failure\n${networkErrors.join("\n")}`);
  }
});
export { expect } from "@playwright/test";
