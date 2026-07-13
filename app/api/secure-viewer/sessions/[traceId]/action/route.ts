import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth, getRequestMeta } from "@/lib/auth";
import { recordViewerAction, validateSecureViewSession, type ViewerAction } from "@/lib/secure-document-viewer";

type ViewerMutationAction = Exclude<ViewerAction, "view">;

const allowedActions = new Set<ViewerMutationAction>(["annotate", "download", "print", "share"]);

export async function POST(request: NextRequest, context: { params: Promise<{ traceId: string }> }) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { traceId } = await context.params;
  const validation = await validateSecureViewSession(auth, traceId, getRequestMeta(request));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: validation.status });

  const { action } = (await request.json()) as { action?: string };
  if (!action || !allowedActions.has(action as ViewerMutationAction)) {
    return NextResponse.json({ error: "Invalid secure viewer action." }, { status: 400 });
  }

  const permitted = await recordViewerAction(auth, validation.viewSession, action as ViewerMutationAction, getRequestMeta(request));
  if (!permitted) {
    return NextResponse.json({ error: `${action} is not permitted for this secure view session.` }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
