import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { opportunities, jobs } from "@/database/schema";
import { eq, desc, and, or, isNull } from "drizzle-orm";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { z } from "zod";

const opportunitySchema = z.object({
  title: z.string().min(1, "title is required").max(255),
  company: z.string().min(1, "company is required").max(255),
  url: z.string().url("Must be a valid URL"),
  type: z
    .enum(["INTERNSHIP", "SCHOLARSHIP", "HACKATHON", "JOB"])
    .default("INTERNSHIP"),
  // input[type="date"] yields "YYYY-MM-DD"; accept that or a full ISO string, or empty/null
  deadline: z
    .string()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(v), {
      message: "deadline must be a valid date (YYYY-MM-DD) or ISO datetime",
    })
    .optional()
    .nullable(),
  isGlobal: z.boolean().optional().default(false),
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get("type");

    // Students/reps/aspirants only see opportunities posted for their own department
    // plus global (all-faculty) ones; admins see everything for moderation purposes.
    const conditions = [];
    if (typeFilter) {
      conditions.push(eq(opportunities.type, typeFilter as typeof opportunities.$inferSelect.type));
    }
    if (user.role !== "ADMIN") {
      conditions.push(or(isNull(opportunities.departmentId), eq(opportunities.departmentId, user.departmentId)));
    }

    const data = await db
      .select()
      .from(opportunities)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(opportunities.createdAt))
      .limit(200);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/opportunities]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Only ADMIN and FACULTY REP may post opportunities
    const authCheck = await requireRole(["ADMIN", "FACULTY REP"]);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const user = authCheck.user!;

    const result = opportunitySchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.errors },
        { status: 400 },
      );
    }
    const { title, company, url, type, deadline, isGlobal } = result.data;

    // Admins posting globally have no department constraint; others are scoped to their department
    const resolvedDepartmentId = (user.role === "ADMIN" && isGlobal) ? null : user.departmentId;

    const [newOpportunity] = await db
      .insert(opportunities)
      .values({
        title,
        company,
        url,
        type,
        deadline: deadline ? new Date(deadline) : null,
        departmentId: resolvedDepartmentId,
      })
      .returning();

    if (newOpportunity.type === "SCHOLARSHIP") {
      // Best-effort: notify students by email in the background. A failure to
      // enqueue must not fail opportunity creation, which already succeeded.
      try {
        await db.insert(jobs).values({
          type: "send_scholarship_email",
          payload: { opportunityId: newOpportunity.id },
          status: "pending",
        });
      } catch (error) {
        console.error("[POST /api/opportunities] Failed to enqueue scholarship email job", error);
      }
    }

    return NextResponse.json(newOpportunity, { status: 201 });
  } catch (error) {
    console.error("[POST /api/opportunities]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
