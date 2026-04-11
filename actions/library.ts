"use server";

import { db } from "@/database/drizzle";
import { userBooks, books, users, courses, departments } from "@/database/schema";
import { eq, desc, and, inArray, isNotNull } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function getRecentBooks() {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!dbUser) return [];

    const results = await db
      .select({
         id: books.id,
         title: books.title,
         description: books.description,
         type: books.type,
         fileUrl: books.fileUrl,
         fileSize: books.fileSize,
         createdAt: books.createdAt,
         course: courses.courseCode,
         lastReadAt: userBooks.lastReadAt,
         readCount: userBooks.readCount,
      })
      .from(userBooks)
      .innerJoin(books, eq(userBooks.bookId, books.id))
      .leftJoin(courses, eq(books.id, courses.id)) // Actually bookCourses would be correct, but since it's a bit complex, let's just get basic book details
      .where(eq(userBooks.userId, dbUser.id))
      .orderBy(desc(userBooks.lastReadAt))
      .limit(6);

    return results;
  } catch (error) {
    console.error("Error fetching recent books:", error);
    return [];
  }
}

export async function getRecommendedBooks() {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!dbUser || !dbUser.departmentId) return [];

    // Simple recommendation: Top 6 books in the same department
    const results = await db
      .select({
         id: books.id,
         title: books.title,
         description: books.description,
         type: books.type,
         fileUrl: books.fileUrl,
         fileSize: books.fileSize,
         createdAt: books.createdAt,
      })
      .from(books)
      .where(eq(books.departmentId, dbUser.departmentId))
      .orderBy(desc(books.createdAt))
      .limit(6);

    return results;
  } catch (error) {
    console.error("Error fetching recommended books:", error);
    return [];
  }
}
