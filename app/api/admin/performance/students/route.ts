import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireRole } from "@/lib/auth";
import { performanceStudents, type StudentSort } from "@/lib/student-performance";
import { parseFilters } from "../filters";

const SORTS: StudentSort[] = ["name", "cgpa", "minutes", "cbt", "lastActive", "risk"];

// Admin-only: per-student performance list (search, sort, at-risk filter)
export async function GET(req: Request) {
  try {
    const authCheck = await requireRole(["ADMIN"]);
    if (!authCheck.authorized) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const url = new URL(req.url);
    const parsed = parseFilters(url);
    if (!parsed.success) return NextResponse.json({ error: "Invalid filters" }, { status: 400 });

    const sortParam = url.searchParams.get("sort") as StudentSort | null;
    return NextResponse.json(
      await performanceStudents({
        ...parsed.data,
        search: url.searchParams.get("search")?.slice(0, 100),
        atRisk: url.searchParams.get("atRisk") === "1",
        sort: sortParam && SORTS.includes(sortParam) ? sortParam : "risk",
        dir: url.searchParams.get("dir") === "asc" ? "asc" : "desc",
        page: Number(url.searchParams.get("page")) || 1,
        pageSize: Number(url.searchParams.get("pageSize")) || 25,
      }),
    );
  } catch (error) {
    Sentry.captureException(error);
    console.error("[GET /api/admin/performance/students]", error);
    return NextResponse.json({ error: "Failed to load students" }, { status: 500 });
  }
}
