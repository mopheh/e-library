import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { candidateProfiles, candidateAttempts, users, departments } from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [user] = await db.select().from(users).where(eq(users.clerkId, userId));
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const [profile] = await db
      .select()
      .from(candidateProfiles)
      .where(eq(candidateProfiles.userId, user.id));

    const attempts = await db
      .select()
      .from(candidateAttempts)
      .where(eq(candidateAttempts.userId, user.id))
      .orderBy(desc(candidateAttempts.completedAt))
      .limit(20);

    const completedAttempts = attempts.filter((a) => a.completedAt !== null);
    const totalAttempts = completedAttempts.length;
    const averageScore =
      totalAttempts > 0
        ? Math.round(
            completedAttempts.reduce((acc, a) => {
              const pct = a.score !== null && a.totalQuestions > 0 ? (a.score / a.totalQuestions) * 100 : 0;
              return acc + pct;
            }, 0) / totalAttempts,
          )
        : 0;

    const bestScore =
      totalAttempts > 0
        ? Math.round(
            Math.max(
              ...completedAttempts.map((a) =>
                a.score !== null && a.totalQuestions > 0 ? (a.score / a.totalQuestions) * 100 : 0,
              ),
            ),
          )
        : 0;

    // Calculate streak: count consecutive days of activity ending today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attemptDates = [
      ...new Set(
        completedAttempts
          .filter((a) => a.completedAt)
          .map((a) => {
            const d = new Date(a.completedAt!);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
          }),
      ),
    ].sort((a, b) => b - a);

    let streak = 0;
    let expectedDate = today.getTime();
    for (const dateTs of attemptDates) {
      if (dateTs === expectedDate) {
        streak++;
        expectedDate -= 86400000;
      } else if (dateTs < expectedDate) {
        break;
      }
    }

    let intendedDepartmentId = profile?.intendedDepartmentId ?? user.departmentId ?? null;
    let subjectCombinations = (profile?.subjectCombinations as string[]) ?? [];

    if (subjectCombinations.length === 0 && intendedDepartmentId) {
      const [dept] = await db.select().from(departments).where(eq(departments.id, intendedDepartmentId));
      if (dept) {
         const { getSubjectCombination } = await import("@/lib/subjectCombinations");
         const combo = getSubjectCombination(dept.name);
         if (combo) {
            subjectCombinations = combo.jamb;
         }
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalAttempts,
        averageScore,
        bestScore,
        streak,
        intendedDepartmentId,
        subjectCombinations,
        recentAttempts: completedAttempts.slice(0, 5).map((a) => ({
          id: a.id,
          score: a.score,
          totalQuestions: a.totalQuestions,
          completedAt: a.completedAt,
        })),
      },
    });
  } catch (error) {
    console.error("[GET /api/aspirant/stats]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
