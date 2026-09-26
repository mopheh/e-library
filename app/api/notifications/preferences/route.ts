import { db } from "@/database/drizzle";
import { notificationPreferences } from "@/database/schema";
import { getCurrentUser } from "@/lib/auth";
import { getPreferences } from "@/lib/push";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

const DEFAULTS = {
  pushMessages: true,
  pushConnections: true,
  pushAcademic: true,
  pushAccount: true,
  studyReminders: true,
  examReminders: true,
  reminderHour: 19,
  quietHours: true,
};

const prefsSchema = z
  .object({
    pushMessages: z.boolean(),
    pushConnections: z.boolean(),
    pushAcademic: z.boolean(),
    pushAccount: z.boolean(),
    studyReminders: z.boolean(),
    examReminders: z.boolean(),
    reminderHour: z.number().int().min(7).max(21), // outside quiet hours
    quietHours: z.boolean(),
  })
  .partial();

function toResponse(row: Awaited<ReturnType<typeof getPreferences>>) {
  if (!row) return DEFAULTS;
  const { userId: _userId, updatedAt: _updatedAt, ...prefs } = row;
  return prefs;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return NextResponse.json({ preferences: toResponse(await getPreferences(user.id)) });
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = prefsSchema.safeParse(await req.json());
    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: "Invalid preferences" }, { status: 400 });
    }

    const [row] = await db
      .insert(notificationPreferences)
      .values({ userId: user.id, ...DEFAULTS, ...parsed.data })
      .onConflictDoUpdate({
        target: notificationPreferences.userId,
        set: { ...parsed.data, updatedAt: new Date() },
      })
      .returning();

    return NextResponse.json({ preferences: toResponse(row) });
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error updating notification preferences:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
