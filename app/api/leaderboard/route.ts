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
    const leaderboardData = await db
      .select({
        id: users.id,
        name: users.fullName,
        department: departments.name,
        points: sql<number>`
          COALESCE(SUM(${readingSessions.duration} / 5.0), 0) + 
          COALESCE(SUM(${readingSessions.pagesRead} * 2), 0) + 
          COALESCE((SELECT SUM(score) FROM ${sessions} WHERE ${sessions.userId} = ${users.id}), 0)
        `,
      })
      .from(users)
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .leftJoin(readingSessions, eq(users.id, readingSessions.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(users.id, users.fullName, departments.name)
      .orderBy(desc(sql`points`))
      .limit(20);

    // Compute streak for these top 20 users
    const userIds = leaderboardData.map(u => u.id);
    const streaks: Record<string, number> = {};
    
    if (userIds.length > 0) {
      const sessionsData = await db
        .select({
          userId: readingSessions.userId,
          date: readingSessions.date
        })
        .from(readingSessions)
        .where(sql`${readingSessions.userId} IN ${userIds}`)
        .orderBy(desc(readingSessions.date));
        
      const todayStr = new Date().toISOString().split("T")[0];
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      
      for (const uid of userIds) {
        const userSess = sessionsData.filter(s => s.userId === uid).map(s => s.date);
        const uniqueDates = Array.from(new Set(userSess)).sort().reverse();
        
        let streak = 0;
        if (uniqueDates.length > 0) {
          const lastDateStr = uniqueDates[0];
          if (lastDateStr === todayStr || lastDateStr === yesterdayStr) {
            streak = 1;
            let currentStr = lastDateStr;
            for (let i = 1; i < uniqueDates.length; i++) {
              const prevStr = uniqueDates[i];
              const expectedPrevStr = new Date(new Date(currentStr).getTime() - 86400000).toISOString().split("T")[0];
              if (prevStr === expectedPrevStr) {
                streak++;
                currentStr = prevStr;
              } else {
                break;
              }
            }
          }
        }
        streaks[uid] = streak;
      }
    }

    const leaderboard = leaderboardData.map(u => ({
      ...u,
      streak: streaks[u.id] || 0
    }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("[LEADERBOARD_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

