const { neon } = require("@neondatabase/serverless");
const dotenv = require("dotenv");

dotenv.config({ path: ".env" });

const sql = neon(process.env.DATABASE_URL);

async function repairTable() {
    try {
        console.log("Adding fulfilled_url to resource_requests...");
        await sql`ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS fulfilled_url text;`;
        console.log("Success! fulfilled_url added.");
        
        const result = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'resource_requests'
        `;
        console.log("Current Columns in resource_requests:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Failed to repair table:", e);
    }
}

repairTable();
