/**
 * Reset Script: Clears all books, text chunks (book_pages), and reading sessions.
 * 
 * This deletes from child tables first (respecting FK constraints), then the parent `books` table.
 * 
 * Tables cleared:
 *   1. book_pages       (parsed text chunks + embeddings)
 *   2. book_courses     (book ↔ course links)
 *   3. user_books       (user reading progress)
 *   4. reading_sessions (daily reading logs)
 *   5. annotations      (highlights & notes)
 *   6. activities       (activity feed entries referencing books)
 *   7. books            (the books themselves)
 *
 * Run: npx tsx scripts/reset-books.ts
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function resetBooks() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set in .env");
    process.exit(1);
  }

  const client = neon(process.env.DATABASE_URL);
  const db = drizzle({ client });

  console.log("⚠️  This will permanently delete ALL books, text chunks, reading sessions,");
  console.log("   book-course links, user reading progress, annotations, and related activities.\n");

  try {
    // 1. Delete book_pages (text chunks + embeddings)
    const pagesResult = await db.execute(sql`DELETE FROM book_pages`);
    console.log("✅ Cleared book_pages (text chunks & embeddings)");

    // 2. Delete book_courses (book ↔ course associations)
    const bookCoursesResult = await db.execute(sql`DELETE FROM book_courses`);
    console.log("✅ Cleared book_courses");

    // 3. Delete user_books (reading progress per user)
    const userBooksResult = await db.execute(sql`DELETE FROM user_books`);
    console.log("✅ Cleared user_books (reading progress)");

    // 4. Delete reading_sessions
    const sessionsResult = await db.execute(sql`DELETE FROM reading_sessions`);
    console.log("✅ Cleared reading_sessions");

    // 5. Delete annotations
    const annotationsResult = await db.execute(sql`DELETE FROM annotations`);
    console.log("✅ Cleared annotations");

    // 6. Delete activities that reference books
    const activitiesResult = await db.execute(sql`DELETE FROM activities`);
    console.log("✅ Cleared activities");

    // 7. Delete jobs (parse/generate jobs)
    const jobsResult = await db.execute(sql`DELETE FROM jobs`);
    console.log("✅ Cleared jobs");

    // 8. Finally, delete books
    const booksResult = await db.execute(sql`DELETE FROM books`);
    console.log("✅ Cleared books");

    console.log("\n🎉 All book data has been wiped. You can now upload fresh materials.");
  } catch (error: any) {
    console.error("❌ Error during reset:", error.message || error);
    process.exit(1);
  }

  process.exit(0);
}

resetBooks();
