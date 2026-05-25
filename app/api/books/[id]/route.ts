import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { books, bookCourses, userBooks, readingSessions, bookPages, annotations } from "@/database/schema";
import { authorizeB2, b2 } from "@/lib/utils";
import { requireRole } from "@/lib/auth";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await context.params;

    // Fetch book by ID
    const result = await db
      .select()
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    let book = result[0];
    const fileUrl = book.fileUrl;
    const bucketName = process.env.B2_BUCKET || "univault-books";

    if (fileUrl && (fileUrl.includes("backblazeb2.com") || fileUrl.includes(bucketName))) {
      try {
        await authorizeB2();
        
        const url = new URL(fileUrl);
        const parts = url.pathname.split("/");
        
        // Find the index after the bucket name
        const bucketIndex = parts.indexOf(bucketName);
        const fileName = (bucketIndex !== -1 && bucketIndex + 1 < parts.length)
          ? parts.slice(bucketIndex + 1).join("/")
          : parts.pop() || "";

        const { data: auth } = await b2.getDownloadAuthorization({
          bucketId: process.env.B2_BUCKET_ID!,
          fileNamePrefix: fileName,
          validDurationInSeconds: 60 * 60,
        });

        // Use URLSearchParams for reliable query param management
        url.searchParams.set("Authorization", auth.authorizationToken);
        
        book = {
          ...book,
          fileUrl: url.toString(),
        };
      } catch (error) {
        console.error("B2 Signing error:", error);
      }
    }
    
    return NextResponse.json(book, { status: 200 });
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json(
      { error: "Failed to fetch book" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(["ADMIN", "FACULTY REP"]);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id: bookId } = await context.params;
    const body = await req.json();
    const { title, description, type, courseIds } = body;

    const [existing] = await db.select().from(books).where(eq(books.id, bookId)).limit(1);
    if (!existing) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    // Update core metadata
    await db.update(books).set({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(type !== undefined && { type }),
    }).where(eq(books.id, bookId));

    // Re-link courses if provided
    if (Array.isArray(courseIds)) {
      await db.delete(bookCourses).where(eq(bookCourses.bookId, bookId));
      if (courseIds.length > 0) {
        await db.insert(bookCourses).values(
          courseIds.map((courseId: string) => ({ bookId, courseId }))
        );
      }
    }

    return NextResponse.json({ message: "Book updated successfully" });
  } catch (error: any) {
    console.error("[PUT /api/books/:id]", error);
    return NextResponse.json({ error: error?.message || "Failed to update book" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(["ADMIN", "FACULTY REP"]);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id: bookId } = await context.params;

    const [existing] = await db.select().from(books).where(eq(books.id, bookId)).limit(1);
    if (!existing) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    // Delete non-cascading relations first
    await db.delete(userBooks).where(eq(userBooks.bookId, bookId));
    await db.delete(readingSessions).where(eq(readingSessions.bookId, bookId));
    await db.delete(bookCourses).where(eq(bookCourses.bookId, bookId));
    await db.delete(bookPages).where(eq(bookPages.bookId, bookId));
    await db.delete(annotations).where(eq(annotations.bookId, bookId));
    await db.delete(books).where(eq(books.id, bookId));

    return NextResponse.json({ message: "Book deleted successfully" });
  } catch (error: any) {
    console.error("[DELETE /api/books/:id]", error);
    return NextResponse.json({ error: error?.message || "Failed to delete book" }, { status: 500 });
  }
}
