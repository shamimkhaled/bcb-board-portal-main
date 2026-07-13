#!/usr/bin/env node
/**
 * Syncs the Capacitor native shell with the configured HTTPS portal origin.
 *
 * Env:
 *   CAPACITOR_SERVER_URL or STORE_ORIGIN — production HTTPS URL (required for store builds)
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const serverUrl = (process.env.CAPACITOR_SERVER_URL || process.env.STORE_ORIGIN || "").replace(/\/$/, "");

if (!serverUrl) {
  console.error(
    "Set CAPACITOR_SERVER_URL (or STORE_ORIGIN) to your HTTPS portal, e.g.\n  CAPACITOR_SERVER_URL=https://portal.bcb.example npm run store:cap:sync"
  );
  process.exit(1);
}

if (!serverUrl.startsWith("https://")) {
  console.error("CAPACITOR_SERVER_URL must use https:// for store builds");
  process.exit(1);
}

process.env.CAPACITOR_SERVER_URL = serverUrl;

const www = path.join(root, "store", "shell", "www", "index.html");
if (!fs.existsSync(www)) {
  console.error(`Missing shell webDir at ${www}`);
  process.exit(1);
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    cwd: root,
    env: process.env,
    shell: process.platform === "win32"
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const npx = process.platform === "win32" ? "npx.cmd" : "npx";

if (!fs.existsSync(path.join(root, "android"))) {
  console.log("Adding Capacitor Android platform...");
  run(npx, ["cap", "add", "android"]);
}

if (process.platform === "darwin" && !fs.existsSync(path.join(root, "ios"))) {
  console.log("Adding Capacitor iOS platform...");
  run(npx, ["cap", "add", "ios"]);
} else if (!fs.existsSync(path.join(root, "ios"))) {
  console.warn("Skipping `cap add ios` — iOS platform requires macOS / Xcode.");
}

console.log(`Syncing Capacitor shell → ${serverUrl}`);
run(npx, ["cap", "sync"]);

console.log(`
Capacitor shell synced.

Android:
  npm run store:cap:open:android
  # Build signed AAB/APK in Android Studio → Play Console

iOS (macOS only):
  npm run store:cap:open:ios
  # Archive & upload from Xcode → App Store Connect

Ensure https://YOUR_HOST/.well-known/apple-app-site-association is live
with IOS_TEAM_ID and IOS_BUNDLE_ID configured on the server.
`);
