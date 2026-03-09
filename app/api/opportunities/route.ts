import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { opportunities } from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get("type");

    let query = db.select().from(opportunities);

    // Filter by user's department to ensure relevant opportunities
    if (user.departmentId) {
       query.where(eq(opportunities.departmentId, user.departmentId));
    }
    
    // Sort logic handled in frontend or fetch all, ordering by newest
    const rawData = await query.orderBy(desc(opportunities.createdAt));

    // If a type filter is applied
    const data = typeFilter ? rawData.filter(opt => opt.type === typeFilter) : rawData;

    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/opportunities]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, company, url, type, deadline } = body;

    const [newOpportunity] = await db.insert(opportunities).values({
      title,
      company,
      url,
      type: type || "INTERNSHIP",
      deadline: deadline ? new Date(deadline) : null,
      departmentId: user.departmentId,
    }).returning();

    return NextResponse.json(newOpportunity);
  } catch (error) {
    console.error("[POST /api/opportunities]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
