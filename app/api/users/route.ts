import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import {auth} from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get("facultyId");
    const departmentId = searchParams.get("departmentId");

    if (facultyId) {
      // Case: Filtered by facultyId
      const filterUsers = await db
        .select()
        .from(users)
        .where(eq(users.facultyId, facultyId));
      return NextResponse.json(filterUsers);
    }
    if (departmentId) {
      // Case: Filtered by facultyId
      const filterUsers = await db
        .select()
        .from(users)
        .where(eq(users.departmentId, departmentId));
      return NextResponse.json(filterUsers);
    }

    // Case: Fetch all departments
    const allUsers = await db.select().from(users);
    return NextResponse.json(allUsers);
  } catch (error) {
    console.error("[GET /api/users]", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
export async function POST(req: Request) {
  try {
    const { userId } = await auth(); // logged in user
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const params = await req.json()
    if (!params.email) {
      return NextResponse.json({error: "Missing email"}, {status: 500});
    }
    const existingMatNo = await db
        .select()
        .from(users)
        .where(eq(users.matricNo, params.matricNo))
        .limit(1);

    if (existingMatNo.length > 0) {
      console.log("Matric Number is taken!!!");
      console.error("Failed to insert user");
      return NextResponse.json({ message: "Matric Number is already taken!!!" }, { status: 500 });
    }

      const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, params.email))
          .limit(1);

      if (existingUser.length > 0) {
        console.log("User Exists already!!!");
        console.error("Failed to insert user");
        return NextResponse.json({ message: "User Exists already!!!" }, { status: 500 });
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