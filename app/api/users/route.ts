///api/users
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { departments, faculty, systemSettings, users } from "@/database/schema";
import { eq, and, ne, or, ilike, desc, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { requireRole } from "@/lib/auth";
import { validateMatricNo } from "@/lib/facultyCodes";

import { clerkClient } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";

const USER_ROLES = ["STUDENT", "ADMIN", "FACULTY REP", "ASPIRANT"] as const;

// Self-onboarding (this route's POST) may only ever create a STUDENT or
// ASPIRANT — ADMIN/FACULTY REP is exclusively granted via the audited
// PATCH /api/admin/role flow. Anything else in the request body is ignored
// below via the explicit field allowlist (never spread the raw body into
// the DB call — that's how a caller could otherwise smuggle in `role`,
// `id`, or any other column).
const SELF_ONBOARD_ROLES = new Set(["STUDENT", "ASPIRANT"]);
const ONBOARD_FIELDS = [
  "fullName",
  "email",
  "phoneNumber",
  "year",
  "facultyId",
  "departmentId",
  "matricNo",
  "dateOfBirth",
  "gender",
  "address",
  "interests",
] as const;

function pickOnboardFields(params: Record<string, unknown>) {
  const picked: Record<string, unknown> = {};
  for (const key of ONBOARD_FIELDS) {
    if (params[key] !== undefined) picked[key] = params[key];
  }
  return picked;
}

async function enrichWithClerkAvatars<T extends { clerkId: string }>(rows: T[]) {
  const clerkIds = rows.map((u) => u.clerkId);
  if (clerkIds.length === 0) return rows;
  try {
    const client = await clerkClient();
    const clerkUsersResp = await client.users.getUserList({ userId: clerkIds, limit: 500 });
    const clerkUserMap = new Map(clerkUsersResp.data.map((u) => [u.id, u.imageUrl]));
    return rows.map((u) => ({ ...u, imageUrl: clerkUserMap.get(u.clerkId) || null }));
  } catch (err) {
    console.error("Failed to fetch clerk users for imageUrls:", err);
    return rows;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get("facultyId");
    const departmentId = searchParams.get("departmentId");
    const clerkId = searchParams.get("clerkId");

    // ── Admin-only platform-wide directory: paginated, filtered, searched —
    // deliberately NOT the same code path as the plain "no filter" case
    // below, which stays a hard 400 to prevent any non-admin caller from
    // pulling a full PII dump.
    if (searchParams.get("all") === "true") {
      const authCheck = await requireRole(["ADMIN"]);
      if (!authCheck.authorized) {
        return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
      }

      const roleParam = searchParams.get("role");
      const roleFilter = roleParam && (USER_ROLES as readonly string[]).includes(roleParam)
        ? (roleParam as typeof USER_ROLES[number])
        : null;
      const search = searchParams.get("search");
      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
      const offset = (page - 1) * limit;

      const conditions = [];
      if (roleFilter) conditions.push(eq(users.role, roleFilter));
      if (facultyId) conditions.push(eq(users.facultyId, facultyId));
      if (departmentId) conditions.push(eq(users.departmentId, departmentId));
      if (search) {
        conditions.push(
          or(
            ilike(users.fullName, `%${search}%`),
            ilike(users.email, `%${search}%`),
            ilike(users.matricNo, `%${search}%`)
          )
        );
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [rows, [{ count }]] = await Promise.all([
        db
          .select()
          .from(users)
          .leftJoin(departments, eq(users.departmentId, departments.id))
          .leftJoin(faculty, eq(users.facultyId, faculty.id))
          .where(whereClause)
          .orderBy(desc(users.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(users)
          .where(whereClause),
      ]);

      const mapped = rows.map((r) => ({
        ...r.users,
        department: r.departments,
        faculty: r.faculty,
      }));
      const enriched = await enrichWithClerkAvatars(mapped);

      return NextResponse.json({
        users: enriched,
        pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
      });
    }

    let rawResults;

    if (clerkId) {
      rawResults = await db
        .select()
        .from(users).leftJoin(departments, eq(users.departmentId, departments.id))
        .where(eq(users.clerkId, clerkId));
    } else if (facultyId) {
      rawResults = await db
        .select()
        .from(users).leftJoin(departments, eq(users.departmentId, departments.id))
        .where(eq(users.facultyId, facultyId));
    } else if (departmentId) {
      rawResults = await db
        .select()
        .from(users).leftJoin(departments, eq(users.departmentId, departments.id))
        .where(eq(users.departmentId, departmentId));
    } else {
      // No legitimate caller needs a full unfiltered user dump (checked: every
      // call site passes facultyId/departmentId/clerkId) - refusing this avoids
      // an accidental full-table PII scan (name, email, matric number, etc.)
      // as the app grows past a handful of users.
      return NextResponse.json(
        { error: "At least one of clerkId, facultyId, or departmentId is required" },
        { status: 400 }
      );
    }

    const results = rawResults.map((r) => ({
      ...r.users,
      department: r.departments,
    }));

    return NextResponse.json(await enrichWithClerkAvatars(results));
  } catch (error) {
    Sentry.captureException(error);
    console.error("[GET /api/users]", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
export async function POST(req: Request) {
  try {
    const { userId } = await auth(); // logged in user
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const params = await req.json();

    // Ensure user cannot modify/create profiles for other Clerk IDs
    if (params.clerkId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: Cannot register or modify other user profiles" },
        { status: 403 }
      );
    }

    if (!params.email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    // Never trust the caller's `role` — only STUDENT/ASPIRANT are self-servable.
    const safeRole = SELF_ONBOARD_ROLES.has(params.role) ? params.role : "STUDENT";
    const safeFields = pickOnboardFields(params);
    const existingMatNo = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.matricNo, params.matricNo),
          ne(users.email, params.email)
        )
      )
      .limit(1);

    if (existingMatNo.length > 0) {
      return NextResponse.json(
        { message: "Matric Number is already taken!!!" },
        { status: 409 },
      );
    }

    // JAMB reg numbers (ASPIRANT signup) reuse the matricNo column and don't
    // follow the faculty-code format, so only students are gated here.
    if (safeRole === "STUDENT" && params.facultyId && params.matricNo) {
      const [fac] = await db
        .select({ name: faculty.name })
        .from(faculty)
        .where(eq(faculty.id, params.facultyId))
        .limit(1);

      if (fac) {
        const [settings] = await db.select().from(systemSettings).limit(1);
        const result = validateMatricNo(params.matricNo, fac.name, settings?.matricFacultyCheckEnabled ?? false);
        if (!result.valid) {
          return NextResponse.json({ message: result.reason }, { status: 400 });
        }
      }
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, params.email))
      .limit(1);

    if (existingUser.length > 0) {
      // User already exists, let's update their onboarding info instead of
      // throwing an error. Role is deliberately excluded from `safeFields` —
      // an existing user's role never changes through this endpoint, only
      // through the audited PATCH /api/admin/role flow.
      await db.update(users).set(safeFields).where(eq(users.email, params.email));

      // Sync with Clerk Metadata
      try {
        const client = await clerkClient();
        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            onboarded: true,
            role: existingUser[0].role || "STUDENT",
          },
        });
      } catch (clerkError) {
        console.error("[POST /api/users] Failed to update Clerk metadata:", clerkError);
      }

      return NextResponse.json({ success: true, message: "user updated" });
    }

    await db.insert(users).values({ ...safeFields, clerkId: userId, role: safeRole } as typeof users.$inferInsert);

    // Sync with Clerk Metadata for immediate role and onboarding update
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          onboarded: true,
          role: safeRole,
        },
      });
    } catch (clerkError) {
      console.error("[POST /api/users] Failed to update Clerk metadata:", clerkError);
      // We don't necessarily want to fail the whole request if Clerk sync fails, 
      // but it will cause the redirection issue.
    }

    return NextResponse.json({ success: true, message: "user created" });
  } catch (e) {
    Sentry.captureException(e);
    console.error("[POST /api/users]", e);
    return NextResponse.json(
      { error: "Failed to Create User" },
      { status: 500 },
    );
  }
}

/**
 * Admin-only: reassign a user (student) to a different department.
 * Keeps facultyId in sync with the target department's own faculty, since
 * both are stored independently on the users row.
 */
export async function PUT(req: NextRequest) {
  try {
    const authCheck = await requireRole(["ADMIN"]);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await req.json();
    const { userId, departmentId } = body;
    if (!userId || !departmentId) {
      return NextResponse.json({ error: "userId and departmentId are required" }, { status: 400 });
    }

    const [targetDept] = await db
      .select({ id: departments.id, facultyId: departments.facultyId })
      .from(departments)
      .where(eq(departments.id, departmentId))
      .limit(1);
    if (!targetDept) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(users)
      .set({ departmentId: targetDept.id, facultyId: targetDept.facultyId })
      .where(eq(users.id, userId))
      .returning();
    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    Sentry.captureException(err);
    console.error("[PUT /api/users]", err);
    return NextResponse.json({ error: err.message || "Failed to update user" }, { status: 500 });
  }
}
