import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.QA_BASE_URL ?? "http://127.0.0.1:3015";

export default defineConfig({
  testDir: "./tests",
  outputDir: "tests/reports/artifacts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "tests/reports/html", open: "never" }],
    ["json", { outputFile: "tests/reports/results.json" }]
  ],
  use: {
    baseURL,
    viewport: { width: 1440, height: 900 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "chromium-tablet", use: { ...devices["iPad (gen 7)"], browserName: "chromium" } },
    { name: "chromium-mobile", use: { ...devices["Pixel 5"], browserName: "chromium" } }
  ]
});
