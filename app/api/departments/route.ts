import { NextRequest, NextResponse } from "next/server"
import { db } from "@/database/drizzle"
import { departments } from "@/database/schema"
import { eq, ilike, and } from "drizzle-orm"
import { requireRole } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const facultyId = searchParams.get("facultyId")
    const departmentId = searchParams.get("departmentId")
    const search = searchParams.get("search")
    const skip = Number(searchParams.get("skip")) || 0
    const limit = Number(searchParams.get("limit")) || 1000

    if (facultyId) {
      const condition = search 
        ? and(eq(departments.facultyId, facultyId), ilike(departments.name, `%${search}%`))
        : eq(departments.facultyId, facultyId)
      
      const filterDepartments = await db
        .select()
        .from(departments)
        .where(condition)
        .limit(limit)
        .offset(skip)
      return NextResponse.json(filterDepartments)
    }

    if (departmentId) {
      const department = await db
        .select()
        .from(departments)
        .where(eq(departments.id, departmentId))
      return NextResponse.json(department)
    }

    // Case: Fetch all departments
    const condition = search ? ilike(departments.name, `%${search}%`) : undefined
    const allDepartments = await db
      .select()
      .from(departments)
      .where(condition)
      .limit(limit)
      .offset(skip)
    return NextResponse.json(allDepartments)
  } catch (error) {
    console.error("[GET /api/departments]", error)
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authCheck = await requireRole(["ADMIN"])
    if (!authCheck.authorized)
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })

    const body = await req.json()
    const { id, name } = body
    if (!id || !name)
      return NextResponse.json({ error: "id and name are required" }, { status: 400 })

    const [updated] = await db
      .update(departments)
      .set({ name })
      .where(eq(departments.id, id))
      .returning()
    return NextResponse.json(updated)
  } catch (err: any) {
    console.error("[PUT /api/departments]", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authCheck = await requireRole(["ADMIN"])
    if (!authCheck.authorized)
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id)
      return NextResponse.json({ error: "id is required" }, { status: 400 })

    await db.delete(departments).where(eq(departments.id, id))
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[DELETE /api/departments]", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
