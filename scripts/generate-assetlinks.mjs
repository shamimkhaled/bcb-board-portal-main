#!/usr/bin/env node
/**
 * Generates Digital Asset Links JSON for Android TWA / Play Store verification.
 *
 * Env:
 *   TWA_PACKAGE_NAME (default: bd.org.bcb.directors.portal.twa)
 *   TWA_SHA256_CERT_FINGERPRINTS — comma-separated SHA-256 fingerprints (no colons preferred)
 *   STORE_HOST — production host used in Bubblewrap (e.g. portal.bcb.example)
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageName = process.env.TWA_PACKAGE_NAME || "bd.org.bcb.directors.portal.twa";
const fingerprints = (process.env.TWA_SHA256_CERT_FINGERPRINTS || "")
  .split(",")
  .map((value) => value.trim().replace(/:/g, "").toUpperCase())
  .filter(Boolean);

const assetLinks = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: packageName,
      sha256_cert_fingerprints: fingerprints.length
        ? fingerprints
        : ["REPLACE_WITH_UPLOAD_KEYSTORE_SHA256"]
    }
  }
];

const outDir = path.join(root, "public", ".well-known");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "assetlinks.json");
fs.writeFileSync(outFile, `${JSON.stringify(assetLinks, null, 2)}\n`, "utf8");

console.log(`Wrote ${outFile}`);
if (!fingerprints.length) {
  console.warn(
    "Warning: TWA_SHA256_CERT_FINGERPRINTS is empty. Replace REPLACE_WITH_UPLOAD_KEYSTORE_SHA256 before Play Store release."
  );
}

// Keep Bubblewrap host/package aligned when STORE_HOST is set
const twaManifestPath = path.join(root, "store", "android-twa", "twa-manifest.json");
if (fs.existsSync(twaManifestPath) && process.env.STORE_HOST) {
  const host = process.env.STORE_HOST.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const manifest = JSON.parse(fs.readFileSync(twaManifestPath, "utf8"));
  manifest.host = host;
  manifest.packageId = packageName;
  manifest.iconUrl = `https://${host}/icons/icon-512x512.png`;
  manifest.maskableIconUrl = `https://${host}/icons/icon-512x512.png`;
  manifest.webManifestUrl = `https://${host}/manifest.webmanifest`;
  manifest.fullScopeUrl = `https://${host}/`;
  for (const shortcut of manifest.shortcuts || []) {
    shortcut.chosenIconUrl = `https://${host}/icons/icon-192x192.png`;
  }
  if (fingerprints.length) {
    manifest.fingerprints = fingerprints.map((sha256Hash) => ({ sha256Hash }));
  }
  fs.writeFileSync(twaManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Updated ${twaManifestPath} for host ${host}`);
}
