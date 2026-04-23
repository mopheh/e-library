import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "../database/drizzle";
import { sql } from "drizzle-orm";

async function checkTables() {
    try {
        const result = await db.execute(sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('chat_rooms', 'chat_messages');
        `);
        console.log("Tables found:", result.rows);
        process.exit(0);
    } catch (err) {
        console.error("Error checking tables:", err);
        process.exit(1);
    }
}

checkTables();
