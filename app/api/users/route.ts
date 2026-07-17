///api/users
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { departments, faculty, systemSettings, users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { requireRole } from "@/lib/auth";
import { validateMatricNo } from "@/lib/facultyCodes";

import { clerkClient } from "@clerk/nextjs/server";

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

    const clerkIds = results.map((u) => u.clerkId);

    if (clerkIds.length > 0) {
      try {
        const client = await clerkClient();
        // Fetch up to 500 users
        const clerkUsersResp = await client.users.getUserList({
          userId: clerkIds,
          limit: 500,
        });

        // Map clerkId to imageUrl
        const clerkUserMap = new Map(
          clerkUsersResp.data.map((u) => [u.id, u.imageUrl])
        );

        const mappedResults = results.map((u) => {
          return { ...u, imageUrl: clerkUserMap.get(u.clerkId) || null };
        });

        return NextResponse.json(mappedResults);
      } catch (err) {
        console.error("Failed to fetch clerk users for imageUrls:", err);
        return NextResponse.json(results);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
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
      return NextResponse.json({ error: "Missing email" }, { status: 500 });
    }
    const existingMatNo = await db
      .select()
      .from(users)
      .where(eq(users.matricNo, params.matricNo))
      .limit(1);

    if (existingMatNo.length > 0) {
      console.log("Matric Number is taken!!!");
      console.error("Failed to insert user");
      return NextResponse.json(
        { message: "Matric Number is already taken!!!" },
        { status: 500 },
      );
    }

    // JAMB reg numbers (ASPIRANT signup) reuse the matricNo column and don't
    // follow the faculty-code format, so only students are gated here.
    if (params.role === "STUDENT" && params.facultyId && params.matricNo) {
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
      // User already exists, let's update their onboarding info instead of throwing an error
      await db.update(users).set(params).where(eq(users.email, params.email));

      // Sync with Clerk Metadata
      try {
        const client = await clerkClient();
        await client.users.updateUserMetadata(params.clerkId, {
          publicMetadata: {
            onboarded: true,
            role: params.role || "STUDENT",
          },
        });
      } catch (clerkError) {
        console.error("[POST /api/users] Failed to update Clerk metadata:", clerkError);
      }

      return NextResponse.json({ success: true, message: "user updated" });
    }

    await db.insert(users).values(params);

    // Sync with Clerk Metadata for immediate role and onboarding update
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(params.clerkId, {
        publicMetadata: {
          onboarded: true,
          role: params.role || "STUDENT",
        },
      });
    } catch (clerkError) {
      console.error("[POST /api/users] Failed to update Clerk metadata:", clerkError);
      // We don't necessarily want to fail the whole request if Clerk sync fails, 
      // but it will cause the redirection issue.
    }

    return NextResponse.json({ success: true, message: "user created" });
  } catch (e) {
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
    console.error("[PUT /api/users]", err);
    return NextResponse.json({ error: err.message || "Failed to update user" }, { status: 500 });
  }
}
