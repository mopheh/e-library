import "dotenv/config";
import { db } from "./database/drizzle";
import { departments, courses } from "./database/schema";
import { eq, ilike } from "drizzle-orm";

async function run() {
  const depts = await db.select().from(departments).where(ilike(departments.name, "%electrical%"));
  if (depts.length === 0) {
    console.log("EEE department not found");
    return;
  }
  const eee = depts[0];
  console.log(`Found Dept: ${eee.name} (${eee.id})`);
  
  const c = await db.select().from(courses).where(eq(courses.departmentId, eee.id));
  console.log(`Courses for EEE:`);
  for (const course of c) {
    if (course.level === "500" || course.courseCode.includes("5")) {
      console.log(`- ${course.courseCode}: ${course.title} (Level: ${course.level})`);
    }
  }
}

run().catch(console.error);
