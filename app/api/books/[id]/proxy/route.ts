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
    // Include ASPIRANT so pre-admission users can preview books too
    const authCheck = await requireRole(["STUDENT", "ADMIN", "FACULTY REP", "ASPIRANT"]);
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

    const fileUrl = book.fileUrl;

    // Handle B2 files
    if (fileUrl.includes("backblazeb2.com") || fileUrl.includes("univault-books")) {
      // Always re-authorize — tokens expire and the singleton is unreliable
      await authorizeB2();

      const url = new URL(fileUrl);

      // Extract the file name (everything after the bucket name in the path)
      const parts = url.pathname.split("/");
      const bucketIndex = parts.indexOf("univault-books");
      const rawFileName = (bucketIndex !== -1 && bucketIndex + 1 < parts.length)
        ? parts.slice(bucketIndex + 1).join("/")
        : parts.pop() || "";

      // Decode the file name for use with B2's getDownloadAuthorization
      const decodedFileName = decodeURIComponent(rawFileName);

      const { data: auth } = await b2.getDownloadAuthorization({
        bucketId: process.env.B2_BUCKET_ID!,
        fileNamePrefix: decodedFileName,
        validDurationInSeconds: 60 * 60,
      });

      // Re-encode path segments individually so special chars (spaces, commas) are safe
      const decodedPath = decodeURIComponent(url.pathname);
      url.pathname = decodedPath.split("/").map(encodeURIComponent).join("/");
      url.searchParams.set("Authorization", auth.authorizationToken);
      const signedUrl = url.toString();

      // Forward Range header for byte-range (PDF page-by-page loading)
      const requestHeaders = new Headers();
      if (req.headers.has("Range")) {
        requestHeaders.set("Range", req.headers.get("Range")!);
      }

      const response = await fetch(signedUrl, { headers: requestHeaders });

      if (!response.ok && response.status !== 206) {
        console.error(
          `[proxy] B2 fetch failed: ${response.status} ${response.statusText}`,
          `\nURL: ${signedUrl.substring(0, 100)}...`
        );
        return NextResponse.json(
          { error: `Storage fetch failed: ${response.status}` },
          { status: response.status }
        );
      }

      const responseHeaders = new Headers();
      responseHeaders.set(
        "Content-Type",
        response.headers.get("Content-Type") || "application/pdf"
      );

      const headersToForward = [
        "Content-Length",
        "Content-Range",
        "Accept-Ranges",
        "ETag",
        "Last-Modified",
      ];
      for (const header of headersToForward) {
        if (response.headers.has(header)) {
          responseHeaders.set(header, response.headers.get(header)!);
        }
      }

      responseHeaders.set("Cache-Control", "private, max-age=3600");

      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    // Non-B2 URLs — just redirect
    return NextResponse.redirect(fileUrl);
  } catch (err: any) {
    console.error("[proxy] Unhandled error:", err?.message ?? err);
    return NextResponse.json(
      { error: "Internal server error", detail: err?.message },
      { status: 500 }
    );
  }
}
