import { eq, sum, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import {
  departments,
  faculty,
  users,
  userBooks,
  readingSessions,
  activities,
} from "@/database/schema";

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

    if (!dbProfile) {
      return NextResponse.json(
        { error: "Profile not found in database" },
        { status: 404 }
      );
    }

    // Fetch stats
    const [booksStats] = await db
      .select({
        booksRead: sum(userBooks.readCount),
        downloads: sum(userBooks.downloadCount),
        aiRequests: sum(userBooks.aiRequests),
      })
      .from(userBooks)
      .where(eq(userBooks.userId, dbProfile.id));

    const [sessionStats] = await db
      .select({
        totalMinutes: sum(readingSessions.duration),
        totalPages: sum(readingSessions.pagesRead),
      })
      .from(readingSessions)
      .where(eq(readingSessions.userId, dbProfile.id));

    const recentActivities = await db
      .select()
      .from(activities)
      .where(eq(activities.userId, dbProfile.id))
      .orderBy(desc(activities.createdAt))
      .limit(10);

    const mergedProfile = {
      ...cliqProfile,
      ...dbProfile,
      stats: {
        booksRead: Number(booksStats?.booksRead || 0),
        downloads: Number(booksStats?.downloads || 0),
        aiRequests: Number(booksStats?.aiRequests || 0),
        totalMinutes: Number(sessionStats?.totalMinutes || 0),
        totalPages: Number(sessionStats?.totalPages || 0),
      },
      recentActivities,
    };

    return NextResponse.json(mergedProfile);
  } catch (error: any) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      phoneNumber,
      faculty,
      department,
      year,
      matricNumber,
      gender,
      address,
      dob,
    } = body;

    // Update clerk details
    if (firstName || lastName) {
      await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
        }),
      });
    }

    // Update local database
    const updateData: any = {};
    if (firstName || lastName) {
      updateData.fullName = `${firstName || ""} ${lastName || ""}`.trim();
    }
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (faculty) updateData.facultyId = faculty;
    if (department) updateData.departmentId = department;
    if (year) updateData.year = year;
    if (matricNumber) updateData.matricNo = matricNumber;
    if (gender) updateData.gender = gender;
    if (address) updateData.address = address;
    if (dob) updateData.dateOfBirth = dob;

    if (Object.keys(updateData).length > 0) {
      await db
        .update(users)
        .set(updateData)
        .where(eq(users.clerkId, userId));
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
