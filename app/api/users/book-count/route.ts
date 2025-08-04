// /app/api/user/logReadingSession/route.ts

import { db } from "@/database/drizzle"
import { eq, and, gte } from "drizzle-orm"
import { NextRequest } from "next/server"
import { readingSessions, userBooks, users } from "@/database/schema"
import { auth } from "@clerk/nextjs/server"

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    //@ts-ignore
    .where(eq(users.clerkId, userId))
  const id = user.id
  const { bookId } = await req.json()
  console.log({ bookId })
  const today = new Date().toISOString().split("T")[0]

  // Check if a session for today already exists
  const existing = await db
    .select()
    .from(userBooks)
    .where(and(eq(userBooks.userId, id), eq(userBooks.bookId, bookId)))
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(userBooks)
      .set({ readCount: existing[0].readCount + 1, updatedAt: new Date() })
      .where(eq(readingSessions.id, existing[0].id))
  } else {
    await db.insert(userBooks).values({ userId: id, bookId, readCount: 1 })
  }

  return new Response("Logged successfully", { status: 200 })
}
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    })
  }
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId))
  const id = user.id

  try {
    const books = await db
      .select()
      .from(userBooks)
      .where(eq(userBooks.userId, id))

    return new Response(JSON.stringify(books.length), { status: 200 })
  } catch (error) {
    console.error("GET reading session error:", error)
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    })
  }
}
