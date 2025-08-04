import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { books } from "@/database/schema";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const faculty = searchParams.get("faculty");
    const department = searchParams.get("department");
    const level = searchParams.get("level");
    const type = searchParams.get("type");

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "12");

    try {
        const conditions = [];

        if (faculty) conditions.push(eq(books.faculty, faculty));
        if (department) conditions.push(eq(books.department, department));
        if (level) conditions.push(eq(books.level, level));
        if (type && type !== "") conditions.push(eq(books.type, type));

        const whereClause = and(...conditions);

        // Get total count for pagination
        const [{ count }] = await db
            .select({ count: db.fn.count() })
            .from(books)
            .where(whereClause);

        // Get paginated data
        const results = await db
            .select()
            .from(books)
            .where(whereClause)
            .limit(pageSize)
            .offset((page - 1) * pageSize);

        return NextResponse.json({
            books: results,
            total: Number(count),
            page,
            pageSize,
            totalPages: Math.ceil(Number(count) / pageSize),
        });
    } catch (error) {
        console.error("Error fetching books:", error);
        return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
    }
}
