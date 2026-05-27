import "dotenv/config";
import { db } from "./database/drizzle";
import { books } from "./database/schema";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Fixing incorrect B2 cluster URLs in books table...");
  const result = await db.execute(sql`
    UPDATE books
    SET file_url = REPLACE(file_url, 'https://f000.backblazeb2.com', 'https://f005.backblazeb2.com')
    WHERE file_url LIKE '%https://f000.backblazeb2.com%';
  `);
  console.log(`Successfully updated ${result.rowCount} books.`);
  process.exit(0);
}

run().catch(console.error);
