import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as pdfjsLib from "pdfjs-dist";

// import { bookSchema } from "@/components/AddBook";
import {
  bookCourses,
  books,
  courses,
  jobs,
  users,
} from "@/database/schema";
import { db } from "@/database/drizzle";
import { and, eq, sql, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const departmentId = searchParams.get("departmentId");
    const courseId = searchParams.get("courseId");
    const type = searchParams.get("type");
    const level = searchParams.get("level");

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "12");

    if (!departmentId) {
      return NextResponse.json(
        { error: "departmentId is required" },
        { status: 400 },
      );
    }

    const conditions = [eq(books.departmentId, departmentId)];

    if (type) conditions.push(eq(books.type, type));
    if (courseId) conditions.push(eq(bookCourses.courseId, courseId));
    if (level) {
      // @ts-expect-error - level is a string in schema but being matched here
      conditions.push(eq(courses.level, level));
    }

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(books)
      .leftJoin(bookCourses, eq(books.id, bookCourses.bookId))
      .leftJoin(courses, eq(bookCourses.courseId, courses.id))
      .where(and(...conditions));

    const count = Number(countResult?.[0]?.count ?? 0);

    const booksWithCourses = await db
      .select({
        id: books.id,
        title: books.title,
        description: books.description,
        createdAt: books.createdAt,
        type: books.type,
        fileUrl: books.fileUrl,
        fileSize: books.fileSize,
        course: courses.courseCode,
        level: courses.level,
      })
      .from(books)
      .leftJoin(bookCourses, eq(books.id, bookCourses.bookId))
      .leftJoin(courses, eq(bookCourses.courseId, courses.id))
      .where(and(...conditions))
      .orderBy(desc(books.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return NextResponse.json({
      books: booksWithCourses,
      page,
      pageSize,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / pageSize),
    });
  } catch (error) {
    console.error("[GET /api/books]", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 },
    );
  }
}

