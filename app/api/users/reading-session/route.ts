// /app/api/user/logReadingSession/route.ts

import { db } from "@/database/drizzle";
import { eq, and, gte } from "drizzle-orm";
import { NextRequest } from "next/server";
import { readingSessions, users } from "@/database/schema";
import { format, startOfDay, subDays } from "date-fns";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    // @ts-ignore
    .where(eq(users.clerkId, userId));
  const id = user.id;
  const { bookId, pagesRead, duration } = await req.json();
  console.log({ bookId, pagesRead, duration });
  const today = new Date().toISOString().split("T")[0];

  // Check if a session for today already exists
  const existing = await db
    .select()
    .from(readingSessions)
    .where(
      and(
        eq(readingSessions.userId, id),
        eq(readingSessions.bookId, bookId),
        eq(readingSessions.date, today),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(readingSessions)
      .set({ pagesRead: existing[0].pagesRead + pagesRead })
      .where(eq(readingSessions.id, existing[0].id));
  } else {
    await db
      .insert(readingSessions)
      .values({ userId: id, bookId, date: today, pagesRead });
  }

  return new Response("Logged successfully", { status: 200 });
}
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId));
  const id = user.id;

  const today = startOfDay(new Date());
  const daysAgo = subDays(today, 6); // past 7 days including today

  try {
    const sessions = await db
      .select({
        date: readingSessions.createdAt,
        pagesRead: readingSessions.pagesRead,
      })
      .from(readingSessions)
      .where(
        and(
          eq(readingSessions.userId, id),
          gte(readingSessions.createdAt, daysAgo),
        ),
      );

    // Group by date (yyyy-mm-dd) and sum pagesRead
    const dailyTotals: Record<string, number> = {};

    sessions.forEach(
      ({ date, pagesRead }: { date: Date | null; pagesRead: number }) => {
        // @ts-ignore
        const dayKey = new Date(date).toISOString().split("T")[0]; // yyyy-mm-dd
        dailyTotals[dayKey] = (dailyTotals[dayKey] || 0) + pagesRead;
      },
    );
    console.log(dailyTotals);
    const result = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(today, 6 - i);
      const key = format(date, "yyyy-MM-dd");
      return {
        date: key,
        pagesRead: dailyTotals[key] || 0,
      };
    });
    console.log(result);

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error("GET reading session error:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}
