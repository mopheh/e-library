import { db } from "@/database/drizzle";
import { users, readingSessions, sessions, departments } from "@/database/schema";
import { eq, sql, desc, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "department"; 

    // Setup base conditions
    const conditions = [];
    if (filter === "department" && user.departmentId) {
      conditions.push(eq(users.departmentId, user.departmentId));
    }

    // Calculate Leaderboard Points
    const leaderboard = await db
      .select({
        id: users.id,
        name: users.fullName,
        department: departments.name,
        points: sql<number>`
          COALESCE(SUM(${readingSessions.duration} / 5.0), 0) + 
          COALESCE(SUM(${readingSessions.pagesRead} * 2), 0) + 
          COALESCE((SELECT SUM(score) FROM ${sessions} WHERE ${sessions.userId} = ${users.id}), 0)
        `,
        streak: sql<number>`0`
      })
      .from(users)
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .leftJoin(readingSessions, eq(users.id, readingSessions.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(users.id, users.fullName, departments.name)
      .orderBy(desc(sql`points`))
      .limit(20);

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("[LEADERBOARD_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

