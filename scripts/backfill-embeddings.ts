import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });
config({ path: ".env.worker" });

import { bookPages } from "../database/schema";
import { isNull, eq } from "drizzle-orm";

async function run() {
  const { db } = await import("../database/drizzle");
  const { getEmbedding } = await import("../lib/embeddings");
  console.log("Fetching book pages without embeddings...");
  
  const pages = await db
    .select({
      id: bookPages.id,
      textChunk: bookPages.textChunk,
    })
    .from(bookPages)
    .where(isNull(bookPages.embedding));

  console.log(`Found ${pages.length} pages to backfill.`);

  let successCount = 0;
  
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (!page.textChunk) continue;

    console.log(`[${i + 1}/${pages.length}] Embedding page ${page.id}...`);
    
    try {
      const embedding = await getEmbedding(page.textChunk);
      if (embedding.length > 0) {
        await db
          .update(bookPages)
          .set({ embedding })
          .where(eq(bookPages.id, page.id));
        successCount++;
      } else {
         console.warn(`Empty embedding returned for page ${page.id}`);
      }
    } catch (err) {
      console.error(`Error processing page ${page.id}:`, err);
    }
  }

  console.log(`Backfill completed. Processed ${pages.length} pages, successfully embedded ${successCount}.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
