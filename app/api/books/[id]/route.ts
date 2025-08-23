import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import {db} from "@/database/drizzle";
import { books } from "@/database/schema";

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

        return NextResponse.json(result[0], { status: 200 });
    } catch (error) {
        console.error("Error fetching book:", error);
        return NextResponse.json(
            { error: "Failed to fetch book" },
            { status: 500 }
        );
    }
}
