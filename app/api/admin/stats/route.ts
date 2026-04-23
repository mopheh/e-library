import { db } from "@/database/drizzle";
import { users, courses, books, readingSessions, departments, faculty, sessions } from "@/database/schema";
import { count, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    // Only ADMIN can see global stats
    const authCheck = await requireRole(["ADMIN"]);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    // Parallelize queries for performance
    const [
      userCount,
      courseCount,
      materialCount,
      departmentCount,
      facultyCount,
      readingStats,
      cbtStats
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(courses),
      db.select({ count: count() }).from(books),
      db.select({ count: count() }).from(departments),
      db.select({ count: count() }).from(faculty),
      db.select({ 
        totalSessions: count(), 
        totalDuration: sql<number>`coalesce(sum(${readingSessions.duration}), 0)` 
      }).from(readingSessions),
      db.select({ count: count() }).from(sessions)
    ]);

    return NextResponse.json({
        users: userCount[0].count,
        courses: courseCount[0].count,
        materials: materialCount[0].count,
        departments: departmentCount[0].count,
        faculties: facultyCount[0].count,
        totalReadingMinutes: Number(readingStats[0].totalDuration || 0),
        cbtUsage: cbtStats[0].count, 
        revenue: 0 // Placeholder
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
