import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { opportunities } from "@/database/schema";
import { eq, sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  company: z.string().min(1).max(255).optional(),
  url: z.string().url("Must be a valid URL").optional(),
  type: z.enum(["INTERNSHIP", "SCHOLARSHIP", "HACKATHON", "JOB"]).optional(),
  // input[type="date"] yields "YYYY-MM-DD"
  deadline: z
    .string()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(v), {
      message: "deadline must be a valid date (YYYY-MM-DD) or ISO datetime",
    })
    .optional()
    .nullable(),
  isGlobal: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authCheck = await requireRole(["ADMIN"]);
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status },
      );
    }
    const user = authCheck.user!;
    const { id } = await params;

    const result = updateSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.errors },
        { status: 400 },
      );
    }

    const { title, company, url, type, deadline, isGlobal } = result.data;

    // Build only the fields that were supplied
    const updateValues: Record<string, unknown> = {};
    if (title !== undefined) updateValues.title = title;
    if (company !== undefined) updateValues.company = company;
    if (url !== undefined) updateValues.url = url;
    if (type !== undefined) updateValues.type = type;
    if (deadline !== undefined)
      updateValues.deadline = deadline ? new Date(deadline) : null;
    if (isGlobal !== undefined) {
      // Keep the opportunity's existing department when it already has one — only
      // fall back to the editing admin's department when converting a global
      // (departmentId IS NULL) opportunity into a department-scoped one, since the
      // form has no explicit department picker. This keeps unrelated edits (e.g. a
      // title fix) from silently reassigning a department-scoped opportunity to
      // whichever admin happens to save next.
      updateValues.departmentId = isGlobal
        ? null
        : sql`COALESCE(${opportunities.departmentId}, ${user.departmentId})`;
    }

    const [updated] = await db
      .update(opportunities)
      .set(updateValues)
      .where(eq(opportunities.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/opportunities/:id]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authCheck = await requireRole(["ADMIN"]);
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status },
      );
    }
    const { id } = await params;

    const [deleted] = await db
      .delete(opportunities)
      .where(eq(opportunities.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/opportunities/:id]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
