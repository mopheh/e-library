import { db } from "@/database/drizzle";
import { studyLogs } from "@/database/schema";
import { and, eq, gte, sql } from "drizzle-orm";

/**
 * A user's self-reported study, per day. Merged into their *personal* stats
 * (streak, minutes, heatmap, goals) - never the leaderboard, which only
 * ranks verified in-app reading.
 */
export function manualStudyByDate(userId: string, since?: string) {
  return db
    .select({
      date: studyLogs.date,
      sessions: sql<number>`sum(${studyLogs.timesRead})`,
      minutes: sql<number>`coalesce(sum(${studyLogs.minutes}), 0)`,
    })
    .from(studyLogs)
    .where(since ? and(eq(studyLogs.userId, userId), gte(studyLogs.date, since)) : eq(studyLogs.userId, userId))
    .groupBy(studyLogs.date);
}
