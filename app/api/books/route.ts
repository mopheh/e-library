import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as pdfjsLib from "pdfjs-dist";
// import { bookSchema } from "@/components/AddBook";
import {
  bookCourses,
  bookPages,
  books,
  courses,
  users,
} from "@/database/schema";
import { db } from "@/database/drizzle";
import { and, eq, sql } from "drizzle-orm";

import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const departmentId = searchParams.get("departmentId");
    const courseId = searchParams.get("courseId");
    const type = searchParams.get("type");
    const level = searchParams.get("level");

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "12");

    // Early exit if departmentId is missing
    if (!departmentId) {
      return NextResponse.json(
        { error: "departmentId is required" },
        { status: 400 }
      );
    }

    // Base where clause
    const conditions = [eq(books.departmentId, departmentId)];

    if (type) conditions.push(eq(books.type, type));
    if (courseId) conditions.push(eq(bookCourses.courseId, courseId));
    if (level) {
      // @ts-ignore
      conditions.push(eq(courses.level, level));
    }

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(books)
      .leftJoin(bookCourses, eq(books.id, bookCourses.bookId))
      .leftJoin(courses, eq(bookCourses.courseId, courses.id))
      .where(and(...conditions));

    const count = Number(countResult?.[0]?.count ?? 0);
    // Get paginated data
    const booksWithCourses = await db
      .select({
        id: books.id,
        title: books.title,
        description: books.description,
        createdAt: books.createdAt,
        type: books.type,
        fileUrl: books.fileUrl,
        course: courses.courseCode,
        level: courses.level,
      })
      .from(books)
      .where(and(...conditions))
      .leftJoin(bookCourses, eq(books.id, bookCourses.bookId))
      .leftJoin(courses, eq(bookCourses.courseId, courses.id))
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
      { status: 500 }
    );
  }
}
// export async function POST(req: NextRequest) {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const [user] = await db
//       .select()
//       .from(users)
//       .where(eq(users.clerkId, userId));
//     console.log(user);
//     const body = await req.json();
//     // const validated = bookSchema.safeParse(body);
//     // if (!validated.success) {
//     //   return NextResponse.json(
//     //     { error: "Invalid Data", details: validated.error.flatten() },
//     //     { status: 400 },
//     //   );
//     // }

//     const { title, description, departmentId, courseIds, fileUrl, type } = body;

//     const [createdBook] = await db
//       .insert(books)
//       .values({
//         title,
//         description,
//         departmentId,
//         type,
//         fileUrl,
//         postedBy: user.id,
//       })
//       .returning();

//     const courseLinks = courseIds.map((courseId: any) => ({
//       bookId: createdBook.id,
//       courseId: courseId,
//     }));

//     await db.insert(bookCourses).values(courseLinks);
//     return NextResponse.json(createdBook, { status: 201 });
//   } catch (error) {
//     console.error("[POST /api/books]", error);
//     return NextResponse.json(
//       { error: "Failed to create book" },
//       { status: 500 }
//     );
//   }
// }
// export async function POST(req: Request) {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
//     const [user] = await db
//       .select()
//       .from(users)
//       .where(eq(users.clerkId, userId));
//     const formData = await req.formData();

//     const title = formData.get("title") as string;
//     const description = formData.get("description") as string;
//     const departmentId = formData.get("departmentId") as string;
//     const courseIds = formData.getAll("courseIds[]") as string[];
//     const type = formData.get("type") as string;
//     const file = formData.get("file") as File;

//     if (!file) {
//       return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
//     }

//     // Step 1: Save file temporarily to disk (needed for pdf-parse)
//     const tempFilePath = path.join("/tmp", `${uuidv4()}.pdf`);
//     const buffer = Buffer.from(await file.arrayBuffer());
//     fs.writeFileSync(tempFilePath, buffer);

//     // Step 2: Upload to Supabase storage
//     const { data: uploadData, error: uploadError } = await supabase.storage
//       .from("books")
//       .upload(`${uuidv4()}.pdf`, buffer, {
//         contentType: "application/pdf",
//         upsert: true,
//       });

