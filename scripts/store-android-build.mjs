#!/usr/bin/env node
/**
 * Builds the Android App Bundle (AAB) for Play Store via Bubblewrap.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const projectDir = path.join(root, "store", "android-twa");

if (!fs.existsSync(path.join(projectDir, "twa-manifest.json"))) {
  console.error("Missing store/android-twa/twa-manifest.json — run npm run store:android:init first");
  process.exit(1);
}

const bubblewrap = spawnSync("bubblewrap", ["--version"], { encoding: "utf8" });
if (bubblewrap.status !== 0) {
  console.error("Bubblewrap CLI not found. Install with: npm i -g @bubblewrap/cli");
  process.exit(1);
}

const hasApp = fs.existsSync(path.join(projectDir, "app"));
if (!hasApp) {
  console.error("Android project not initialized. Run: STORE_HOST=your.host npm run store:android:init");
  process.exit(1);
}

const result = spawnSync("bubblewrap", ["build"], { stdio: "inherit", cwd: projectDir });
process.exit(result.status ?? 1);
