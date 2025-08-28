import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { authorizeB2, b2 } from "@/app/api/books/route";

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
    const fileUrl = book.fileUrl!;
    if (fileUrl.includes("backblazeb2.com")) {
      await authorizeB2();
      const parts = fileUrl.split("/");
      const fileName = parts
        .slice(parts.indexOf("univault-books") + 1)
        .join("/");

      const { data: auth } = await b2.getDownloadAuthorization({
        bucketId: process.env.B2_BUCKET_ID!,
        fileNamePrefix: fileName,
        validDurationInSeconds: 60 * 60,
      });
      const originalUrl = fileUrl;
      const url = new URL(originalUrl);

      const parrts = url.pathname.split("/");
      const newFileName = parrts.pop()!;

      const safeFileName = encodeURIComponent(
        decodeURIComponent(newFileName)
      ).replace(/%20/g, "+");

      url.pathname = [...parrts, safeFileName].join("/");

      const safeUrl = url.toString();
      console.log(safeUrl);
      const signedUrl = `${safeUrl}?Authorization=${auth.authorizationToken}`;
      console.log(signedUrl);
      book = {
        ...book,
        fileUrl: signedUrl,
      };
      return NextResponse.json(book, { status: 200 });
    }
    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json(
      { error: "Failed to fetch book" },
      { status: 500 }
    );
  }
}
