import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { users, verificationRequests } from "@/database/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

const verifySchema = z.object({
  proofUrl: z.string().url("proofUrl must be a valid URL"),
  jambNo: z.string().min(8, "JAMB number must be at least 8 characters").max(20),
  approvedDepartmentId: z.string().uuid("approvedDepartmentId must be a valid UUID"),
  approvedFacultyId: z.string().uuid("approvedFacultyId must be a valid UUID"),
  subjectCombinations: z.array(z.string()).min(1, "At least one subject is required"),
  admissionYear: z
    .number()
    .int()
    .min(2000)
    .max(new Date().getFullYear() + 1),
  level: z.enum(["100", "200", "300", "400", "500", "600"]),
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = verifySchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.errors },
        { status: 400 },
      );
    }
    const {
      proofUrl,
      jambNo,
      approvedDepartmentId,
      approvedFacultyId,
      subjectCombinations,
      admissionYear,
      level,
    } = result.data;

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const [request] = await db
      .insert(verificationRequests)
      .values({
        userId: user.id,
        proofUrl,
        jambNo,
        approvedDepartmentId,
        approvedFacultyId,
        subjectCombinations,
        admissionYear,
        level,
      })
      .returning();

    return NextResponse.json({ success: true, request }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/aspirant/verify]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const requests = await db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.userId, user.id));

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error("[GET /api/aspirant/verify]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
