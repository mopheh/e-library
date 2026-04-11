import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { users, verificationRequests } from "@/database/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { 
      proofUrl, 
      jambNo, 
      approvedDepartmentId, 
      approvedFacultyId, 
      subjectCombinations,
      admissionYear, 
      level 
    } = body;

    const [user] = await db.select().from(users).where(eq(users.clerkId, userId));
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const [request] = await db.insert(verificationRequests).values({
      userId: user.id,
      proofUrl,
      jambNo,
      approvedDepartmentId,
      approvedFacultyId,
      subjectCombinations,
      admissionYear,
      level
    }).returning();

    return NextResponse.json({ success: true, request });
  } catch (error) {
    console.error("Verification Request Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [user] = await db.select().from(users).where(eq(users.clerkId, userId));
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const requests = await db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.userId, user.id));

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error("Fetch Verification Requests Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
