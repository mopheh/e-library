import { and, eq, ne } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/database/drizzle";
import { departments, faculty, LEVEL_ENUM, systemSettings, users } from "@/database/schema";
import { validateMatricNo } from "@/lib/facultyCodes";
import * as Sentry from "@sentry/nextjs";
import { getCurrentUser, invalidateUserCache } from "@/lib/auth";
import { loadProfile } from "@/lib/profile";
import { invalidatePlan } from "@/lib/planner";
import { invalidateCache } from "@/lib/redis";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(await loadProfile(user));
  } catch (error) {
    Sentry.captureException(error);
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

const MIN_AGE = 13;
const MAX_AGE = 100;

function ageOn(dob: string, today = new Date()) {
  const d = new Date(`${dob}T00:00:00Z`);
  let age = today.getUTCFullYear() - d.getUTCFullYear();
  const m = today.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < d.getUTCDate())) age--;
  return age;
}

const updateSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  // Nigerian mobile (0803…, +234803…) or any international number; spaces/dashes ignored.
  phoneNumber: z
    .string()
    .transform((v) => v.replace(/[\s()-]/g, ""))
    .refine((v) => v === "" || /^(?:0[789]\d{9}|\+?\d{10,15})$/.test(v), "Enter a valid phone number, e.g. 0803 123 4567"),
  gender: z.enum(["MALE", "FEMALE"]),
  dateOfBirth: z
    .string()
    .refine((v) => v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))), "Enter a valid date")
    .refine((v) => v === "" || (ageOn(v) >= MIN_AGE && ageOn(v) <= MAX_AGE), "Check your date of birth"),
  address: z.string().trim().min(1, "Address is required").max(255),
  matricNo: z.string().trim().min(1, "Matric number is required").max(40).transform((v) => v.toUpperCase()),
  facultyId: z.string().uuid("Choose your faculty"),
  departmentId: z.string().uuid("Choose your department"),
  level: z.enum(LEVEL_ENUM.enumValues, { message: "Choose your level" }),
});

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = updateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json({ error: issue?.message ?? "Invalid details", field: issue?.path[0] }, { status: 400 });
    }
    const v = parsed.data;

    // The department must belong to the chosen faculty.
    const [place] = await db
      .select({ facultyName: faculty.name })
      .from(departments)
      .innerJoin(faculty, eq(faculty.id, departments.facultyId))
      .where(and(eq(departments.id, v.departmentId), eq(departments.facultyId, v.facultyId)))
      .limit(1);
    if (!place) {
      return NextResponse.json({ error: "That department isn't in the selected faculty", field: "departmentId" }, { status: 400 });
    }

    if (v.matricNo !== user.matricNo) {
      // Matric format is faculty-dependent. ASPIRANTs reuse this column for
      // a JAMB reg number, so they're exempt.
      if (user.role === "STUDENT") {
        const [settings] = await db.select().from(systemSettings).limit(1);
        const result = validateMatricNo(v.matricNo, place.facultyName, settings?.matricFacultyCheckEnabled ?? false);
        if (!result.valid) {
          return NextResponse.json({ error: result.reason, field: "matricNo" }, { status: 400 });
        }
      }
      const [taken] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.matricNo, v.matricNo), ne(users.id, user.id)))
        .limit(1);
      if (taken) {
        return NextResponse.json({ error: "That matric number is already registered to another account", field: "matricNo" }, { status: 409 });
      }
    }

    // Clerk first: if the name can't be saved there, don't leave the two out of step.
    const fullName = `${v.firstName} ${v.lastName}`;
    if (fullName !== user.fullName) {
      const client = await clerkClient();
      await client.users.updateUser(user.clerkId, { firstName: v.firstName, lastName: v.lastName });
    }

    await db
      .update(users)
      .set({
        fullName,
        phoneNumber: v.phoneNumber || null,
        gender: v.gender,
        dateOfBirth: v.dateOfBirth || null,
        address: v.address,
        matricNo: v.matricNo,
        facultyId: v.facultyId,
        departmentId: v.departmentId,
        year: v.level,
      })
      .where(eq(users.id, user.id));

    await invalidateUserCache({ clerkId: user.clerkId });
    // Department and level decide which courses, exams and plan the student sees.
    if (v.departmentId !== user.departmentId || v.level !== user.year) {
      await Promise.all([invalidatePlan(user.id), invalidateCache(`analytics:${user.id}`)]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
