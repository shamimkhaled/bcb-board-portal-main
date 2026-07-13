import fs from "node:fs";
import path from "node:path";

const reportPath = path.resolve("tests/reports/results.json");
const outputPath = path.resolve("docs/QA_EXECUTION_REPORT.md");
let passed = 0, failed = 0, skipped = 0;
const classifications: Record<string, number> = { INFRASTRUCTURE: 0, AUTHENTICATION_UI: 0, TEST_DATA: 0, PRODUCT_WORKFLOW: 0, AUTHORIZATION: 0, TEST_IMPLEMENTATION: 0 };
if (fs.existsSync(reportPath)) {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const walk = (suite: any) => {
    for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) {
      const status = test.results?.at(-1)?.status;
      if (status === "passed") passed++;
      else if (status === "skipped") { skipped++; classifications.PRODUCT_WORKFLOW++; }
      else {
        failed++;
        const detail = `${spec.title ?? ""} ${test.results?.at(-1)?.error?.message ?? ""}`;
        const category = /INFRASTRUCTURE|static asset|health|server exited/i.test(detail) ? "INFRASTRUCTURE"
          : /AUTHENTICATION_UI|login-page|login succeeds/i.test(detail) ? "AUTHENTICATION_UI"
          : /fixture|seed|TEST_DATA/i.test(detail) ? "TEST_DATA"
          : /403|forbidden|permission|AUTHORIZATION/i.test(detail) ? "AUTHORIZATION"
          : /strict mode|locator|TEST_IMPLEMENTATION/i.test(detail) ? "TEST_IMPLEMENTATION" : "PRODUCT_WORKFLOW";
        classifications[category]++;
      }
    }
    for (const child of suite.suites ?? []) walk(child);
  };
  for (const suite of report.suites ?? []) walk(suite);
}
const defectLog = fs.existsSync("docs/QA_DEFECT_LOG.md") ? fs.readFileSync("docs/QA_DEFECT_LOG.md", "utf8") : "";
const knownReleaseBlockers = defectLog.split(/\r?\n/).filter((line) => /^\| (CRITICAL|HIGH) \|/.test(line)).length;
const blocked = Math.max(skipped, knownReleaseBlockers);
const recommendation = failed || blocked ? "NOT READY — failures or explicitly blocked critical/high coverage remain." : "READY FOR QA SIGN-OFF";
const classLines = Object.entries(classifications).map(([name, count]) => `- ${name}: ${count}`).join("\n");
const text = `# QA Execution Report\n\n- Test run ID: ${process.env.QA_RUN_ID ?? "not set"}\n- Generated: ${new Date().toISOString()}\n- Environment: isolated test\n- Database: ${process.env.DATABASE_URL ?? "not set"}\n- Passed: ${passed}\n- Failed: ${failed}\n- Skipped: ${skipped}\n- Blocked: ${blocked}\n- Artifacts: tests/reports/artifacts, tests/reports/html\n- Release recommendation: **${recommendation}**\n\n## Failure classification\n\n${classLines}\n\nA shared infrastructure or authentication failure is counted once by its originating test; dependent workflows should be reported as blocked rather than independent product defects.\n\nSee [QA Defect Log](./QA_DEFECT_LOG.md).\n`;
fs.writeFileSync(outputPath, text);
console.log(text);
if (failed) process.exitCode = 1;
