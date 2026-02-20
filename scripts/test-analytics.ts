import { config } from "dotenv";
config({ path: ".env.local" });

import { count, eq, sql, desc } from "drizzle-orm";

async function main() {
  console.log("Starting Analytics Query Verification...");

  try {
    const { db } = await import("../database/drizzle");
    const { readingSessions, userBooks, users } = await import("../database/schema");

    // 1. Fetch a user
    const user = await db.query.users.findFirst();
    if (!user) {
        console.log("No users found. Test skipped.");
        return;
    }
    console.log(`Testing for user: ${user.fullName} (${user.id})`);

    // 2. Test Books Read Count
    const booksRead = await db
      .select({ count: count() })
      .from(userBooks)
      .where(eq(userBooks.userId, user.id));
    console.log(`Books Read Count: ${booksRead[0].count}`);

    // 3. Test Minutes Read
    const minutesRead = await db
      .select({ totalMinutes: sql<number>`sum(${readingSessions.duration})` })
      .from(readingSessions)
      .where(eq(readingSessions.userId, user.id));
    console.log(`Total Minutes Read: ${minutesRead[0].totalMinutes || 0}`);

    // 4. Test Recent Sessions Query (for Streak/Heatmap)
    const sessions = await db
        .select()
        .from(readingSessions)
        .where(eq(readingSessions.userId, user.id))
        .orderBy(desc(readingSessions.date))
        .limit(5);

    console.log(`Recent Sessions: ${sessions.length}`);
    sessions.forEach(s => console.log(` - Date: ${s.date}, Duration: ${s.duration}m`));

    console.log("Verification Complete. Queries executed successfully.");
  } catch (error) {
    console.error("Test Failed:", error);
  } finally {
    process.exit(0);
  }
}

main();
