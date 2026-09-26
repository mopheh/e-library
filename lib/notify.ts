import { after } from "next/server";
import { db } from "@/database/drizzle";
import { notifications } from "@/database/schema";
import { pusherServer } from "@/lib/pusher";
import { sendPush, type PushCategory, type PushPayload } from "@/lib/push";

type NotificationType = (typeof notifications.$inferInsert)["type"];

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  message: string;
  targetId?: string | null;
  // Which preference toggle gates the push for this notification.
  category: PushCategory;
  // Push-only overrides; the in-app notification always uses `message`.
  title?: string;
  url?: string;
  tag?: string;
}

// Runs work after the response is sent when inside a Next.js request (so a
// slow push service never delays the user's action), or inline otherwise
// (the background worker, scripts).
function runAfterResponse(task: () => Promise<unknown>) {
  try {
    after(task);
  } catch {
    return task();
  }
}

/**
 * The single way to notify a user: persists the in-app notification, pushes
 * it live over Pusher to open tabs, and sends a web push to their devices.
 * Only the DB insert can throw - realtime and push are best-effort.
 */
export async function notify(input: NotifyInput) {
  const [notif] = await notifyMany([input]);
  return notif;
}

/** Batched variant: one INSERT for all rows, then fan out realtime + push. */
export async function notifyMany(inputs: NotifyInput[]) {
  if (inputs.length === 0) return [];

  const rows = await db
    .insert(notifications)
    .values(
      inputs.map((i) => ({
        userId: i.userId,
        type: i.type,
        message: i.message,
        targetId: i.targetId ?? null,
      })),
    )
    .returning();

  rows.forEach((row) => {
    pusherServer
      .trigger(`user-${row.userId}`, "new-notification", row)
      .catch((err) => console.error("Pusher trigger failed (new-notification):", err));
  });

  // Recipients of an identical push share one sendPush call (one subscription
  // + preference lookup) instead of one per user - matters for fan-outs.
  const groups = new Map<string, { input: NotifyInput; userIds: string[] }>();
  for (const i of inputs) {
    const key = JSON.stringify([i.category, i.title, i.message, i.url, i.tag]);
    const group = groups.get(key);
    if (group) group.userIds.push(i.userId);
    else groups.set(key, { input: i, userIds: [i.userId] });
  }

  await runAfterResponse(() =>
    Promise.all(
      [...groups.values()].map(({ input: i, userIds }) =>
        sendPush(userIds, i.category, {
          title: i.title ?? "RCF E-Library",
          body: i.message,
          url: i.url,
          tag: i.tag,
        }),
      ),
    ),
  );

  return rows;
}

/** Push-only (no in-app row) - for nudges that would just clutter the bell. */
export function pushOnly(userIds: string[], category: PushCategory, payload: PushPayload) {
  return sendPush(userIds, category, payload);
}
