const { neon } = require("@neondatabase/serverless");
const dotenv = require("dotenv");

dotenv.config({ path: ".env" });

const sql = neon(process.env.DATABASE_URL);

async function inspectTable() {
    try {
        const result = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'resource_requests'
        `;
        console.log("Columns in resource_requests:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Failed to inspect table:", e);
    }
}

inspectTable();
