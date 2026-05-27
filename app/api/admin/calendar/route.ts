import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { academicCalendarEvents } from "@/database/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireRole, getCurrentUser } from "@/lib/auth";

// GET – list all events, optionally filtered by session/semester
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const session = searchParams.get("session");
    const semester = searchParams.get("semester");

    const conditions: any[] = [];
    if (session) conditions.push(eq(academicCalendarEvents.session, session));
    if (semester) conditions.push(eq(academicCalendarEvents.semester, semester));

    const events = await db
      .select()
      .from(academicCalendarEvents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(academicCalendarEvents.startDate);

    return NextResponse.json({ events });
  } catch (err: any) {
    console.error("[GET /api/admin/calendar]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST – create a new calendar event
export async function POST(req: NextRequest) {
  try {
    const authCheck = await requireRole(["ADMIN"]);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await req.json();
    const { session, semester, startDate, endDate, activity, category, isPublished } = body;

    if (!session || !startDate || !activity) {
      return NextResponse.json({ error: "session, startDate and activity are required" }, { status: 400 });
    }

    const [event] = await db.insert(academicCalendarEvents).values({
      session,
      semester: semester || null,
      startDate,
      endDate: endDate || null,
      activity,
      category: category || "other",
      isPublished: isPublished ?? false,
      createdBy: authCheck.user!.id,
    }).returning();

    return NextResponse.json({ event }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/admin/calendar]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT – update a calendar event
export async function PUT(req: NextRequest) {
  try {
    const authCheck = await requireRole(["ADMIN"]);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const [updated] = await db
      .update(academicCalendarEvents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(academicCalendarEvents.id, id))
      .returning();

    return NextResponse.json({ event: updated });
  } catch (err: any) {
    console.error("[PUT /api/admin/calendar]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE – remove a calendar event
export async function DELETE(req: NextRequest) {
  try {
    const authCheck = await requireRole(["ADMIN"]);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    await db.delete(academicCalendarEvents).where(eq(academicCalendarEvents.id, id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/admin/calendar]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
