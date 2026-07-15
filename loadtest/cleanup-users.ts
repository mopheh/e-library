// Deletes the throwaway Clerk load-test users (and their matching DB rows)
// created by setup-users.ts, once load testing is done. Run with:
//   npx tsx --env-file=.env loadtest/cleanup-users.ts
import { createClerkClient } from "@clerk/backend";
import { db } from "../database/drizzle";
import { users } from "../database/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const EMAIL_DOMAIN = "loadtest-e-library.example.com";
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

async function main() {
  let offset = 0;
  let deleted = 0;

  while (true) {
    const page = await clerk.users.getUserList({ query: EMAIL_DOMAIN, limit: 100, offset });
    if (page.data.length === 0) break;

    for (const u of page.data) {
      const email = u.emailAddresses[0]?.emailAddress || "";
      if (!email.endsWith(`@${EMAIL_DOMAIN}`)) continue;

      await db.delete(users).where(eq(users.clerkId, u.id));
      await clerk.users.deleteUser(u.id);
      deleted++;
      process.stdout.write(`\rDeleted ${deleted}`);
    }
    offset += page.data.length;
  }
  console.log(`\nDone. Deleted ${deleted} load-test users.`);

  const tokensPath = path.join(__dirname, "tokens.json");
  if (fs.existsSync(tokensPath)) {
    fs.unlinkSync(tokensPath);
    console.log("Removed loadtest/tokens.json");
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
