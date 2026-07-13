import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { assertQaEnvironment } from "../tests/helpers/environment";

const root = process.cwd();
const node = process.execPath;
const bin = (relative: string) => path.resolve(root, relative);
const nextCli = bin("node_modules/next/dist/bin/next");
const prismaCli = bin("node_modules/prisma/build/index.js");
const tsxCli = bin("node_modules/tsx/dist/cli.mjs");
const playwrightCli = bin("node_modules/@playwright/test/cli.js");

function loadTestEnv() {
  for (const row of fs.readFileSync(path.resolve(".env.test"), "utf8").split(/\r?\n/)) {
    const match = row.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  Object.assign(process.env, { NODE_ENV: "test" });
  process.env.QA_RUN_ID ||= `QA-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}`;
}

function run(executable: string, args: string[], env = process.env) {
  const result = spawnSync(executable, args, { cwd: root, stdio: "inherit", env, windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`INFRASTRUCTURE: ${path.basename(executable)} ${args.join(" ")} failed with ${result.status}`);
}

function runAsync(executable: string, args: string[], env = process.env) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(executable, args, { cwd: root, stdio: "inherit", env, windowsHide: true });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`TEST_EXECUTION: ${path.basename(executable)} exited with ${code}`)));
  });
}

async function portIsFree(port: number) {
  return new Promise<boolean>((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}

async function selectPort(requested: number) {
  if (await portIsFree(requested)) return requested;
  throw new Error(`INFRASTRUCTURE: configured QA port ${requested} is already occupied; refusing to start a competing server.`);
}

async function verifyReady(baseUrl: string, server: ChildProcess) {
  let consecutive = 0;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.exitCode !== null) throw new Error(`INFRASTRUCTURE: QA server exited before readiness with ${server.exitCode}.`);
    try {
      const health = await fetch(`${baseUrl}/api/health`);
      const payload = health.ok ? await health.json() as { status?: string; database?: string } : null;
      if (health.status === 200 && payload?.status === "ok" && payload.database === "connected") consecutive++; else consecutive = 0;
      if (consecutive >= 3) {
        const login = await fetch(`${baseUrl}/login`);
        if (login.status !== 200) throw new Error(`login returned ${login.status}`);
        const html = await login.text();
        const assetPath = html.match(/["'](\/_next\/static\/[^"']+\.(?:css|js))["']/)?.[1];
        if (!assetPath) throw new Error("login page contained no Next.js static asset");
        const asset = await fetch(`${baseUrl}${assetPath}`);
        if (asset.status !== 200) throw new Error(`${assetPath} returned ${asset.status}`);
        const image = await fetch(`${baseUrl}/governance-boardroom.png`);
        if (image.status !== 200) throw new Error(`decorative image returned ${image.status}`);
        return;
      }
    } catch { consecutive = 0; }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("INFRASTRUCTURE: health/login/static readiness did not reach three consecutive successes.");
}

async function stopServer(server: ChildProcess) {
  if (server.exitCode !== null) return;
  server.kill("SIGTERM");
  await Promise.race([
    new Promise<void>((resolve) => server.once("exit", () => resolve())),
    new Promise<void>((resolve) => setTimeout(resolve, 5000))
  ]);
  if (server.exitCode === null) server.kill("SIGKILL");
}

async function main() {
  loadTestEnv();
  assertQaEnvironment();
  const suite = process.argv[2] ?? "full";
  if (suite === "report") { run(node, [tsxCli, "scripts/qa-report.ts"]); return; }
  process.env.INIT_DB_PATH = "prisma/qa-test.db";
  run(node, ["scripts/init-sqlite-db.mjs"]);
  run(node, [prismaCli, "generate"]);
  run(node, [tsxCli, "tests/fixtures/seed-qa.ts"]);
  if (suite === "setup") return;

  fs.mkdirSync("tests/reports", { recursive: true });
  const requestedPort = Number(new URL(process.env.QA_BASE_URL!).port || "3015");
  const port = await selectPort(requestedPort);
  process.env.QA_BASE_URL = `http://127.0.0.1:${port}`;
  const productionEnv: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: "production", QA_MODE: "true", PORT: String(port) };
  run(node, [nextCli, "build"], productionEnv);

  const log = fs.createWriteStream("tests/reports/server.log", { flags: "w" });
  const server: ChildProcess = spawn(node, [nextCli, "start", "-p", String(port)], { cwd: root, env: productionEnv, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout?.pipe(log); server.stderr?.pipe(log);
  let intentionalStop = false;
  const serverExited = new Promise<never>((_, reject) => server.once("exit", (code) => {
    if (intentionalStop) return;
    reject(new Error(`INFRASTRUCTURE: QA server exited during suite with ${code}. See tests/reports/server.log.`));
  }));
  try {
    await verifyReady(process.env.QA_BASE_URL, server);
    const match: Record<string, string[]> = {
      login: ["--grep", "@login-infra"], health: ["--grep", "@health-infra"], smoke: ["--grep", "@smoke"],
      meetings: ["tests/e2e/meeting-lifecycle.spec.ts", "tests/e2e/meeting-status-filters.spec.ts"],
      documents: ["tests/e2e/secure-viewer.spec.ts", "tests/integration/document-access.test.ts"],
      permissions: ["tests/e2e/role-permissions.spec.ts", "tests/integration/permission-resolution.test.ts"], full: [], "release-gate": []
    };
    await Promise.race([runAsync(node, [playwrightCli, "test", "--project=chromium-desktop", ...(match[suite] ?? [])]), serverExited]);
    const finalHealth = await fetch(`${process.env.QA_BASE_URL}/api/health`);
    if (!finalHealth.ok) throw new Error(`INFRASTRUCTURE: health failed after suite with ${finalHealth.status}.`);
    if (suite === "release-gate") {
      const defects = fs.readFileSync("docs/QA_DEFECT_LOG.md", "utf8");
      if (defects.split(/\r?\n/).some((line) => /^\| (CRITICAL|HIGH) \|/.test(line))) throw new Error("Release gate failed: critical/high defects or blocked coverage remain.");
    }
  } finally {
    intentionalStop = true; await stopServer(server); log.end();
    try { run(node, [tsxCli, "scripts/qa-report.ts"]); } catch {}
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
