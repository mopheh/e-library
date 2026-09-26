import { db } from "@/database/drizzle";
import { academicProfiles } from "@/database/schema";
import { getCurrentUser } from "@/lib/auth";
import { MAX_WEEKLY_MINUTES, MIN_WEEKLY_MINUTES, computePlan, getCachedPlan, invalidatePlan } from "@/lib/planner";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

const settingsSchema = z
  .object({
    weeklyMinutes: z.number().int().min(MIN_WEEKLY_MINUTES).max(MAX_WEEKLY_MINUTES),
    // null = go back to working the semester out automatically
    planSemester: z.enum(["FIRST", "SECOND"]).nullable(),
  })
  .partial();

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json(await getCachedPlan(user.id));
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error computing plan:", error);
    return NextResponse.json({ error: "Failed to load your plan" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = settingsSchema.safeParse(await req.json());
    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: "Invalid plan settings" }, { status: 400 });
    }
    const set = {
      ...(parsed.data.weeklyMinutes !== undefined && { weeklyStudyMinutes: parsed.data.weeklyMinutes }),
      ...(parsed.data.planSemester !== undefined && { planSemester: parsed.data.planSemester }),
    };

    await db
      .insert(academicProfiles)
      .values({ userId: user.id, ...set })
      .onConflictDoUpdate({ target: academicProfiles.userId, set: { ...set, updatedAt: new Date() } });

    await invalidatePlan(user.id);
    return NextResponse.json(await computePlan(user.id));
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error updating plan settings:", error);
    return NextResponse.json({ error: "Couldn't save your plan" }, { status: 500 });
  }
}
