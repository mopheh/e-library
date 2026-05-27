// app/api/faculty/route.ts
import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { faculty } from "@/database/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skip = Number(searchParams.get("skip")) || 0;
  const limit = Number(searchParams.get("limit")) || 100;

  try {
    const faculties = await db.select().from(faculty).limit(limit).offset(skip);
    return NextResponse.json(faculties);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch faculties" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authCheck = await requireRole(["ADMIN"]);
    if (!authCheck.authorized) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const body = await req.json();
    const { name } = body;
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const [newFaculty] = await db.insert(faculty).values({ name }).returning();
    return NextResponse.json(newFaculty, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/faculty]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authCheck = await requireRole(["ADMIN"]);
    if (!authCheck.authorized) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const body = await req.json();
    const { id, name } = body;
    if (!id || !name) return NextResponse.json({ error: "id and name are required" }, { status: 400 });

    const [updated] = await db.update(faculty).set({ name }).where(eq(faculty.id, id)).returning();
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("[PUT /api/faculty]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authCheck = await requireRole(["ADMIN"]);
    if (!authCheck.authorized) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    await db.delete(faculty).where(eq(faculty.id, id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/faculty]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
