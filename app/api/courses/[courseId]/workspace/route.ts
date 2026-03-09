import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { books, bookCourses, courses, threads, users, questions } from "@/database/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

    const courseDetails = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!courseDetails.length) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const courseBooks = await db
      .select({
        id: books.id,
        title: books.title,
        description: books.description,
        type: books.type,
        fileUrl: books.fileUrl,
        createdAt: books.createdAt,
        postedBy: {
          id: users.id,
          fullName: users.fullName,
        }
      })
      .from(books)
      .innerJoin(bookCourses, eq(books.id, bookCourses.bookId))
      .leftJoin(users, eq(books.postedBy, users.id))
      .where(eq(bookCourses.courseId, courseId))
      .orderBy(desc(books.createdAt));

    const courseThreads = await db
      .select({
        id: threads.id,
        title: threads.title,
        content: threads.content,
        createdAt: threads.createdAt,
        author: {
          id: users.id,
          fullName: users.fullName,
        }
      })
      .from(threads)
      .leftJoin(users, eq(threads.authorId, users.id))
      .where(eq(threads.courseId, courseId))
      .orderBy(desc(threads.createdAt));

    const questionsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(questions)
      .where(eq(questions.courseId, courseId));

    return NextResponse.json({
      course: courseDetails[0],
      materials: courseBooks,
      threads: courseThreads,
      questionsCount: questionsCount[0]?.count ?? 0,
    });
  } catch (error) {
    console.error("[GET /api/courses/[courseId]/workspace]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
