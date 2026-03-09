import { db } from "@/database/drizzle";
import { readingSessions, userBooks, users } from "@/database/schema";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { format, subDays, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, parseISO } from "date-fns";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get internal user ID and department
    const [user] = await db
      .select({ 
        id: users.id,
        departmentId: users.departmentId
      })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user.id;
    const departmentId = user.departmentId;

    // 1. KPIs
    // Total Books Read
    const booksReadRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(userBooks)
      .where(and(eq(userBooks.userId, userId), sql`${userBooks.readCount} > 0`));
    const totalBooksRead = Number(booksReadRes[0]?.count || 0);

    // Total Minutes Read
    const timeReadRes = await db
      .select({ totalMinutes: sql<number>`sum(${readingSessions.duration})` })
      .from(readingSessions)
      .where(eq(readingSessions.userId, userId));
    const totalMinutesRead = Number(timeReadRes[0]?.totalMinutes || 0);

    // Current Streak Calculation
    // Fetch distinct dates for user's reading sessions, ordered by date desc
    const sessions = await db
      .select({ date: readingSessions.date })
      .from(readingSessions)
      .where(eq(readingSessions.userId, userId))
      .orderBy(desc(readingSessions.date));

    // Dedup dates and sort desc (though DB sort helps)
    const uniqueDates = Array.from(new Set(sessions.map(s => s.date))).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    const today = new Date();
    const yesterday = subDays(today, 1);
    
    // Check if the most recent session was today or yesterday to start the streak
    if (uniqueDates.length > 0) {
        const lastDate = new Date(uniqueDates[0]);
        if (isSameDay(lastDate, today) || isSameDay(lastDate, yesterday)) {
            streak = 1;
            let currentDate = lastDate;
            
            for (let i = 1; i < uniqueDates.length; i++) {
                const prevDate = new Date(uniqueDates[i]);
                const expectedPrev = subDays(currentDate, 1);
                if (isSameDay(prevDate, expectedPrev)) {
                    streak++;
                    currentDate = prevDate;
                } else {
                    break;
                }
            }
        }
    }

    // 2. Heatmap Data (Last 365 days or all time)
    // Group by date, sum duration
    const heatmapData = await db
      .select({
        date: readingSessions.date,
        count: sql<number>`count(*)`, // or sum duration/pages
        value: sql<number>`sum(${readingSessions.duration})` // intensity based on duration
      })
      .from(readingSessions)
      .where(eq(readingSessions.userId, userId))
      .groupBy(readingSessions.date);

    // 3. Weekly Trends (Last 7 days)
    const sevenDaysAgo = subDays(new Date(), 6);
    const last7DaysSessions = await db
      .select({
        date: readingSessions.date,
        minutes: readingSessions.duration
      })
      .from(readingSessions)
      .where(and(
        eq(readingSessions.userId, userId),
        gte(readingSessions.date, format(sevenDaysAgo, "yyyy-MM-dd"))
      ));

    // Aggregate by day for chart
    const trendsMap = new Map();
    const days = eachDayOfInterval({ start: sevenDaysAgo, end: new Date() });
    
    days.forEach(day => {
        trendsMap.set(format(day, "yyyy-MM-dd"), { user: 0, department: 0 });
    });

    last7DaysSessions.forEach(session => {
        const d = new Date(session.date); 
        const key = format(d, "yyyy-MM-dd");
        if (trendsMap.has(key)) {
            const current = trendsMap.get(key);
            trendsMap.set(key, { ...current, user: current.user + (session.minutes || 0) });
        }
    });

    // 4. Department Average Trends (Last 7 days)
    if (departmentId) {
      const deptSessions = await db
        .select({
          date: readingSessions.date,
          minutes: readingSessions.duration,
          userId: readingSessions.userId,
        })
        .from(readingSessions)
        .innerJoin(users, eq(readingSessions.userId, users.id))
        .where(and(
          eq(users.departmentId, departmentId),
          gte(readingSessions.date, format(sevenDaysAgo, "yyyy-MM-dd"))
        ));

      // Calculate average per day
      // 1. Group by date and sum total minutes across all dept users
      // 2. Count distinct active users per day (or total users in dept but active is more accurate for "average reader")
      const deptDailyTotals: Record<string, { totalMins: number, users: Set<string> }> = {};
      
      deptSessions.forEach(s => {
          const d = new Date(s.date);
          const key = format(d, "yyyy-MM-dd");
          if (!deptDailyTotals[key]) {
             deptDailyTotals[key] = { totalMins: 0, users: new Set() };
          }
          deptDailyTotals[key].totalMins += (s.minutes || 0);
          deptDailyTotals[key].users.add(s.userId);
      });

      // Inject averages into trendsMap
      for (const [key, data] of Object.entries(deptDailyTotals)) {
          if (trendsMap.has(key)) {
              const current = trendsMap.get(key);
              const userCount = data.users.size || 1; // avoid division by zero
              const averageMins = Math.round(data.totalMins / userCount);
              trendsMap.set(key, { ...current, department: averageMins });
          }
      }
    }

    const weeklyTrends = Array.from(trendsMap.entries()).map(([date, data]) => ({
        date,
        minutes: data.user,
        departmentAverage: data.department,
        day: format(parseISO(date), "EEE") // Mon, Tue...
    }));


    return NextResponse.json({
        kpis: {
            booksRead: totalBooksRead,
            minutesRead: totalMinutesRead,
            streak,
        },
        heatmap: heatmapData.map(h => ({ 
          date: h.date, 
          count: h.count,
          value: h.value 
        })),
        weeklyTrends
    });

  } catch (error: any) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 },
    );
  }
}
