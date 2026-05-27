import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { classTimetables, departments, faculty } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { requireRole } from "@/lib/auth";

// GET – list timetables, optionally filtered
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const session = searchParams.get("session");
    const semester = searchParams.get("semester");
    const departmentId = searchParams.get("departmentId");
    const level = searchParams.get("level");

    const conditions: any[] = [];
    if (session) conditions.push(eq(classTimetables.session, session));
    if (semester) conditions.push(eq(classTimetables.semester, semester as any));
    if (departmentId) conditions.push(eq(classTimetables.departmentId, departmentId));
    if (level) conditions.push(eq(classTimetables.level, level as any));

    const timetables = await db
      .select({
        id: classTimetables.id,
        departmentId: classTimetables.departmentId,
        departmentName: departments.name,
        facultyId: classTimetables.facultyId,
        facultyName: faculty.name,
        session: classTimetables.session,
        semester: classTimetables.semester,
        level: classTimetables.level,
        title: classTimetables.title,
        fileUrl: classTimetables.fileUrl,
        fileType: classTimetables.fileType,
        createdAt: classTimetables.createdAt,
      })
      .from(classTimetables)
      .leftJoin(departments, eq(departments.id, classTimetables.departmentId))
      .leftJoin(faculty, eq(faculty.id, classTimetables.facultyId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(classTimetables.createdAt);

    return NextResponse.json({ timetables });
  } catch (err: any) {
    console.error("[GET /api/admin/timetables]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST – add timetable entry
export async function POST(req: NextRequest) {
  try {
    const authCheck = await requireRole(["ADMIN", "FACULTY REP"]);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await req.json();
    const { departmentId, facultyId, session, semester, level, title, fileUrl, fileType } = body;

    if (!session || !semester || !title) {
      return NextResponse.json({ error: "session, semester and title are required" }, { status: 400 });
    }

    const [tt] = await db.insert(classTimetables).values({
      departmentId: departmentId || null,
      facultyId: facultyId || null,
      session,
      semester,
      level: level || null,
      title,
      fileUrl: fileUrl || null,
      fileType: fileType || null,
      uploadedBy: authCheck.user!.id,
    }).returning();

    return NextResponse.json({ timetable: tt }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/admin/timetables]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: NextRequest) {
  try {
    const authCheck = await requireRole(["ADMIN", "FACULTY REP"]);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await db.delete(classTimetables).where(eq(classTimetables.id, id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/admin/timetables]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
