import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  bookCourses,
  books,
  courses,
  jobs,
  users,
} from "@/database/schema";
import { db } from "@/database/drizzle";
import { and, eq, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { requireRole } from "@/lib/auth";

const bookSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  departmentId: z.string().uuid("Department ID must be a valid UUID"),
  type: z.enum(["TEXTBOOK", "PAST_QUESTION", "SUMMARY", "HANDOUT"]),
  courseIds: z.array(z.string().uuid()).optional().default([]),
  fileUrl: z.string().url("File URL must be a valid URL"),
  fileSize: z.number().optional().default(0),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const departmentId = searchParams.get("departmentId");
    const courseId = searchParams.get("courseId");
    const type = searchParams.get("type");
    const level = searchParams.get("level");

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "12");

    if (!departmentId) {
      return NextResponse.json(
        { error: "departmentId is required" },
        { status: 400 },
      );
    }

    const conditions = [eq(books.departmentId, departmentId)];

    if (type) conditions.push(eq(books.type, type));
    if (courseId) conditions.push(eq(bookCourses.courseId, courseId));
    if (level) {
      conditions.push(eq(courses.level, level));
    }

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(books)
      .leftJoin(bookCourses, eq(books.id, bookCourses.bookId))
      .leftJoin(courses, eq(bookCourses.courseId, courses.id))
      .where(and(...conditions));

    const count = Number(countResult?.[0]?.count ?? 0);

    const booksWithCourses = await db
      .select({
        id: books.id,
        title: books.title,
        description: books.description,
        createdAt: books.createdAt,
        type: books.type,
        fileUrl: books.fileUrl,
        fileSize: books.fileSize,
        course: courses.courseCode,
        level: courses.level,
      })
      .from(books)
      .leftJoin(bookCourses, eq(books.id, bookCourses.bookId))
      .leftJoin(courses, eq(bookCourses.courseId, courses.id))
      .where(and(...conditions))
      .orderBy(desc(books.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return NextResponse.json({
      books: booksWithCourses,
      page,
      pageSize,
      total: count,
      totalPages: Math.ceil(count / pageSize),
    });
  } catch (error) {
    console.error("[GET /api/books]", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    // Only ADMIN or FACULTY REP can upload materials
    const authCheck = await requireRole(["ADMIN", "FACULTY REP"]);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const user = authCheck.user!;

    const result = bookSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.errors },
        { status: 400 },
      );
    }
    const { title, description, departmentId, type, courseIds, fileUrl, fileSize } = result.data;

    const [createdBook] = await db
      .insert(books)
      .values({
        title,
        description: description ?? null,
        departmentId,
        type,
        fileUrl,
        fileSize,
        postedBy: user.id,
        parseStatus: "processing",
      })
      .returning();

    if (courseIds.length) {
      const courseLinks = courseIds.map((courseId) => ({
        bookId: createdBook.id,
        courseId,
      }));
      await db.insert(bookCourses).values(courseLinks);
    }

    // Trigger background parsing job
    await db.insert(jobs).values({
      type: "parse_book",
      payload: { bookId: createdBook.id },
    });

    return NextResponse.json(createdBook, { status: 201 });
  } catch (error) {
    console.error("[POST /api/books]", error);
    return NextResponse.json(
      { error: "Failed to create book" },
      { status: 500 },
    );
  }
}
