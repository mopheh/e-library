import "dotenv/config";
import { db } from "./database/drizzle";
import { faculty, departments, courses } from "./database/schema";
import { sql } from "drizzle-orm";

async function main() {
  const [facultyCount] = await db.select({ count: sql<number>`count(*)` }).from(faculty);
  const [deptCount] = await db.select({ count: sql<number>`count(*)` }).from(departments);
  const [courseCount] = await db.select({ count: sql<number>`count(*)` }).from(courses);
  
  console.log(`Faculties: ${facultyCount.count}`);
  console.log(`Departments: ${deptCount.count}`);
  console.log(`Courses: ${courseCount.count}`);

  const facultiesList = await db.select().from(faculty).limit(5);
  console.log("Sample Faculties:");
  console.log(facultiesList);
  process.exit(0);
}

main().catch(console.error);
