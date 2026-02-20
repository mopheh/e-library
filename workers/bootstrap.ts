import dotenv from "dotenv";

dotenv.config({ path: ".env.worker" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL missing after dotenv load");
}
