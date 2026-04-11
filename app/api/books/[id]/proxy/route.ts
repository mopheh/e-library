import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { eq } from "drizzle-orm";
import { authorizeB2, b2 } from "@/lib/utils";
import { requireRole } from "@/lib/auth";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(["STUDENT", "ADMIN", "FACULTY REP"]);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id: bookId } = await context.params;
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (!book || !book.fileUrl) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    await authorizeB2();

    const fileUrl = book.fileUrl;
    
    // Handle B2 specifically
    if (fileUrl.includes("backblazeb2.com") || fileUrl.includes("univault-books")) {
      const url = new URL(fileUrl);
      const parts = url.pathname.split("/");
      const bucketIndex = parts.indexOf("univault-books");
      const fileName = (bucketIndex !== -1 && bucketIndex + 1 < parts.length)
        ? parts.slice(bucketIndex + 1).join("/")
        : parts.pop() || "";

      const { data: auth } = await b2.getDownloadAuthorization({
        bucketId: process.env.B2_BUCKET_ID!,
        fileNamePrefix: fileName,
        validDurationInSeconds: 60 * 60,
      });

      const signedUrl = `${fileUrl}?Authorization=${auth.authorizationToken}`;
      
      // Pass through relevant headers like 'Range' for byte-serving
      const requestHeaders = new Headers();
      if (req.headers.has("Range")) {
        requestHeaders.set("Range", req.headers.get("Range")!);
      }

      const response = await fetch(signedUrl, { headers: requestHeaders });
      
      if (!response.ok && response.status !== 206) {
        return NextResponse.json({ error: "Failed to fetch from storage" }, { status: response.status });
      }

      // Proxy the content
      const responseHeaders = new Headers();
      responseHeaders.set("Content-Type", response.headers.get("Content-Type") || "application/pdf");
      
      // Forward headers relevant for byte-serving and performance
      const headersToForward = [
        "Content-Length",
        "Content-Range",
        "Accept-Ranges",
        "ETag",
        "Last-Modified"
      ];

      for (const header of headersToForward) {
        if (response.headers.has(header)) {
          responseHeaders.set(header, response.headers.get(header)!);
        }
      }

      // Add caching for performance
      responseHeaders.set("Cache-Control", "public, max-age=3600");

      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    // If not B2, just redirect or proxy normally
    return NextResponse.redirect(fileUrl);
  } catch (err: any) {
    console.error("Proxy error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
