import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users, departments, faculty, departmentCommunities } from "../database/schema";
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";

// Load environment variables from .env
dotenv.config({ path: ".env" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

/**
 * 🚀 STUDENT CONNECT SEED SCRIPT
 * Populates each department with 5-10 verified students/mentors 
 * with department-specific interest tags.
 */

const DEPARTMENT_INTERESTS: Record<string, string[]> = {
  "Computer Science": ["Java", "Python", "Data Structures", "Algorithms", "Web Development", "AI/ML", "React"],
  "Electrical Engineering": ["Circuit Design", "Power Systems", "Control Theory", "Embedded Systems", "MATLAB", "IoT"],
  "Mechanical Engineering": ["AutoCAD", "Thermodynamics", "Fluid Mechanics", "Robotics", "SolidWorks", "Manufacturing"],
  "Civil Engineering": ["Structural Analysis", "Geotechnical", "Surveying", "Concrete Tech", "Hydraulics", "Project Management"],
  "Medicine": ["Anatomy", "Physiology", "Biochemistry", "Pathology", "Medical Ethics", "Surgery", "Clinical Research"],
  "Law": ["Criminal Law", "Civil Law", "Corporate Law", "Property Law", "Equity", "Legal Drafting", "Jurisprudence"],
  "Accounting": ["Audit", "Taxation", "Management Accounting", "Financial Reporting", "IFRS", "Corporate Finance"],
  "Economics": ["Microeconomics", "Macroeconomics", "Econometrics", "Public Finance", "Monetary Policy", "Data Analysis"],
  "Default": ["Academic Writing", "Time Management", "Study Skills", "Research Methodology", "Peer Mentorship"]
};

const NAMES = [
  "Emmanuel A.", "Blessing O.", "Chidi N.", "Fatima B.", "Samuel E.", 
  "Tunde R.", "Grace I.", "Ibrahim L.", "Kemi S.", "Victor W.",
  "David K.", "Sarah M.", "Oluchi P.", "Musa H.", "Funke D."
];

const LEVELS = ["100", "200", "300", "400", "500"] as const;

async function seedConnect() {
  console.log("🌱 Starting Student Connect Seeding...");

  try {
    const allDepartments = await db.select().from(departments);
    
    if (allDepartments.length === 0) {
      console.log("⚠️ No departments found. Please seed departments first.");
      process.exit(1);
    }

    console.log(`📡 Found ${allDepartments.length} departments. Seeding students...`);

    for (const dept of allDepartments) {
      const interestsSource = DEPARTMENT_INTERESTS[dept.name] || DEPARTMENT_INTERESTS["Default"];
      
      const studentsToCreate = Math.floor(Math.random() * 6) + 5; // 5 to 10 students
      
      console.log(`\n🏢 Seeding ${studentsToCreate} students for [${dept.name}]...`);

      for (let i = 0; i < studentsToCreate; i++) {
        const name = NAMES[Math.floor(Math.random() * NAMES.length)];
        const email = `${name.replace(/\s/g, '').toLowerCase()}${Math.floor(Math.random()*1000)}@univault.edu`;
        const level = LEVELS[Math.floor(Math.random() * LEVELS.length)];
        
        // Pick 3 random interests
        const shuffled = [...interestsSource].sort(() => 0.5 - Math.random());
        const selectedInterests = shuffled.slice(0, 3).join(", ");

        await db.insert(users).values({
          fullName: `${name} (${level}L)`,
          email: email,
          matricNo: `UV/${dept.name.substring(0,3).toUpperCase()}/${Math.floor(1000 + Math.random() * 9000)}`,
          role: Math.random() > 0.8 ? "FACULTY REP" : "STUDENT",
          facultyId: dept.facultyId,
          departmentId: dept.id,
          year: level,
          gender: Math.random() > 0.5 ? "MALE" : "FEMALE",
          address: "UniVault Campus Residence",
          interests: selectedInterests,
        }).onConflictDoNothing();
      }

      // Ensure a department community exists
      const existingCommunity = await db.query.departmentCommunities.findFirst({
        where: eq(departmentCommunities.departmentId, dept.id)
      });

      if (!existingCommunity) {
          console.log(`   └─ Creating community for ${dept.name}...`);
          await db.insert(departmentCommunities).values({
              departmentId: dept.id,
              name: `${dept.name} Community`,
              description: `Connecting students in the ${dept.name} department.`
          });
      }
    }

    console.log("\n🚀 Connect Seed complete! The Discovery Hub is now populated.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error running connect seed script:", error);
    process.exit(1);
  }
}

seedConnect();
