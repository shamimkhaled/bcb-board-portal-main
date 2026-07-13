import { promises as fs } from "fs";
import path from "path";

export type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type StoredPushSubscription = {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
  createdAt: string;
};

const STORE_PATH = path.join(process.cwd(), "storage", "push-subscriptions.json");

async function readStore(): Promise<StoredPushSubscription[]> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as StoredPushSubscription[];
  } catch {
    return [];
  }
}

async function writeStore(items: StoredPushSubscription[]) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(items, null, 2), "utf8");
}

export async function listPushSubscriptionsForUser(userId: string) {
  const items = await readStore();
  return items.filter((item) => item.userId === userId);
}

export async function savePushSubscription(input: {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
}) {
  const items = await readStore();
  const next = items.filter((item) => item.endpoint !== input.endpoint);
  next.push({
    id: input.id,
    userId: input.userId,
    endpoint: input.endpoint,
    p256dh: input.p256dh,
    auth: input.auth,
    userAgent: input.userAgent ?? null,
    createdAt: new Date().toISOString()
  });
  await writeStore(next);
}

export async function deletePushSubscription(userId: string, endpoint: string) {
  const items = await readStore();
  await writeStore(items.filter((item) => !(item.userId === userId && item.endpoint === endpoint)));
}

/** Notification type codes ready for server send integration. */
export const PUSH_NOTIFICATION_TYPES = [
  "NEW_MEETING",
  "AGENDA_PUBLISHED",
  "MEETING_REMINDER",
  "APPROVAL_PENDING",
  "DOCUMENT_SHARED",
  "RESOLUTION_SIGNED",
  "CIRCULAR_PUBLISHED"
] as const;

export type PushNotificationType = (typeof PUSH_NOTIFICATION_TYPES)[number];

export const PUSH_DEEP_LINKS: Record<PushNotificationType, string> = {
  NEW_MEETING: "/meetings",
  AGENDA_PUBLISHED: "/meetings",
  MEETING_REMINDER: "/meetings",
  APPROVAL_PENDING: "/memo-workflow",
  DOCUMENT_SHARED: "/documents",
  RESOLUTION_SIGNED: "/resolutions",
  CIRCULAR_PUBLISHED: "/notifications"
};
