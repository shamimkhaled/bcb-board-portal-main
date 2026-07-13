import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Digital Asset Links for Android TWA / Play Store.
 * Configure via TWA_PACKAGE_NAME and TWA_SHA256_CERT_FINGERPRINTS.
 */
export async function GET() {
  const packageName = process.env.TWA_PACKAGE_NAME || "bd.org.bcb.directors.portal.twa";
  const fingerprints = (process.env.TWA_SHA256_CERT_FINGERPRINTS || "")
    .split(",")
    .map((value) => value.trim().replace(/:/g, "").toUpperCase())
    .filter(Boolean);

  const payload = [
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

  return NextResponse.json(payload, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300"
    }
  });
}
