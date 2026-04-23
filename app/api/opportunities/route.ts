import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { opportunities } from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { z } from "zod";

const opportunitySchema = z.object({
  title: z.string().min(1, "title is required").max(255),
  company: z.string().min(1, "company is required").max(255),
  url: z.string().url("Must be a valid URL"),
  type: z
    .enum(["INTERNSHIP", "SCHOLARSHIP", "HACKATHON", "JOB"])
    .default("INTERNSHIP"),
  deadline: z.string().datetime({ offset: true }).optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get("type");

    const rawData = await db
      .select()
      .from(opportunities)
      .orderBy(desc(opportunities.createdAt));

    const data = typeFilter ? rawData.filter((opt) => opt.type === typeFilter) : rawData;

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
    const { title, company, url, type, deadline } = result.data;

    const [newOpportunity] = await db
      .insert(opportunities)
      .values({
        title,
        company,
        url,
        type,
        deadline: deadline ? new Date(deadline) : null,
        departmentId: user.departmentId,
      })
      .returning();

    return NextResponse.json(newOpportunity, { status: 201 });
  } catch (error) {
    console.error("[POST /api/opportunities]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
