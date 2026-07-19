import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { books, departments, faculty } from "@/database/schema";
import { eq, sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    const authCheck = await requireRole(["ADMIN"]);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const [byDepartment, byType, [{ total }]] = await Promise.all([
      db
        .select({
          departmentId: departments.id,
          departmentName: departments.name,
          facultyId: departments.facultyId,
          facultyName: faculty.name,
          bookCount: sql<number>`count(${books.id})::int`,
        })
        .from(departments)
        .leftJoin(faculty, eq(departments.facultyId, faculty.id))
        .leftJoin(books, eq(books.departmentId, departments.id))
        .groupBy(departments.id, departments.name, departments.facultyId, faculty.name)
        .orderBy(sql`count(${books.id}) asc`, departments.name),

      db
        .select({ type: books.type, count: sql<number>`count(*)::int` })
        .from(books)
        .groupBy(books.type)
        .orderBy(sql`count(*) desc`),

      db.select({ total: sql<number>`count(*)::int` }).from(books),
    ]);

    const departmentsWithZero = byDepartment.filter((d) => d.bookCount === 0);

    return NextResponse.json({
      totalBooks: total,
      totalDepartments: byDepartment.length,
      departmentsWithZero: departmentsWithZero.length,
      departmentsCovered: byDepartment.length - departmentsWithZero.length,
      byDepartment,
      byType,
    });
  } catch (error) {
    console.error("[GET /api/admin/materials]", error);
    return NextResponse.json({ error: "Failed to fetch materials overview" }, { status: 500 });
  }
}
