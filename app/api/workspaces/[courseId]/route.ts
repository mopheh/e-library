// app/api/workspaces/[courseId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import {
  books,
  bookCourses,
  courses,
  questions,
  bookPages,
} from "@/database/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

    // 1. Fetch course details
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // 2. Fetch all books linked to this course, with their parse status
    const linkedBooks = await db
      .select({
        id: books.id,
        title: books.title,
        description: books.description,
        type: books.type,
        departmentId: books.departmentId,
        fileUrl: books.fileUrl,
        fileSize: books.fileSize,
        pageCount: books.pageCount,
        parseStatus: books.parseStatus,
        createdAt: books.createdAt,
      })
      .from(books)
      .innerJoin(bookCourses, eq(books.id, bookCourses.bookId))
      .where(eq(bookCourses.courseId, courseId))
      .orderBy(books.createdAt);

    // 3. Count AI-indexed pages across all books in this workspace
    const bookIds = linkedBooks.map((b) => b.id);
    let indexedPagesCount = 0;
    if (bookIds.length > 0) {
      const pageCounts = await Promise.all(
        bookIds.map((bid) =>
          db
            .select({ count: sql<number>`count(*)` })
            .from(bookPages)
            .where(eq(bookPages.bookId, bid))
        )
      );
      indexedPagesCount = pageCounts.reduce(
        (sum, r) => sum + Number(r[0]?.count ?? 0),
        0
      );
    }

    // 4. Count MCQ questions for this course
    const [questionsRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(questions)
      .where(eq(questions.courseId, courseId));
    const questionsCount = Number(questionsRow?.count ?? 0);

    // 5. Group books by type
    const materialsByType: Record<string, typeof linkedBooks> = {};
    for (const book of linkedBooks) {
      const type = book.type || "Material";
      if (!materialsByType[type]) materialsByType[type] = [];
      materialsByType[type].push(book);
    }

    return NextResponse.json({
      course,
      books: linkedBooks,
      materialsByType,
      stats: {
        totalBooks: linkedBooks.length,
        indexedPages: indexedPagesCount,
        questionsCount,
        aiReady: indexedPagesCount > 0,
      },
    });
  } catch (error) {
    console.error("[GET /api/workspaces/[courseId]]", error);
    return NextResponse.json(
      { error: "Failed to fetch workspace" },
      { status: 500 }
    );
  }
}
