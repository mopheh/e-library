import { db } from "@/database/drizzle";
import { academicProfiles } from "@/database/schema";
import { getCurrentUser } from "@/lib/auth";
import { loadGrades } from "@/lib/grades";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

const cgpa = z.number().min(0).max(5).multipleOf(0.01);

const profileSchema = z
  .object({
    priorCgpa: cgpa.nullable(),
    priorUnits: z.number().int().min(1).max(400).nullable(),
    targetCgpa: cgpa.nullable(),
  })
  .partial()
  .refine(
    // A prior CGPA means nothing without the units it was earned over
    (p) => p.priorCgpa === undefined || p.priorCgpa === null || (p.priorUnits !== undefined && p.priorUnits !== null),
    { message: "Enter the total units your CGPA covers." },
  );

// Grades are private: every query is scoped to the signed-in student.
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json(await loadGrades(user.id));
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error loading grades:", error);
    return NextResponse.json({ error: "Failed to load grades" }, { status: 500 });
  }
}

// Update the quick-start CGPA and/or the target.
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = profileSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid values" }, { status: 400 });
    }
    const patch = { ...parsed.data };
    // Clearing the prior CGPA clears its units too
    if (patch.priorCgpa === null) patch.priorUnits = null;

    await db
      .insert(academicProfiles)
      .values({ userId: user.id, ...patch })
      .onConflictDoUpdate({ target: academicProfiles.userId, set: { ...patch, updatedAt: new Date() } });

    return NextResponse.json(await loadGrades(user.id));
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error updating academic profile:", error);
    return NextResponse.json({ error: "Couldn't save. Please try again." }, { status: 500 });
  }
}
