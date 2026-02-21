import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, and, not } from "drizzle-orm";
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const studentUser = await getCurrentUser();

    if (!studentUser || !studentUser.facultyId) {
      return NextResponse.json({ error: "Unauthorized or missing faculty" }, { status: 401 });
    }

    // Find a user who is a FACULTY REP and in the same faculty
    const result = await db
      .select({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          role: users.role,
          clerkId: users.clerkId,
      })
      .from(users)
      .where(
        and(
            eq(users.facultyId, studentUser.facultyId),
            eq(users.role, "FACULTY REP"),
            not(eq(users.id, studentUser.id))
        )
      )
      .limit(1);

    let rep: any = result[0] || null;

    if (rep) {
        try {
            const client = await clerkClient();
            const clerkUser = await client.users.getUser(rep.clerkId);
            const repType = clerkUser.unsafeMetadata?.repType || "Faculty Rep";
            // Create a new object to avoid modifying the read-only Drizzle result
            rep = { ...rep, repType: repType as string, imageUrl: clerkUser.imageUrl };
        } catch (err) {
            console.error("Failed to fetch clerk user for repType/imageUrl:", err);
            rep = { ...rep, repType: "Faculty Rep", imageUrl: "" };
        }
    }

    return NextResponse.json({ rep });
  } catch (error) {
    console.error("Error fetching faculty rep:", error);
    return NextResponse.json(
      { error: "Failed to fetch faculty rep" },
      { status: 500 }
    );
  }
}
