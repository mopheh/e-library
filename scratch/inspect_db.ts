import { db } from "../database/drizzle";
import { sql } from "drizzle-orm";

async function inspectTable() {
    try {
        const result = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'resource_requests'
        `);
        console.log("Columns in resource_requests:", JSON.stringify(result.rows, null, 2));
    } catch (e) {
        console.error("Failed to inspect table:", e);
    }
}

inspectTable();
