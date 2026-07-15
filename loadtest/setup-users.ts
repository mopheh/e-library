// Provisions a pool of throwaway Clerk users + matching DB rows for k6 load
// testing, and mints a real Clerk session token for each. Run with:
//   npx tsx --env-file=.env loadtest/setup-users.ts
//
// Session tokens (not passwords) are written to loadtest/tokens.json, which
// is gitignored - each is a short-lived JWT k6 sends as `Authorization:
// Bearer <token>`, verified by clerkMiddleware exactly like a real browser
// session would be.
import { createClerkClient } from "@clerk/backend";
import { db } from "../database/drizzle";
import { users, departments, courses } from "../database/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const POOL_SIZE = Number(process.env.LOADTEST_POOL_SIZE || 50);
const TOKEN_TTL_SECONDS = 3 * 60 * 60; // 3 hours - comfortably outlives any single test run
const EMAIL_DOMAIN = "loadtest-e-library.example.com";
const LEVELS = ["100", "200", "300", "400", "500", "600"] as const;

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

async function main() {
  const depts = await db.select().from(departments).limit(10);
  if (depts.length === 0) {
    throw new Error("No departments found in DB - seed departments before running the load test.");
  }

  // One representative course per department, so k6 can also exercise the
  // courseId-scoped endpoints (study-rooms, workspaces) that got N+1 fixes.
  const courseByDept = new Map<string, string>();
  for (const dept of depts) {
    const [course] = await db.select({ id: courses.id }).from(courses).where(eq(courses.departmentId, dept.id)).limit(1);
    if (course) courseByDept.set(dept.id, course.id);
  }

  console.log(`Provisioning ${POOL_SIZE} load-test users across ${depts.length} departments...`);

  const tokens: { token: string; clerkId: string; departmentId: string; courseId: string | null }[] = [];

  for (let i = 0; i < POOL_SIZE; i++) {
    const dept = depts[i % depts.length];
    const email = `loadtest.user.${i}@${EMAIL_DOMAIN}`;
    const matricNo = `LOADTEST-${String(i).padStart(4, "0")}`;

    let clerkUser;
    try {
      clerkUser = await clerk.users.createUser({
        emailAddress: [email],
        password: `LoadTest!${i}${Date.now()}`,
        skipPasswordChecks: true,
        firstName: "LoadTest",
        lastName: `User${i}`,
        publicMetadata: { onboarded: true, role: "STUDENT" },
      });
    } catch (err: any) {
      // Already exists from a previous run - look it up instead of failing.
      const existing = await clerk.users.getUserList({ emailAddress: [email] });
      if (existing.data.length === 0) throw err;
      clerkUser = existing.data[0];
    }

    const existingDbUser = await db.select().from(users).where(eq(users.clerkId, clerkUser.id)).limit(1);
    if (existingDbUser.length === 0) {
      await db.insert(users).values({
        clerkId: clerkUser.id,
        fullName: `LoadTest User${i}`,
        email,
        year: LEVELS[i % LEVELS.length],
        facultyId: dept.facultyId,
        departmentId: dept.id,
        matricNo,
        role: "STUDENT",
        gender: i % 2 === 0 ? "MALE" : "FEMALE",
        address: "N/A",
      });
    }

    const session = await clerk.sessions.createSession({ userId: clerkUser.id });
    // Default session tokens expire after 60s (meant to be silently refreshed
    // by the Clerk frontend SDK). k6 has no such refresh loop, so mint a
    // token that outlives the whole test run instead.
    const { jwt } = await clerk.sessions.getToken(session.id, undefined, TOKEN_TTL_SECONDS);

    tokens.push({ token: jwt, clerkId: clerkUser.id, departmentId: dept.id, courseId: courseByDept.get(dept.id) ?? null });
    process.stdout.write(`\r  ${i + 1}/${POOL_SIZE}`);
  }
  console.log("\nDone.");

  const outPath = path.join(__dirname, "tokens.json");
  fs.writeFileSync(outPath, JSON.stringify(tokens, null, 2));
  console.log(`Wrote ${tokens.length} session tokens to ${outPath}`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
