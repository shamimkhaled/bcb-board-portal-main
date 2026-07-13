import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Apple App Site Association for Universal Links (Capacitor / App Store).
 * Configure IOS_TEAM_ID and IOS_BUNDLE_ID.
 */
export async function GET() {
  const teamId = process.env.IOS_TEAM_ID || "TEAMIDXXXX";
  const bundleId = process.env.IOS_BUNDLE_ID || "bd.org.bcb.directors.portal";

  const payload = {
    applinks: {
      apps: [],
      details: [
        {
          appID: `${teamId}.${bundleId}`,
          paths: ["*", "/"]
        }
      ]
    },
    webcredentials: {
      apps: [`${teamId}.${bundleId}`]
    }
  };

  return new NextResponse(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300"
    }
  });
}
