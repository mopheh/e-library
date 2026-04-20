import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { postUtmeQuestions, postUtmeOptions } from "../database/schema";
import * as dotenv from "dotenv";

// Load environment variables from .env
dotenv.config({ path: ".env" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

/**
 * 🚀 CBT BOOTSTRAP SEED SCRIPT
 * Pings the ALOC (ALATest) API using Developer Token to fetch live Post-UTME questions.
 */

const SUBJECTS = [
  "english", "mathematics", "physics", "chemistry", "biology", 
  "commerce", "accounting", "government", "economics", "crk", "geography"
];
const ALOC_TOKEN = "ALOC-63b34f9a7bceb7e84746";

function stripHtml(html: string) {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, '').trim();
}

async function seedDatabase() {
  console.log("🌱 Starting Live CBT ALOC Bootstrap Seeding...");
  console.log("Connecting to database via Drizzle...");

  try {
    for (const subject of SUBJECTS) {
      console.log(`\n📡 Fetching batch for [${subject.toUpperCase()}] from ALATest API...`);
      try {
        const res = await fetch(`https://questions.aloc.com.ng/api/v2/m?subject=${subject}&type=utme`, {
          headers: {
            'AccessToken': ALOC_TOKEN,
            'Accept': 'application/json'
          }
        });
        
        if (!res.ok) {
           console.log(`⚠️ HTTP Error ${res.status} for ${subject}. Skipping...`);
           console.log(await res.text());
           continue;
        }

        const json = await res.json();
        
        if (!json.data || !Array.isArray(json.data)) {
           console.log(`⚠️ No valid data returned for ${subject}. Response:`, json);
           continue;
        }

        console.log(`✅ Received ${json.data.length} questions. Inserting into DB...`);
        let count = 0;
        for (const item of json.data) {
           // Insert Question
           const insertedQuestions = await db.insert(postUtmeQuestions).values({
               subject: subject.toLowerCase(),
               questionText: stripHtml(item.question),
               explanation: item.solution ? stripHtml(item.solution) : "No explanation provided.",
           }).returning({ id: postUtmeQuestions.id });
           
           const qId = insertedQuestions[0].id;
           const correctAnswerKey = String(item.answer).toLowerCase(); // "a", "b", "c", "d"
           
           // Insert Options
           const optionsToInsert = [];
           if (item.option && typeof item.option === 'object') {
             for (const [key, textVal] of Object.entries(item.option)) {
                if (textVal) {
                   optionsToInsert.push({
                      questionId: qId,
                      optionText: stripHtml(String(textVal)),
                      isCorrect: key.toLowerCase() === correctAnswerKey
                   });
                }
             }
           }
           
           if (optionsToInsert.length > 0) {
              await db.insert(postUtmeOptions).values(optionsToInsert);
           }
           count++;
        }
        console.log(`   └─ Successfully inserted ${count} questions & options for ${subject}.`);
        
        // Wait 2 seconds to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
         console.error(`❌ Failed to fetch/insert for ${subject}:`, e);
      }
    }

    console.log("\n🚀 ALOC Seed complete! Aspirants now have live CBT material.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error running ALOC seed script:", error);
    process.exit(1);
  }
}

seedDatabase();
