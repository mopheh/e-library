import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import {
  activities,
  bookCourses,
  books,
  courses,
  readingSessions,
  userBooks,
} from "@/database/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 6);

    const start = startDate.toISOString().slice(0, 10);
    const end = today.toISOString().slice(0, 10);

    const [bookCount, recentBooks, sessions, activity] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(userBooks)
        .where(eq(userBooks.userId, user.id)),

      db
        .select({
          id: books.id,
          title: books.title,
          description: books.description,
          createdAt: books.createdAt,
          type: books.type,
          fileUrl: books.fileUrl,
          course: courses.courseCode,
          level: courses.level,
        })
        .from(books)
        .leftJoin(bookCourses, eq(books.id, bookCourses.bookId))
        .leftJoin(courses, eq(bookCourses.courseId, courses.id))
        .where(
          and(
            eq(books.departmentId, user.departmentId),
            eq(courses.level, user.year),
          ),
        )
        .limit(12),

      db
        .select({
          date: readingSessions.date,
          pagesRead: readingSessions.pagesRead,
        })
        .from(readingSessions)
        .where(
          and(
            eq(readingSessions.userId, user.id),
            sql`${readingSessions.date} BETWEEN ${start} AND ${end}`,
          ),
        ),

      db
        .select({
          id: activities.id,
          type: activities.type,
          meta: activities.meta,
          createdAt: activities.createdAt,
          book: {
            id: books.id,
            title: books.title,
          },
        })
        .from(activities)
        .leftJoin(books, eq(activities.targetId, books.id))
        .where(eq(activities.userId, user.id))
        .orderBy(desc(activities.createdAt))
        .limit(10),
    ]);
    console.log(activity);
    return NextResponse.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        departmentId: user.departmentId,
        year: user.year,
      },
      stats: {
        bookCount: bookCount[0]?.count ?? 0,
      },
      books: recentBooks,
      readingSessions: sessions,
      activities: activity,
    });
  } catch (error) {
    console.error("[GET /api/dashboard]", error);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 },
    );
  }
}