//     if (uploadError) {
//       return NextResponse.json({ error: uploadError.message }, { status: 500 });
//     }

//     const { data: publicUrlData } = supabase.storage
//       .from("books")
//       .getPublicUrl(uploadData.path);

//     const fileUrl = publicUrlData.publicUrl;

//     // Step 3: Parse PDF into chunks
//     const chunks = await parsePdfToChunks(tempFilePath);

//     // Step 4: Insert book metadata
//     const [createdBook] = await db
//       .insert(books)
//       .values({
//         title,
//         description,
//         departmentId,
//         type,
//         fileUrl,
//         postedBy: user.id, // from auth
//       })
//       .returning();
//     const courseLinks = courseIds.map((courseId: any) => ({
//       bookId: createdBook.id,
//       courseId: courseId,
//     }));

//     await db.insert(bookCourses).values(courseLinks);
//     // Step 5: Insert pages in bulk
//     await db.insert(bookPages).values(
//       //@ts
//       chunks.map((c: { pageNumber: any; textChunk: any }) => ({
//         bookId: createdBook.id,
//         pageNumber: c.pageNumber,
//         textContent: c.textChunk,
//       }))
//     );

//     // Step 6: Cleanup temp file
//     fs.unlinkSync(tempFilePath);

//     return NextResponse.json({
//       message: "Book uploaded successfully",
//       book: createdBook,
//       pagesCount: chunks.length,
//     });
//   } catch (err: any) {
//     console.error("Error uploading book:", err);
//     return NextResponse.json(
//       { error: err.message || "Something went wrong" },
//       { status: 500 }
//     );
//   }
// }
// app/api/books/route.ts

// tell pdfjs to use worker-less mode (important for Next.js)
pdfjsLib.GlobalWorkerOptions.workerSrc = require("pdfjs-dist/build/pdf.worker.min.js");

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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

    // ---- Extract FormData ----
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const departmentId = formData.get("departmentId") as string;
    const courseIds = (formData.getAll("courseIds[]") as string[]) || [];
    const type = formData.get("type") as string;
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // ---- Upload to Supabase ----
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "pdf";
    const objectName = `books/${uuidv4()}.${ext}`;

    const { data: uploaded, error: uploadError } = await supabase.storage
      .from("books")
      .upload(objectName, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("books").getPublicUrl(uploaded.path);

    // ---- Insert book record ----
    const [createdBook] = await db
      .insert(books)
      .values({
        title,
        description,
        departmentId,
        type,
        fileUrl: publicUrl,
        postedBy: user.id,
        parseStatus: "processing" as any,
      } as any)
      .returning();

    // ---- Link courses ----
    if (courseIds?.length) {
      const courseLinks = courseIds.map((courseId) => ({
        bookId: createdBook.id,
        courseId,
      }));
      await db.insert(bookCourses).values(courseLinks);
    }
    const pages: { pageNumber: number; text: string }[] = [];
    // ---- Parse PDF into pages ----
    const uint8Array = new Uint8Array(buffer);
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    const numPages = pdf.numPages;

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // const text = content.items.map((item: any) => item.str).join(" ");
      // const text = content.items
      //   .map((item: any) => ("str" in item ? item.str : ""))
      //   .join(" ");
      //@ts-ignore
      // Collect all text strings
      const strings = content.items
        .map((item: any) => ("str" in item ? item.str : ""))
        .filter(Boolean);

      // Join them with space or newline
      const pageText = strings.join(" ");

      pages.push({
        pageNumber: i,
        text: pageText.trim(),
      });
    }
    const bookWithTexts = await db.insert(bookPages).values(
      pages.map((p) => ({
        bookId: createdBook.id,
        pageNumber: p.pageNumber,
        textChunk: p.text,
      }))
    );
    console.log(bookWithTexts);

    // ---- Mark parsing complete ----
    await db
      .update(books)
      .set({ parseStatus: "completed" as any, pageCount: numPages })
      .where(eq(books.id, createdBook.id));

    return NextResponse.json(
      { ...createdBook, pageCount: numPages },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[POST /api/books]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create book" },
      { status: 500 }
    );
  }
}
