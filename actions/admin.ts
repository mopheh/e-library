"use server";

import { db } from "@/database/drizzle";
import { verificationRequests, users, notifications } from "@/database/schema";
import { eq } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function getSignedProofUrl(proofUrl: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const bucketName = process.env.B2_BUCKET || "univault-books";
    let key = proofUrl;
    
    if (proofUrl.includes("backblazeb2.com")) {
      const parts = proofUrl.split("/");
      const bucketIndex = parts.indexOf(bucketName);
      if (bucketIndex !== -1) {
        key = parts.slice(bucketIndex + 1).join("/");
      }
    }

    const s3Client = new S3Client({
      region: "us-east-005",
      endpoint: process.env.B2_ENDPOINT?.startsWith("http")
        ? process.env.B2_ENDPOINT
        : `https://${process.env.B2_ENDPOINT}`,
      credentials: {
        accessKeyId: process.env.B2_KEY_ID!,
        secretAccessKey: process.env.B2_APP_KEY!,
      },
      forcePathStyle: true,
    });

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return { success: true, url: signedUrl };
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return { success: false, error: "Failed to generate access to document." };
  }
}

export async function approveVerification(requestId: string) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    // Fetch request with student's Clerk ID via join
    const requestArray = await db
      .select({
        id: verificationRequests.id,
        userId: verificationRequests.userId,
        approvedDepartmentId: verificationRequests.approvedDepartmentId,
        approvedFacultyId: verificationRequests.approvedFacultyId,
        level: verificationRequests.level,
        clerkId: users.clerkId,
      })
      .from(verificationRequests)
      .innerJoin(users, eq(verificationRequests.userId, users.id))
      .where(eq(verificationRequests.id, requestId))
      .limit(1);

    if (requestArray.length === 0) throw new Error("Request not found");
    const requestItem = requestArray[0];

    // Verify Manager (Admin or Faculty Rep)
    const adminUser = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!adminUser || (adminUser.role !== "ADMIN" && adminUser.role !== "FACULTY REP")) {
      throw new Error("Unauthorized. Only Admins and Faculty Representatives can review verifications.");
    }

    // Role-based Access Control for Faculty Reps
    if (adminUser.role === "FACULTY REP" && adminUser.facultyId !== requestItem.approvedFacultyId) {
      throw new Error("Unauthorized. You can only verify aspirants for your own faculty.");
    }

    // 1. Update the request status
    await db.update(verificationRequests)
      .set({
        status: "APPROVED",
        reviewedBy: adminUser.id,
        reviewedAt: new Date(),
      })
      .where(eq(verificationRequests.id, requestId));

    // 2. Upgrade the user to STUDENT and sync their verified dept/faculty
    await db.update(users)
      .set({
        role: "STUDENT",
        departmentId: requestItem.approvedDepartmentId || undefined,
        facultyId: requestItem.approvedFacultyId || undefined,
        year: requestItem.level || undefined,
      })
      .where(eq(users.id, requestItem.userId));

    // 3. Sync with Clerk Metadata for immediate role update
    const client = await clerkClient();
    await client.users.updateUserMetadata(requestItem.clerkId || clerkId, {
      publicMetadata: {
        role: "STUDENT",
      },
    });

    // 4. Create a notification
    await db.insert(notifications).values({
      userId: requestItem.userId,
      type: "SYSTEM",
      message: "Your verification has been approved! You now have full access as a Student.",
    });

    revalidatePath("/dashboard/admin/verifications");
    return { success: true };
  } catch (error) {
    console.error("Error approving verification:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to approve" };
  }
}

export async function rejectVerification(requestId: string) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    // Fetch request with student's Clerk ID via join
    const requestArray = await db
      .select({
        id: verificationRequests.id,
        userId: verificationRequests.userId,
        clerkId: users.clerkId,
      })
      .from(verificationRequests)
      .innerJoin(users, eq(verificationRequests.userId, users.id))
      .where(eq(verificationRequests.id, requestId))
      .limit(1);

    if (requestArray.length === 0) throw new Error("Request not found");
    const req = requestArray[0];

    const adminUser = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!adminUser || (adminUser.role !== "ADMIN" && adminUser.role !== "FACULTY REP")) {
      throw new Error("Unauthorized. Only Admins and Faculty Representatives can review verifications.");
    }

    // Check Faculty Rep specific access
    if (adminUser.role === "FACULTY REP") {
        const fullRequest = await db.query.verificationRequests.findFirst({
            where: eq(verificationRequests.id, requestId)
        });
        if (fullRequest?.approvedFacultyId !== adminUser.facultyId) {
            throw new Error("Unauthorized. You can only review aspirants for your own faculty.");
        }
    }

    // 1. Update status
    await db.update(verificationRequests)
      .set({
        status: "REJECTED",
        reviewedBy: adminUser.id,
        reviewedAt: new Date(),
      })
      .where(eq(verificationRequests.id, requestId));

    // 2. Ensure Clerk Metadata remains cleared/reset to ASPIRANT
    const client = await clerkClient();
    await client.users.updateUserMetadata(req.clerkId || clerkId, {
      publicMetadata: {
        role: "ASPIRANT",
      },
    });

    // 3. Create notification
    await db.insert(notifications).values({
      userId: req.userId,
      type: "SYSTEM",
      message: "Your verification request was rejected. Please review your submission and try again or contact support.",
    });

    revalidatePath("/dashboard/admin/verifications");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting verification:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to reject" };
  }
}
