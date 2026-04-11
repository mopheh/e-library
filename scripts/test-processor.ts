import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });
config({ path: ".env.worker" });

// Removed static import
// Removed db import

async function test() {
  console.log("Testing processJob manually...");
  
  try {
     const { processJob } = await import("../workers/processor");
     await processJob({
       id: "294d5362-af7a-4567-bb97-c05c428e05a2",
       type: "parse_book",
       payload: { bookId: "6a05be0c-9cfd-40ca-ab74-9b908d39e998" },
       attempts: 1,
       maxAttempts: 3
     });
     console.log("Finished successfully");
  } catch (err) {
     console.error("Crash:", err);
  }
}
test();
