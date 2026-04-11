import { config } from "dotenv";
config({ path: ".env.worker" });
config({ path: ".env.local" });
config({ path: ".env" });

import { eq, sql, and, lt, desc, or } from "drizzle-orm";
import { jobs } from "../database/schema";

async function run() {
  const { db } = await import("../database/drizzle");
  
  console.log("🔍 Testing Worker Picking Logic...");
  
  const STALE_THRESHOLD_MS = 10 * 60 * 1000;
  
  const query = and(
    or(
      eq(jobs.status, "pending"),
      and(
        eq(jobs.status, "processing"),
        sql`${jobs.lockedAt} < ${new Date(Date.now() - STALE_THRESHOLD_MS)}`
      )
    ),
    lt(jobs.attempts, jobs.maxAttempts)
  );

  const candidates = await db
    .select()
    .from(jobs)
    .where(query)
    .orderBy(desc(jobs.createdAt))
    .limit(5);

  if (candidates.length === 0) {
    console.log("❌ No jobs found that match current picking criteria.");
    
    // Debug: check why
    const allPending = await db.select({ id: jobs.id, attempts: jobs.attempts, max: jobs.maxAttempts }).from(jobs).where(eq(jobs.status, "pending"));
    console.log(`Debug: Total pending jobs: ${allPending.length}`);
    allPending.forEach(j => {
       console.log(` - Job ${j.id}: ${j.attempts}/${j.max} attempts`);
    });
  } else {
    console.log(`✅ Found ${candidates.length} candidates.`);
    candidates.forEach((j, i) => {
      console.log(` [${i+1}] ID: ${j.id}, Status: ${j.status}, Created: ${j.createdAt}, Attempts: ${j.attempts}`);
    });
    console.log(`\nNext job to pick: ${candidates[0].id}`);
  }
  
  process.exit(0);
}

run().catch(err => {
  console.error("Diagnostic failed:", err);
  process.exit(1);
});
