///api/users
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

import { clerkClient } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get("facultyId");
    const departmentId = searchParams.get("departmentId");

    let results = [];

    if (facultyId) {
      results = await db
        .select()
        .from(users)
        .where(eq(users.facultyId, facultyId));
    } else if (departmentId) {
      results = await db
        .select()
        .from(users)
        .where(eq(users.departmentId, departmentId));
    } else {
      results = await db.select().from(users);
    }

    const repClerkIds = results
      .filter((u) => u.role === "FACULTY REP")
      .map((u) => u.clerkId);

    if (repClerkIds.length > 0) {
      try {
        const client = await clerkClient();
        // userIds array allows fetching multiple users by their ID
        const clerkUsersResp = await client.users.getUserList({
          userId: repClerkIds,
          limit: 100,
        });

        // Map clerkId to imageUrl
        const clerkUserMap = new Map(
          clerkUsersResp.data.map((u) => [u.id, u.imageUrl])
        );

        const mappedResults = results.map((u) => {
          if (
            (u.role === "FACULTY REP") &&
            clerkUserMap.has(u.clerkId)
          ) {
            return { ...u, imageUrl: clerkUserMap.get(u.clerkId) };
          }
          return u;
        });

        return NextResponse.json(mappedResults);
      } catch (err) {
        console.error("Failed to fetch clerk users for imageUrls:", err);
        return NextResponse.json(results);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("[GET /api/users]", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
export async function POST(req: Request) {
  try {
    const { userId } = await auth(); // logged in user
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const params = await req.json();
    if (!params.email) {
      return NextResponse.json({ error: "Missing email" }, { status: 500 });
    }
    const existingMatNo = await db
      .select()
      .from(users)
      .where(eq(users.matricNo, params.matricNo))
      .limit(1);

    if (existingMatNo.length > 0) {
      console.log("Matric Number is taken!!!");
      console.error("Failed to insert user");
      return NextResponse.json(
        { message: "Matric Number is already taken!!!" },
        { status: 500 },
      );
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, params.email))
      .limit(1);

    if (existingUser.length > 0) {
      console.log("User Exists already!!!");
      console.error("Failed to insert user");
      return NextResponse.json(
        { message: "User Exists already!!!" },
        { status: 500 },
      );
    }
    //@ts-ignore
    await db.insert(users).values(params);
    return NextResponse.json({ success: true, message: "user created" });
  } catch (e) {
    console.error("[POST /api/users]", e);
    return NextResponse.json(
      { error: "Failed to Create User" },
      { status: 500 },
    );
  }
}
