import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { examSchedules, faculty } from "@/database/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireRole } from "@/lib/auth";

// GET – list exam schedules, optionally by session/semester/faculty
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const session = searchParams.get("session");
    const semester = searchParams.get("semester");
    const facultyId = searchParams.get("facultyId");

    const conditions: any[] = [];
    if (session) conditions.push(eq(examSchedules.session, session));
    if (semester) conditions.push(eq(examSchedules.semester, semester));
    if (facultyId) conditions.push(eq(examSchedules.facultyId, facultyId));

    const schedules = await db
      .select({
        id: examSchedules.id,
        facultyId: examSchedules.facultyId,
        facultyName: faculty.name,
        calendarEventId: examSchedules.calendarEventId,
        session: examSchedules.session,
        semester: examSchedules.semester,
        examDate: examSchedules.examDate,
        startTime: examSchedules.startTime,
        endTime: examSchedules.endTime,
        venue: examSchedules.venue,
        notes: examSchedules.notes,
        createdAt: examSchedules.createdAt,
      })
      .from(examSchedules)
      .leftJoin(faculty, eq(faculty.id, examSchedules.facultyId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(examSchedules.examDate);

    return NextResponse.json({ schedules });
  } catch (err: any) {
    console.error("[GET /api/admin/exam-schedules]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST – create exam schedule
export async function POST(req: NextRequest) {
  try {
    const authCheck = await requireRole(["ADMIN"]);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await req.json();
    const { facultyId, calendarEventId, session, semester, examDate, startTime, endTime, venue, notes } = body;

    if (!facultyId || !session || !semester || !examDate) {
      return NextResponse.json({ error: "facultyId, session, semester, examDate are required" }, { status: 400 });
    }

    const [schedule] = await db.insert(examSchedules).values({
      facultyId,
      calendarEventId: calendarEventId || null,
      session,
      semester,
      examDate,
      startTime: startTime || null,
      endTime: endTime || null,
      venue: venue || null,
      notes: notes || null,
      createdBy: authCheck.user!.id,
    }).returning();

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/admin/exam-schedules]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: NextRequest) {
  try {
    const authCheck = await requireRole(["ADMIN"]);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await db.delete(examSchedules).where(eq(examSchedules.id, id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/admin/exam-schedules]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
