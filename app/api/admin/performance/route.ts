import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireRole } from "@/lib/auth";
import { withCache } from "@/lib/redis";
import { performanceOverview } from "@/lib/student-performance";
import { parseFilters } from "./filters";

// Admin-only: cohort-level study patterns, CBT and CGPA
export async function GET(req: Request) {
  try {
    const authCheck = await requireRole(["ADMIN"]);
    if (!authCheck.authorized) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const parsed = parseFilters(new URL(req.url));
    if (!parsed.success) return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
    const f = parsed.data;

    const key = `admin:performance:${f.facultyId ?? "-"}:${f.departmentId ?? "-"}:${f.level ?? "-"}`;
    return NextResponse.json(await withCache(key, 180, () => performanceOverview(f)));
  } catch (error) {
    Sentry.captureException(error);
    console.error("[GET /api/admin/performance]", error);
    return NextResponse.json({ error: "Failed to load performance data" }, { status: 500 });
  }
}
