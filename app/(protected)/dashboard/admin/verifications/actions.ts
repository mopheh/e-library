"use server";

import { db } from "@/database/drizzle";
import { verificationRequests, users, departments, faculty } from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function getVerificationRequests() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const adminUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    // 1. Fetch pending requests with user and department details
    const rawResults = await db
      .select({
         id: verificationRequests.id,
         jambNo: verificationRequests.jambNo,
         proofUrl: verificationRequests.proofUrl,
         admissionYear: verificationRequests.admissionYear,
         level: verificationRequests.level,
         createdAt: verificationRequests.createdAt,
         user: {
           id: users.id,
           clerkId: users.clerkId,
           fullName: users.fullName,
           email: users.email,
         },
         department: {
           name: departments.name,
         },
         faculty: {
           name: faculty.name,
         }
      })
      .from(verificationRequests)
      .innerJoin(users, eq(verificationRequests.userId, users.id))
      .leftJoin(departments, eq(verificationRequests.approvedDepartmentId, departments.id))
      .leftJoin(faculty, eq(verificationRequests.approvedFacultyId, faculty.id))
      .where(eq(verificationRequests.status, "PENDING"))
      .orderBy(desc(verificationRequests.createdAt));

    // 2. Fetch clerk profile images
    if (rawResults.length > 0) {
      const clerkIds = rawResults.map((r) => r.user.clerkId);
      const client = await clerkClient();
      const clerkUsers = await client.users.getUserList({
        userId: clerkIds,
        limit: 100,
      });

      const clerkMap = new Map(clerkUsers.data.map((u) => [u.id, u.imageUrl]));

      return rawResults.map((r) => ({
        ...r,
        user: {
          ...r.user,
          imageUrl: clerkMap.get(r.user.clerkId) || null,
        },
      }));
    }

    return rawResults;
  } catch (error) {
    console.error("Error fetching verification requests", error);
    return [];
  }
}