// tell pdfjs to use worker-less mode (important for Next.js)
// eslint-disable-next-line @typescript-eslint/no-require-imports
pdfjsLib.GlobalWorkerOptions.workerSrc = require("pdfjs-dist/build/pdf.worker.min.js");

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // ---- Auth ----
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId));

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }
    
    // Authorization Check: Only ADMIN or FACULTY REP can upload materials
    if (user.role !== "ADMIN" && user.role !== "FACULTY REP") {
        return NextResponse.json({ error: "Forbidden: Insufficient privileges" }, { status: 403 });
    }

    const body = await req.json();

    const { title, description, departmentId, type, courseIds, fileUrl, link, fileSize } =
      body;

    if (!fileUrl && !link) {
      return NextResponse.json({ error: "Missing source" }, { status: 400 });
    }

    const [createdBook] = await db
      .insert(books)
      .values({
        title,
        description,
        departmentId,
        type,
        fileUrl,
        fileSize,
        postedBy: user.id,
        parseStatus: "processing",
      })
      .returning();

    if (courseIds?.length) {
      const courseLinks = courseIds.map((courseId: string) => ({
        bookId: createdBook.id,
        courseId,
      }));
      await db.insert(bookCourses).values(courseLinks);
    }
    await db.insert(jobs).values({
      type: "parse_book",
      payload: { bookId: createdBook.id },
    });

    return NextResponse.json({ ...createdBook }, { status: 201 });
  } catch (error: unknown) {
    console.error("[POST /api/books]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create book" },
      { status: 500 },
    );
  }
}
// export async function POST(req: NextRequest) {
//   try {
//     // ---- Auth ----
//     const { userId } = await auth();
//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
//
//     const [user] = await db
//         .select()
//         .from(users)
//         .where(eq(users.clerkId, userId));
//
//     if (!user) {
//       return NextResponse.json({ error: "User not found" }, { status: 401 });
//     }
//
//     // ---- Extract FormData ----
//     const formData = await req.formData();
//     const title = formData.get("title") as string;
//     const description = formData.get("description") as string;
//     const departmentId = formData.get("departmentId") as string;
//     const courseIds = (formData.getAll("courseIds[]") as string[]) || [];
//     const type = formData.get("type") as string;
//     const file = formData.get("file") as File | null;
//     const link = formData.get("link") as string | null;
//
//     if (!file && !link) {
//       return NextResponse.json(
//           { error: "No file or link provided" },
//           { status: 400 }
//       );
//     }
//
//     let fileUrl: string | null = null;
//     let pageCount = 0;
//     let parsedPages: { pageNumber: number; text: string }[] = [];
//
//     // ---- If File Provided ----
//     if (file) {
//       const buffer = Buffer.from(await file.arrayBuffer());
//       const ext = file.name.split(".").pop() || "pdf";
//       const objectName = `books/${uuidv4()}.${ext}`;
//
//       const { data: uploaded, error: uploadError } = await supabase.storage
//           .from("books")
//           .upload(objectName, buffer, {
//             contentType: file.type || "application/pdf",
//             upsert: false,
//           });
//
//       if (uploadError) {
//         console.error("Supabase upload error:", uploadError);
//         return NextResponse.json({ error: "Upload failed" }, { status: 500 });
//       }
//
//       const {
//         data: { publicUrl },
//       } = supabase.storage.from("books").getPublicUrl(uploaded.path);
//
//       fileUrl = publicUrl;
//
//       if (ext === "pdf") {
//         const uint8Array = new Uint8Array(buffer);
//         const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
//         pageCount = pdf.numPages;
//
//         for (let i = 1; i <= pageCount; i++) {
//           const page = await pdf.getPage(i);
//           const content = await page.getTextContent();
//           const strings = content.items
//               .map((item: any) => ("str" in item ? item.str : ""))
//               .filter(Boolean);
//
//           parsedPages.push({
//             pageNumber: i,
//             text: strings.join(" ").trim(),
//           });
//         }
//       }
//     }
//
//     // ---- If Link Provided ----
//     if (link && !file) {
//       fileUrl = link;
//
//       if (link.endsWith(".pdf")) {
//         const res = await fetch(link);
//         const buffer = Buffer.from(await res.arrayBuffer());
//         const uint8Array = new Uint8Array(buffer);
//         const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
//         pageCount = pdf.numPages;
//
//         for (let i = 1; i <= pageCount; i++) {
//           const page = await pdf.getPage(i);
//           const content = await page.getTextContent();
//           const strings = content.items
//               .map((item: any) => ("str" in item ? item.str : ""))
//               .filter(Boolean);
//
//           parsedPages.push({
//             pageNumber: i,
//             text: strings.join(" ").trim(),
//           });
//         }
//       }
//     }
//
//     // ---- Insert book record first ----
//     const [createdBook] = await db
//         .insert(books)
//         .values({
//           title,
//           description,
//           departmentId,
//           type,
//           fileUrl,
//           postedBy: user.id,
//           parseStatus: parsedPages.length ? "processing" : "skipped",
//           pageCount: pageCount || null,
//         } as any)
//         .returning();
//
//     // ---- Link courses ----
//     if (courseIds?.length) {
//       const courseLinks = courseIds.map((courseId) => ({
//         bookId: createdBook.id,
//         courseId,
//       }));
//       await db.insert(bookCourses).values(courseLinks);
//     }
//
//     // ---- Insert parsed pages with real bookId ----
//     if (parsedPages.length) {
//       await db.insert(bookPages).values(
//           parsedPages.map((p) => ({
//             bookId: createdBook.id,
//             pageNumber: p.pageNumber,
//             textChunk: p.text,
//           }))
//       );
//
//       // Mark parsing complete
//       await db
//           .update(books)
//           .set({ parseStatus: "completed" as any, pageCount })
//           .where(eq(books.id, createdBook.id));
//     }
//
//     return NextResponse.json(
//         { ...createdBook, pageCount },
//         { status: 201 }
//     );
//   } catch (error: any) {
//     console.error("[POST /api/books]", error);
//     return NextResponse.json(
//         { error: error?.message || "Failed to create book" },
//         { status: 500 }
//     );
//   }
// }
