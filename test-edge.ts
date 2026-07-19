import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import dotenv from "dotenv";
dotenv.config();
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql });
async function run() {
  const result = await db.execute("SELECT 1");
  console.log(result);
}
run();
