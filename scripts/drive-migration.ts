/**
 * Google Drive Migration Script for UniVault
 * 
 * Logic:
 * 1. Authenticate with Google Drive Service Account
 * 2. Authenticate with Backblaze B2 (S3 API)
 * 3. Pre-fetch all Faculty, Departments, and Courses from DB for strict matching
 * 4. Recursively traverse Drive: Faculty -> Department -> Level -> Semester -> Course -> Books
 * 5. Stream files directly from Drive to B2
 * 6. Insert metadata into DB (books, book_courses, jobs)
 * 
 * Prerequisites:
 * - service-account.json in the root directory
 * - .env with DATABASE_URL, B2_KEY_ID, B2_APP_KEY, B2_BUCKET_NAME, B2_ENDPOINT
 * - Root Folder ID from Google Drive
 */

import "dotenv/config";

import { google } from "googleapis";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { db } from "../database/drizzle";
import { faculty, departments, courses, books, bookCourses, jobs, users } from "../database/schema";
import { eq, and, sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

// --- CONFIGURATION ---
const ROOT_FOLDER_ID = process.env.DRIVE_ROOT_FOLDER_ID; // Provide this in .env or hardcode
const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), "service-account.json");

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error("❌ Error: service-account.json not found in root directory.");
  process.exit(1);
}

// --- INITIALIZATION ---
const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_PATH,
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});
const drive = google.drive({ version: "v3", auth });

const s3Client = new S3Client({
  endpoint: process.env.B2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APP_KEY!,
  },
  region: "us-east-1", // B2 usually ignores this but SDK requires it
});

// --- CACHE ---
let facultyCache: any[] = [];
let departmentCache: any[] = [];
let courseCache: any[] = [];
let systemUserId: string | null = null;

async function prefetchData() {
  console.log("📥 Pre-fetching database records for strict matching...");
  facultyCache = await db.select().from(faculty);
  departmentCache = await db.select().from(departments);
  courseCache = await db.select().from(courses);
  
  // Find a system user (Admin or first user) to act as uploader
  const allUsers = await db.select().from(users).limit(5);
  const admin = allUsers.find(u => u.role === "ADMIN") || allUsers[0];
  
  if (!admin) {
    console.error("❌ Error: No users found in database to assign as uploader.");
    process.exit(1);
  }
  
  systemUserId = admin.id;
  console.log(`✅ Pre-fetch complete. Using user "${admin.fullName}" as system uploader.`);
}

// --- UTILS ---
function findFaculty(name: string) {
  const cleanName = name.replace(/^Faculty of\s+/i, "").trim().toLowerCase();
  return facultyCache.find(f => 
    f.name.toLowerCase().includes(cleanName) || 
    cleanName.includes(f.name.toLowerCase())
  );
}

function findDepartment(name: string, facultyId: string) {
  const cleanName = name.trim().toLowerCase();
  return departmentCache.find(d => 
    d.facultyId === facultyId && 
    (d.name.toLowerCase().includes(cleanName) || cleanName.includes(d.name.toLowerCase()))
  );
}

function findCourse(nameOrCode: string, departmentId: string) {
  const clean = nameOrCode.trim().toLowerCase();
  // Try to match by code (first word) or full title
  const code = clean.split(" ")[0];
  return courseCache.find(c => 
    c.departmentId === departmentId && 
    (c.courseCode.toLowerCase() === code || c.title.toLowerCase().includes(clean))
  );
}

async function uploadToB2(fileId: string, fileName: string, path: string): Promise<string> {
  const driveRes = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "stream" }
  );

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.B2_BUCKET!,
      Key: path,
      Body: driveRes.data,
      ContentType: "application/pdf",
    },
  });

  const result = await upload.done();
  // Construct public URL for B2
  const baseUrl = `https://f000.backblazeb2.com/file/${process.env.B2_BUCKET}`;
  return `${baseUrl}/${path}`;
}

