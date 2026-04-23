// /app/api/users/reading-session/route.ts
import { db } from "@/database/drizzle";
import { and, eq, gte, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { readingSessions, users } from "@/database/schema";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { format, subDays } from "date-fns";

// ── Zod Schemas ────────────────────────────────────────────────────────────────

const postSchema = z.object({
  bookId: z.string().uuid("bookId must be a valid UUID"),
  pagesRead: z.number().int().nonnegative().default(0),
  duration: z.number().int().nonnegative().default(0),
});

// ── Helper: resolve internal user from Clerk ID ────────────────────────────────

async function resolveUser(clerkId: string) {
  const [user] = await db
    .select({ id: users.id, departmentId: users.departmentId })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return user ?? null;
}

// ── POST — log a reading session (upsert per user+book+date) ──────────────────

export async function POST(req: NextRequest) {
  // P0 auth guard — must check before any DB query
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate request body with Zod
  let parsed: z.infer<typeof postSchema>;
  try {
    const body = await req.json();
    parsed = postSchema.parse(body);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: err.errors },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { bookId, pagesRead, duration } = parsed;

  // Resolve internal user — run once, reuse id
  const user = await resolveUser(clerkId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd

  try {
    // Atomic upsert: insert new or accumulate into existing session for today
    await db
      .insert(readingSessions)
      .values({
        userId: user.id,
        bookId,
        date: today,
        pagesRead,
        duration,
      })
      .onConflictDoUpdate({
        // requires a unique index on (userId, bookId, date) — add below if not present
        target: [readingSessions.userId, readingSessions.bookId, readingSessions.date],
        set: {
          pagesRead: sql`${readingSessions.pagesRead} + ${pagesRead}`,
          duration: sql`${readingSessions.duration} + ${duration}`,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/users/reading-session]", error);
    return NextResponse.json({ error: "Failed to log session" }, { status: 500 });
  }
}

// ── GET — last 7 days reading data for user + dept average ────────────────────

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await resolveUser(clerkId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const sevenDaysAgo = format(subDays(new Date(), 6), "yyyy-MM-dd");

  try {
    // Run both DB queries in parallel — no need to await sequentially
    const [userSessions, deptSessions] = await Promise.all([
      // 1. User's own aggregated reading per day (SQL-level group-by)
      db
        .select({
          date: readingSessions.date,
          pagesRead: sql<number>`sum(${readingSessions.pagesRead})`.as("pagesRead"),
        })
        .from(readingSessions)
        .where(
          and(
            eq(readingSessions.userId, user.id),
            gte(readingSessions.date, sevenDaysAgo),
          ),
        )
        .groupBy(readingSessions.date),

      // 2. Department averages per day (SQL-level group-by with distinct users)
      user.departmentId
        ? db
            .select({
              date: readingSessions.date,
              totalPages: sql<number>`sum(${readingSessions.pagesRead})`.as("totalPages"),
              uniqueUsers: sql<number>`count(distinct ${readingSessions.userId})`.as("uniqueUsers"),
            })
            .from(readingSessions)
            .innerJoin(users, eq(readingSessions.userId, users.id))
            .where(
              and(
                eq(users.departmentId, user.departmentId!),
                gte(readingSessions.date, sevenDaysAgo),
              ),
            )
            .groupBy(readingSessions.date)
        : Promise.resolve([]),
    ]);

    // Build lookup maps for O(1) access
    const userMap = new Map(userSessions.map((s) => [s.date, Number(s.pagesRead)]));
    const deptMap = new Map(
      (deptSessions as any[]).map((s) => [
        s.date,
        Math.round(Number(s.totalPages) / Math.max(Number(s.uniqueUsers), 1)),
      ]),
    );

    // Build full 7-day result with zero-fill for missing days
    const result = Array.from({ length: 7 }, (_, i) => {
      const key = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
      return {
        date: key,
        pagesRead: userMap.get(key) ?? 0,
        departmentAverage: deptMap.get(key) ?? 0,
      };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[GET /api/users/reading-session]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
