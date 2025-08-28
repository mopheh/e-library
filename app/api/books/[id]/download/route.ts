import { NextResponse } from "next/server";
import {authorizeB2, b2} from "../../route";
import {db} from "@/database/drizzle";
import { books } from "@/database/schema";
import {eq} from "drizzle-orm";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        await authorizeB2();

        const { id: bookId } = await context.params;
        const [book] = await db
            .select()
            .from(books)
            .where(eq(books.id, bookId))
            .limit(1);
        if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

        const fileUrl = book.fileUrl!;
        const parts = fileUrl.split("/");
        const fileName = parts.slice(parts.indexOf("univault-books") + 1).join("/");

        const { data: auth } = await b2.getDownloadAuthorization({
            bucketId: process.env.B2_BUCKET_ID!,
            fileNamePrefix: fileName,
            validDurationInSeconds: 60 * 60,
        });

        const signedUrl = `${fileUrl}?Authorization=${auth.authorizationToken}`;

        return NextResponse.json({ url: signedUrl });
    } catch (err: any) {
        console.error("Download error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
