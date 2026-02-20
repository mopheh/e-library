import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/database/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set for worker");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true, // Neon requires SSL
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
});

export const db = drizzle(pool, { schema });
