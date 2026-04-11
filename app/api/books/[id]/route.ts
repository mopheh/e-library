import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { authorizeB2, b2 } from "@/lib/utils";

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

    if (fileUrl && (fileUrl.includes("backblazeb2.com") || fileUrl.includes("univault-books"))) {
      try {
        await authorizeB2();
        
        const url = new URL(fileUrl);
        const parts = url.pathname.split("/");
        
        // Find the index after the bucket name (univault-books)
        const bucketIndex = parts.indexOf("univault-books");
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
