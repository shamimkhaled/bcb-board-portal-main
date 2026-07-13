import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth, getRequestMeta } from "@/lib/auth";
import { getSecureViewerPages, validateSecureViewSession } from "@/lib/secure-document-viewer";

export async function GET(request: NextRequest, context: { params: Promise<{ traceId: string }> }) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { traceId } = await context.params;
  const validation = await validateSecureViewSession(auth, traceId, getRequestMeta(request));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: validation.status });

  const url = new URL(request.url);
  const start = Number(url.searchParams.get("start") ?? 0);
  const count = Number(url.searchParams.get("count") ?? 2);
  const payload = await getSecureViewerPages(validation.viewSession, start, count);

  return NextResponse.json(payload);
}
