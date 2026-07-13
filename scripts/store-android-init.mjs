#!/usr/bin/env node
/**
 * Initializes / updates the Android TWA project with Bubblewrap.
 *
 * Prerequisites:
 *   npm i -g @bubblewrap/cli
 *   Java JDK 17+, Android SDK command-line tools
 *
 * Env:
 *   STORE_HOST — production HTTPS host (required), e.g. portal.example.com
 *   TWA_PACKAGE_NAME — optional Android applicationId
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const host = (process.env.STORE_HOST || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
const projectDir = path.join(root, "store", "android-twa");
const manifestPath = path.join(projectDir, "twa-manifest.json");

if (!host) {
  console.error("STORE_HOST is required, e.g. STORE_HOST=portal.bcb.example npm run store:android:init");
  process.exit(1);
}

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { stdio: "inherit", cwd: opts.cwd || root, shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const bubblewrap = spawnSync("bubblewrap", ["--version"], { encoding: "utf8" });
if (bubblewrap.status !== 0) {
  console.error("Bubblewrap CLI not found. Install with: npm i -g @bubblewrap/cli");
  process.exit(1);
}

process.env.STORE_HOST = host;
run(process.execPath, [path.join(root, "scripts", "generate-assetlinks.mjs")]);

if (!fs.existsSync(manifestPath)) {
  console.error(`Missing ${manifestPath}`);
  process.exit(1);
}

const androidAppDir = path.join(projectDir, "app");
if (!fs.existsSync(androidAppDir)) {
  console.log("Initializing Bubblewrap Android project...");
  run("bubblewrap", ["init", "--manifest", `https://${host}/manifest.webmanifest`, "--directory", projectDir], {
    cwd: root
  });
} else {
  console.log("Android project exists — running bubblewrap update...");
  run("bubblewrap", ["update", "--skipVersionUpgrade"], { cwd: projectDir });
}

console.log(`
Next steps:
  1. Deploy the Next.js app to https://${host}
  2. Ensure https://${host}/.well-known/assetlinks.json is public
  3. npm run store:android:build
  4. Upload store/android-twa/app/build/outputs/bundle/release/*.aab to Play Console
`);
