import { db } from "@/database/drizzle";
import { readingSessions, users } from "@/database/schema";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { desc, eq, and, gte, sql } from "drizzle-orm";
import { subDays, format } from "date-fns";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({ id: users.id, firstName: users.fullName })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Heuristic-based "AI" insights
    const insights: string[] = [];
    
    // 1. Analyze recent activity vs previous
    const sevenDaysAgo = subDays(new Date(), 7);
    const fourteenDaysAgo = subDays(new Date(), 14);

    const thisWeekSessions = await db
      .select({ duration: readingSessions.duration })
      .from(readingSessions)
      .where(and(
        eq(readingSessions.userId, user.id),
        gte(readingSessions.date, format(sevenDaysAgo, "yyyy-MM-dd"))
      ));

    const lastWeekSessions = await db
      .select({ duration: readingSessions.duration })
      .from(readingSessions)
      .where(and(
        eq(readingSessions.userId, user.id),
        gte(readingSessions.date, format(fourteenDaysAgo, "yyyy-MM-dd")),
        sql`${readingSessions.date} < ${format(sevenDaysAgo, "yyyy-MM-dd")}`
      ));

    const thisWeekMinutes = thisWeekSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const lastWeekMinutes = lastWeekSessions.reduce((acc, s) => acc + (s.duration || 0), 0);

    if (thisWeekMinutes > lastWeekMinutes && lastWeekMinutes > 0) {
        const increase = Math.round(((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100);
        insights.push(`Great job! You've read ${increase}% more this week compared to last week.`);
    } else if (thisWeekMinutes < lastWeekMinutes) {
        insights.push(`You're reading a bit less this week. Try to squeeze in 10 minutes today!`);
    } else if (thisWeekMinutes === 0) {
        insights.push(`It looks like you haven't read much this week. A snippet a day keeps the brain sharp!`);
    }

    // 2. Time of day analysis (if we had timestamp, but readingSessions has date... wait, created_at has time)
    // Actually readingSessions has duration and optional startTime if we added it, but schema has createdAt.
    // Let's check recent sessions created_at
    const recentSessions = await db.select({ createdAt: readingSessions.createdAt }).from(readingSessions).where(eq(readingSessions.userId, user.id)).limit(10);
    
    const morningCount = recentSessions.filter(s => {
        const h = new Date(s.createdAt!).getHours();
        return h >= 5 && h < 12;
    }).length;
    
    const eveningCount = recentSessions.filter(s => {
        const h = new Date(s.createdAt!).getHours();
        return h >= 17 && h < 24;
    }).length;

    if (morningCount > eveningCount) {
        insights.push(`You seem to be a morning reader. Consider scheduling your reading sessions with your morning coffee.`);
    } else if (eveningCount > morningCount) {
        insights.push(`You prefer reading in the evenings. It's a great way to unwind before bed.`);
    }

    // 3. Generic motivation
    if (insights.length < 2) {
        insights.push(`"A reader lives a thousand lives before he dies." - George R.R. Martin`);
    }

    return NextResponse.json({ insights });
  } catch (error: any) {
    console.error("AI Insights fetch error:", error);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