// --- MIGRATION LOGIC ---
async function processFolder(folderId: string, depth: number, context: any = {}) {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id, name, mimeType, size)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const items = res.data.files || [];
  
  if (items.length === 0 && depth > 2) {
    // Log if a semester or course folder appears empty
    console.log(`${"  ".repeat(depth + 2)} ℹ️  Folder appears empty.`);
  }

  for (const item of items) {
    if (item.mimeType === "application/vnd.google-apps.folder") {
      // It's a folder
      const name = item.name!;
      
      if (depth === 0) { // Faculty Level
        const fac = findFaculty(name);
        if (fac) {
          console.log(`\n🏢 Found Faculty: ${fac.name}`);
          await processFolder(item.id!, depth + 1, { ...context, facultyId: fac.id });
        } else {
          console.warn(`⚠️  Skipping unknown Faculty folder: "${name}"`);
        }
      } 
      
      else if (depth === 1) { // Department Level
        const dept = findDepartment(name, context.facultyId);
        if (dept) {
          console.log(`  📂 Found Department: ${dept.name}`);
          await processFolder(item.id!, depth + 1, { ...context, departmentId: dept.id });
        } else {
          console.warn(`  ⚠️  Skipping unknown Department folder: "${name}"`);
        }
      }

      else if (depth === 2) { // Level (100, 200, ...)
        console.log(`    🔢 Level: ${name}`);
        await processFolder(item.id!, depth + 1, { ...context, level: name });
      }

      else if (depth === 3) { // Semester (First, Second)
        console.log(`      🕒 Semester: ${name}`);
        const semester = name.toLowerCase().includes("first") ? "FIRST" : "SECOND";
        await processFolder(item.id!, depth + 1, { ...context, semester });
      }

      else if (depth === 4) { // Course Folder
        const courseMatch = findCourse(name, context.departmentId);
        if (courseMatch) {
          console.log(`        📚 Course Match: ${courseMatch.courseCode} - ${courseMatch.title}`);
          await processFolder(item.id!, depth + 1, { ...context, courseId: courseMatch.id, courseTitle: courseMatch.title });
        } else {
          console.warn(`        ⚠️  Course folder "${name}" not found in DB. Skipping books inside.`);
        }
      }
    } 
    
    else if (item.mimeType === "application/pdf" && depth === 5) {
      // It's a book file
      console.log(`          🚀 Uploading Book: ${item.name}`);
      
      const title = item.name!.replace(".pdf", "").replace(/_/g, " ").replace(/-/g, " ");
      const b2Path = `books/${context.departmentId}/${item.id}-${item.name}`;
      
      try {
        const fileUrl = await uploadToB2(item.id!, item.name!, b2Path);
        
        // Save to DB
        const [newBook] = await db.insert(books).values({
          title,
          description: `Academic material for ${context.courseTitle || "your course"}.`,
          type: item.name?.toLowerCase().includes("past question") ? "Past Question" : "Material",
          departmentId: context.departmentId,
          fileUrl,
          fileSize: parseInt(item.size || "0"),
          postedBy: systemUserId!,
          parseStatus: "pending",
        }).returning();

        // Link to course
        await db.insert(bookCourses).values({
          bookId: newBook.id,
          courseId: context.courseId,
        });

        // Trigger AI Parse Job
        await db.insert(jobs).values({
          type: "parse_book",
          payload: { bookId: newBook.id },
          status: "pending",
        });

        console.log(`          ✅ Success: ${title}`);
      } catch (err: any) {
        console.error(`          ❌ Failed to upload ${item.name}:`, err.message);
      }
    }
  }
}

async function run() {
  if (!ROOT_FOLDER_ID) {
    console.error("❌ Error: DRIVE_ROOT_FOLDER_ID not found in environment variables.");
    process.exit(1);
  }

  await prefetchData();
  console.log("\n🚀 Starting Drive Traversal...\n");
  await processFolder(ROOT_FOLDER_ID, 0);
  console.log("\n🎉 Migration Complete!");
  process.exit(0);
}

run();
