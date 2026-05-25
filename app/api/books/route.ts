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
import { and, eq, sql, desc, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { requireRole } from "@/lib/auth";

const bookSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  departmentId: z.string().uuid("Department ID must be a valid UUID"),
  type: z.string().min(1, "Type is required"),
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
    const search = searchParams.get("search");

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "12");

    if (!departmentId && !search) {
      return NextResponse.json(
        { error: "departmentId or search is required" },
        { status: 400 },
      );
    }

    // Build WHERE conditions on books itself (no JOIN-multiplied columns here)
    const bookConditions = [];
    if (departmentId) bookConditions.push(eq(books.departmentId, departmentId));
    if (type) bookConditions.push(eq(books.type, type));
    if (search && search.trim().length >= 2) {
      const pattern = `%${search.trim()}%`;
      bookConditions.push(
        or(ilike(books.title, pattern), ilike(books.description, pattern))!
      );
    }

    // courseId / level filters require a join — handled via sub-select
    const hasCourseFilter = !!(courseId || level);

    // ── Count (use DISTINCT to avoid inflation from multiple courses) ──
    const countResult = await db
      .select({ count: sql<number>`count(distinct ${books.id})` })
      .from(books)
      .leftJoin(bookCourses, eq(books.id, bookCourses.bookId))
      .leftJoin(courses, eq(bookCourses.courseId, courses.id))
      .where(
        and(
          ...bookConditions,
          ...(courseId ? [eq(bookCourses.courseId, courseId)] : []),
          ...(level ? [eq(courses.level, level as any)] : []),
        )
      );

    const count = Number(countResult?.[0]?.count ?? 0);

    // ── Aggregated fetch — one row per book, courses as "EEE531, EEE533" ──
    const booksWithCourses = await db
      .select({
        id: books.id,
        title: books.title,
        description: books.description,
        type: books.type,
        departmentId: books.departmentId,
        fileUrl: books.fileUrl,
        fileSize: books.fileSize,
        createdAt: books.createdAt,
        // Aggregate all linked course codes into one comma-separated string
        course: sql<string>`string_agg(distinct ${courses.courseCode}, ', ' order by ${courses.courseCode})`,
        // Also keep the highest level for filtering purposes
        level: sql<string>`max(${courses.level})`,
      })
      .from(books)
      .leftJoin(bookCourses, eq(books.id, bookCourses.bookId))
      .leftJoin(courses, eq(bookCourses.courseId, courses.id))
      .where(
        and(
          ...bookConditions,
          ...(courseId ? [eq(bookCourses.courseId, courseId)] : []),
          ...(level ? [eq(courses.level, level as any)] : []),
        )
      )
      // GROUP BY every non-aggregated book column so Postgres is happy
      .groupBy(
        books.id,
        books.title,
        books.description,
        books.type,
        books.departmentId,
        books.fileUrl,
        books.fileSize,
        books.createdAt,
      )
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
        description: description ?? "",
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
