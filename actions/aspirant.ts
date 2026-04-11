"use server";

import { db } from "@/database/drizzle";
import { verificationRequests, users, candidateProfiles } from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

export async function submitVerification(data: {
  proofUrl: string;
  jambNo: string;
  approvedDepartmentId: string;
  approvedFacultyId: string;
  subjectCombinations: string[];
  admissionYear: string;
  level: "100" | "200" | "300" | "400" | "500" | "600";
}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Get DB user safely
    const [dbUser] = await db.select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!dbUser) throw new Error("User not found");

    // Check if a pending request already exists
    const [existing] = await db.select()
      .from(verificationRequests)
      .where(eq(verificationRequests.userId, dbUser.id))
      .limit(1);

    if (existing && existing.status === "PENDING") {
      throw new Error("You already have a pending verification request");
    }

    // Insert new request
    await db.insert(verificationRequests).values({
      userId: dbUser.id,
      jambNo: data.jambNo,
      proofUrl: data.proofUrl,
      approvedDepartmentId: data.approvedDepartmentId,
      approvedFacultyId: data.approvedFacultyId,
      subjectCombinations: data.subjectCombinations,
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
  noStore(); // Safely disable any aggressive client/server caching of this action

  try {
    const { userId } = await auth();
    if (!userId) return null;

    const [dbUser] = await db.select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!dbUser) return null;

    const [req] = await db.select()
      .from(verificationRequests)
      .where(eq(verificationRequests.userId, dbUser.id))
      .orderBy(desc(verificationRequests.createdAt))
      .limit(1);

    return req || null;
  } catch (error) {
    console.error("Error getting verification status:", error);
    return null;
  }
}

export async function saveCbtSubjects(subjectCombinations: string[]) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const [dbUser] = await db.select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!dbUser) throw new Error("User not found");

    const [existingProfile] = await db.select()
      .from(candidateProfiles)
      .where(eq(candidateProfiles.userId, dbUser.id))
      .limit(1);

    if (existingProfile) {
      await db.update(candidateProfiles)
        .set({ subjectCombinations })
        .where(eq(candidateProfiles.id, existingProfile.id));
    } else {
      await db.insert(candidateProfiles).values({
        userId: dbUser.id,
        subjectCombinations,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving CBT subjects:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

