import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { courses, departments, questions, bookCourses, books } from "@/database/schema";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth";

// ── GET /api/admin/course-cbt/courses ──────────────────────────────────
// Course-level rollup for the admin CBT overview: question count per course
// plus source-material quality signals pulled from the book(s) that fed the
// AI generation pipeline for that course, since `questions` itself has no
// direct link back to the book/page it came from (only courseId).
export async function GET(req: Request) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const departmentId = searchParams.get("departmentId") || "";
  const level = searchParams.get("level") || "";
  const includeEmpty = searchParams.get("includeEmpty") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "50", 10));
  const offset = (page - 1) * limit;

  try {
    const conditions = [];
    if (departmentId) conditions.push(eq(courses.departmentId, departmentId));
    if (level) conditions.push(eq(courses.level, level as typeof courses.$inferSelect.level));
    if (search) {
      conditions.push(
        or(ilike(courses.courseCode, `%${search}%`), ilike(courses.title, `%${search}%`))
      );
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const questionCount = sql<number>`count(distinct ${questions.id})::int`;
    const havingClause = includeEmpty ? undefined : sql`count(distinct ${questions.id}) > 0`;

    const rows = await db
      .select({
        id: courses.id,
        courseCode: courses.courseCode,
        title: courses.title,
        level: courses.level,
        department: departments.name,
        questionCount,
        bookCount: sql<number>`count(distinct ${bookCourses.bookId})::int`,
        hasPendingBook: sql<boolean>`bool_or(${books.reviewStatus} = 'PENDING')`,
        hasNeedsReviewBook: sql<boolean>`bool_or(${books.needsReview})`,
        hasProcessingBook: sql<boolean>`bool_or(${books.parseStatus} in ('pending','parsing','processing','generating_questions'))`,
        latestQuestionAt: sql<string | null>`max(${questions.createdAt})`,
      })
      .from(courses)
      .innerJoin(departments, eq(departments.id, courses.departmentId))
      .leftJoin(questions, eq(questions.courseId, courses.id))
      .leftJoin(bookCourses, eq(bookCourses.courseId, courses.id))
      .leftJoin(books, eq(books.id, bookCourses.bookId))
      .where(whereClause)
      .groupBy(courses.id, courses.courseCode, courses.title, courses.level, departments.name)
      .having(havingClause)
      .orderBy(sql`${questionCount} desc`)
      .limit(limit)
      .offset(offset);

    // Total count for pagination - same filters, same having clause.
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(
        db
          .select({ id: courses.id })
          .from(courses)
          .innerJoin(departments, eq(departments.id, courses.departmentId))
          .leftJoin(questions, eq(questions.courseId, courses.id))
          .where(whereClause)
          .groupBy(courses.id)
          .having(havingClause)
          .as("filtered")
      );

    return NextResponse.json({
      success: true,
      courses: rows,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error("[GET /api/admin/course-cbt/courses]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
