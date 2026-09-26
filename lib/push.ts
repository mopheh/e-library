import webpush from "web-push";
import { db } from "@/database/drizzle";
import { notificationPreferences, pushSubscriptions } from "@/database/schema";
import { eq, inArray } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import { lagosHour } from "@/lib/time";

// Push categories map 1:1 onto the notification_preferences toggles.
export type PushCategory =
  | "messages"
  | "connections"
  | "academic"
  | "account"
  | "study"
  | "exam";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  // Notifications sharing a tag replace each other on the device instead of
  // stacking (e.g. one entry per chat room, not one per message).
  tag?: string;
}

type Prefs = typeof notificationPreferences.$inferSelect;

const CATEGORY_FIELD: Record<PushCategory, keyof Prefs> = {
  messages: "pushMessages",
  connections: "pushConnections",
  academic: "pushAcademic",
  account: "pushAccount",
  study: "studyReminders",
  exam: "examReminders",
};

const QUIET_START_HOUR = 22;
const QUIET_END_HOUR = 7;

function isQuietHour(date = new Date()) {
  const h = lagosHour(date);
  return h >= QUIET_START_HOUR || h < QUIET_END_HOUR;
}

let vapidConfigured: boolean | null = null;
function ensureVapid(): boolean {
  if (vapidConfigured !== null) return vapidConfigured;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.warn("[push] VAPID keys not set - web push disabled");
    vapidConfigured = false;
    return false;
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://rcfbethelacademy.com", publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

/**
 * Sends a push to every device of every user in userIds whose preferences
 * allow this category. Never throws - push is best-effort on top of the
 * in-app notification that callers already persisted.
 */
export async function sendPush(userIds: string[], category: PushCategory, payload: PushPayload) {
  return sendPushEach(userIds.map((userId) => ({ userId, payload })), category);
}

/**
 * Like sendPush, but each user gets their own payload - still just two
 * lookups for the whole batch (used by personalised scheduled reminders).
 */
export async function sendPushEach(items: { userId: string; payload: PushPayload }[], category: PushCategory) {
  if (items.length === 0 || !ensureVapid()) return;
  const userIds = [...new Set(items.map((i) => i.userId))];
  const payloadByUser = new Map(items.map((i) => [i.userId, i.payload]));

  try {
    const [subs, prefs] = await Promise.all([
      db.select().from(pushSubscriptions).where(inArray(pushSubscriptions.userId, userIds)),
      db.select().from(notificationPreferences).where(inArray(notificationPreferences.userId, userIds)),
    ]);
    if (subs.length === 0) return;

    const prefsByUser = new Map(prefs.map((p) => [p.userId, p]));
    const quiet = isQuietHour();
    const field = CATEGORY_FIELD[category];

    const allowed = subs.filter((s) => {
      const p = prefsByUser.get(s.userId);
      if (!p) return !quiet; // defaults: every category on, quiet hours on
      if (!p[field]) return false;
      return !(p.quietHours && quiet);
    });

    const bodyByUser = new Map(
      [...payloadByUser].map(([userId, payload]) => [userId, JSON.stringify({ url: "/dashboard/notifications", ...payload })]),
    );
    const expired: string[] = [];
    const delivered: string[] = [];

    await Promise.allSettled(
      allowed.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            bodyByUser.get(s.userId)!,
            { TTL: 60 * 60 * 24, timeout: 5000, urgency: category === "messages" ? "high" : "normal" },
          );
          delivered.push(s.id);
        } catch (err: any) {
          // 404/410: the browser dropped this subscription (uninstalled,
          // permission revoked, data cleared) - it will never work again.
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            expired.push(s.id);
          } else {
            console.error("[push] send failed:", err?.statusCode ?? err?.message ?? err);
          }
        }
      }),
    );

    await Promise.all([
      expired.length
        ? db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, expired))
        : null,
      delivered.length
        ? db.update(pushSubscriptions).set({ lastUsedAt: new Date() }).where(inArray(pushSubscriptions.id, delivered))
        : null,
    ]);
  } catch (err) {
    Sentry.captureException(err);
    console.error("[push] sendPush failed:", err);
  }
}

export async function getPreferences(userId: string) {
  const [row] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);
  return row ?? null;
}
