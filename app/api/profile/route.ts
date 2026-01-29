import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server"; // to get current user
import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { departments, faculty, users } from "@/database/schema";
import { notificationQueue } from "@/queue/notificationQueue";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cliqRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    if (!cliqRes.ok) {
      throw new Error("Failed to fetch from CLIQ");
    }

    const cliqData = await cliqRes.json();

    const cliqProfile = {
      firstName: cliqData.first_name,
      lastName: cliqData.last_name,
      email: cliqData.email_addresses?.[0]?.email_address || null,
      avatarUrl: cliqData.image_url,
    };

    const [dbProfile] = await db
      .select({
        id: users.id,
        matricNumber: users.matricNo,
        year: users.year,
        gender: users.gender,
        address: users.address,
        role: users.role,
        phoneNumber: users.phoneNumber,
        faculty: {
          id: faculty.id,
          name: faculty.name,
        },
        department: {
          id: departments.id,
          name: departments.name,
        },
      })
      .from(users)
      .where(eq(users.clerkId, userId))
      .leftJoin(faculty, eq(users.facultyId, faculty.id))
      .leftJoin(departments, eq(users.departmentId, departments.id));

    const mergedProfile = {
      ...cliqProfile,
      ...dbProfile,
    };
    await notificationQueue.add(
      "system-alert",
      {
        id: userId,
        title: "Account Notice",
        message: `UniVault User Profile ${cliqProfile.firstName} is currently updated.`,
      },
      {
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 3000,
        },
      }
    );
    return NextResponse.json(mergedProfile);
  } catch (error: any) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}
