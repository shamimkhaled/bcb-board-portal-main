import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth";
import {
  deletePushSubscription,
  listPushSubscriptionsForUser,
  savePushSubscription,
  type PushSubscriptionPayload
} from "@/lib/push";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;
  const subscriptions = await listPushSubscriptionsForUser(auth.user.id);

  return NextResponse.json({
    publicKey,
    types: [
      "NEW_MEETING",
      "AGENDA_PUBLISHED",
      "MEETING_REMINDER",
      "APPROVAL_PENDING",
      "DOCUMENT_SHARED",
      "RESOLUTION_SIGNED",
      "CIRCULAR_PUBLISHED"
    ],
    subscriptions: subscriptions.map((item) => ({
      endpoint: item.endpoint,
      createdAt: item.createdAt
    }))
  });
}

export async function POST(request: Request) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as PushSubscriptionPayload;
  if (!body?.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
  }

  await savePushSubscription({
    id: randomUUID(),
    userId: auth.user.id,
    endpoint: body.endpoint,
    p256dh: body.keys.p256dh,
    auth: body.keys.auth,
    userAgent: request.headers.get("user-agent")
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await getCurrentAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { endpoint?: string };
  if (!body.endpoint) {
    return NextResponse.json({ error: "endpoint required" }, { status: 400 });
  }

  await deletePushSubscription(auth.user.id, body.endpoint);
  return NextResponse.json({ ok: true });
}
