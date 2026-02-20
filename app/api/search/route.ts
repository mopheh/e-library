import { db } from "@/database/drizzle";
import { books, courses } from "@/database/schema";
import { ilike, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ books: [], courses: [] });
    }

    const searchPattern = `%${query}%`;

    // Parallel queries for better performance
    const [booksRel, coursesRel] = await Promise.all([
      db
        .select({
          id: books.id,
          title: books.title,
          type: books.type,
          description: books.description,
          fileUrl: books.fileUrl,
        })
        .from(books)
        .where(
          or(
            ilike(books.title, searchPattern),
            ilike(books.description, searchPattern)
          )
        )
        .limit(5),

      db
        .select({
          id: courses.id,
          title: courses.title,
          code: courses.courseCode,
        })
        .from(courses)
        .where(
          or(
            ilike(courses.title, searchPattern),
            ilike(courses.courseCode, searchPattern)
          )
        )
        .limit(5),
    ]);

    return NextResponse.json({
      books: booksRel,
      courses: coursesRel,
    });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
