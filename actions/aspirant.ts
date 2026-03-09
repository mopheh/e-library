"use server";

import { db } from "@/database/drizzle";
import { verificationRequests, users, candidateProfiles } from "@/database/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function submitVerification(data: {
  documentUrl: string;
  jambNo: string;
  approvedDepartmentId: string;
  approvedFacultyId: string;
  admissionYear: string;
  level: "100" | "200" | "300" | "400" | "500" | "600";
}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Get DB user
    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!dbUser) throw new Error("User not found");

    // Check if a pending request already exists
    const existing = await db.query.verificationRequests.findFirst({
      where: eq(verificationRequests.userId, dbUser.id),
    });

    if (existing && existing.status === "PENDING") {
      throw new Error("You already have a pending verification request");
    }

    // Insert new request
    await db.insert(verificationRequests).values({
      userId: dbUser.id,
      jambNo: data.jambNo,
      documentUrl: data.documentUrl,
      approvedDepartmentId: data.approvedDepartmentId,
      approvedFacultyId: data.approvedFacultyId,
      admissionYear: data.admissionYear,
      level: data.level,
    });

    revalidatePath("/aspirant/verify");
    revalidatePath("/student/verify");
    
    return { success: true };
  } catch (error) {
    console.error("Verification error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getVerificationStatus() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!dbUser) return null;

    const req = await db.query.verificationRequests.findFirst({
      where: eq(verificationRequests.userId, dbUser.id),
      orderBy: (verificationRequests, { desc }) => [desc(verificationRequests.createdAt)],
    });

    return req;
  } catch (error) {
    console.error("Error getting verification status:", error);
    return null;
  }
}
