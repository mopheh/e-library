import { db } from "@/database/drizzle";
import { pushSubscriptions } from "@/database/schema";
import { getCurrentUser } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(256),
  }),
});

// Registers (or re-points) this device's push subscription to the caller.
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = subscriptionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }
    const { endpoint, keys } = parsed.data;
    const userAgent = req.headers.get("user-agent")?.slice(0, 512) ?? null;

    await db
      .insert(pushSubscriptions)
      .values({ userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth, userAgent },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error saving push subscription:", error);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}

// Removes this device's subscription (push toggled off, or signing out).
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { endpoint } = await req.json().catch(() => ({}));
    if (typeof endpoint !== "string" || !endpoint) {
      return NextResponse.json({ error: "endpoint is required" }, { status: 400 });
    }

    await db
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error deleting push subscription:", error);
    return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 });
  }
}
