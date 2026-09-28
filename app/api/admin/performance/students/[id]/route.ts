import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireRole } from "@/lib/auth";
import { studentPerformanceDetail } from "@/lib/student-performance";

// Admin-only: one student's CGPA, study history, CBT and readiness
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authCheck = await requireRole(["ADMIN"]);
    if (!authCheck.authorized) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const detail = await studentPerformanceDetail(id);
    if (!detail) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    return NextResponse.json(detail);
  } catch (error) {
    Sentry.captureException(error);
    console.error("[GET /api/admin/performance/students/[id]]", error);
    return NextResponse.json({ error: "Failed to load student" }, { status: 500 });
  }
}
