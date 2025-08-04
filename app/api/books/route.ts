import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
// import { bookSchema } from "@/components/AddBook";
import { bookCourses, books, courses, users } from "@/database/schema"
import { z } from "zod"
import { db } from "@/database/drizzle"
import { and, eq, sql } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const departmentId = searchParams.get("departmentId")
    const courseId = searchParams.get("courseId")
    const type = searchParams.get("type")
    const level = searchParams.get("level")

    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "12")

    // Early exit if departmentId is missing
    if (!departmentId) {
      return NextResponse.json(
        { error: "departmentId is required" },
        { status: 400 }
      )
    }

    // Base where clause
    const conditions = [eq(books.departmentId, departmentId)]

    if (type) conditions.push(eq(books.type, type))
    if (courseId) conditions.push(eq(bookCourses.courseId, courseId))
    if (level) {
      // @ts-ignore
      conditions.push(eq(courses.level, level))
    }

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(books)
      .leftJoin(bookCourses, eq(books.id, bookCourses.bookId))
      .leftJoin(courses, eq(bookCourses.courseId, courses.id))
      .where(and(...conditions))

    const count = Number(countResult?.[0]?.count ?? 0)
    // Get paginated data
    const booksWithCourses = await db
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
      .where(and(...conditions))
      .leftJoin(bookCourses, eq(books.id, bookCourses.bookId))
      .leftJoin(courses, eq(bookCourses.courseId, courses.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize)

    return NextResponse.json({
      books: booksWithCourses,
      page,
      pageSize,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / pageSize),
    })
  } catch (error) {
    console.error("[GET /api/books]", error)
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    )
  }
}
export async function POST(req: NextRequest, res: NextResponse) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
    console.log(user)
    const body = await req.json()
    // const validated = bookSchema.safeParse(body);
    // if (!validated.success) {
    //   return NextResponse.json(
    //     { error: "Invalid Data", details: validated.error.flatten() },
    //     { status: 400 },
    //   );
    // }

    const { title, description, departmentId, courseIds, fileUrl, type } = body

    const [createdBook] = await db
      .insert(books)
      .values({
        title,
        description,
        departmentId,
        type,
        fileUrl,
        postedBy: user.id,
      })
      .returning()

    const courseLinks = courseIds.map((courseId: any) => ({
      bookId: createdBook.id,
      courseId: courseId,
    }))

    await db.insert(bookCourses).values(courseLinks)
    return NextResponse.json(createdBook, { status: 201 })
  } catch (error) {
    console.error("[POST /api/books]", error)
    return NextResponse.json(
      { error: "Failed to create book" },
      { status: 500 }
    )
  }
}
