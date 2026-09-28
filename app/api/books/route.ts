import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  bookCourses,
  books,
  courseDepartments,
  courses,
  jobs,
  users,
} from "@/database/schema";
import { db } from "@/database/drizzle";
import { and, eq, sql, desc, ilike, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { requireRole, getCurrentUser } from "@/lib/auth";
import * as Sentry from "@sentry/nextjs";
import { fieldErrors, materialDetailsSchema } from "@/lib/validation/contribution";

const MAX_FILE_BYTES = 50 * 1024 * 1024;
// Non-admins can't flood the review queue: past this many uploads awaiting
// review, new ones are refused until some are approved or rejected.
const MAX_PENDING_PER_USER = 10;

// Only files our own /api/b2 flow produced are accepted - never an arbitrary
// URL, which would let anyone publish a phishing / malware link as "material".
function isOwnBookFileUrl(fileUrl: string) {
  const host = process.env.B2_DELIVERY_ENDPOINT || "f005.backblazeb2.com";
  const bucket = process.env.B2_BUCKET;
  if (!bucket) return false;
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `^https://${esc(host)}/file/${esc(bucket)}/books/[0-9a-f-]{36}\\.(pdf|doc|docx|epub)$`,
    "i",
  ).test(fileUrl);
}

const bookSchema = materialDetailsSchema.extend({
  fileUrl: z.string().refine(isOwnBookFileUrl, "Upload the file again - that file link isn't valid"),
  fileSize: z.number().int().min(1, "The file is empty").max(MAX_FILE_BYTES, "Files must be 50MB or smaller"),
});

const reject = (status: number, error: string, fields?: Record<string, string>) =>
  NextResponse.json({ error, ...(fields && { fieldErrors: fields }) }, { status });

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const departmentId = searchParams.get("departmentId");
    const courseId = searchParams.get("courseId");
    const type = searchParams.get("type");
    const level = searchParams.get("level");
    const search = searchParams.get("search");

    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    // Clamp pageSize so a caller can't request an unbounded page (e.g. pageSize=999999)
    // and force a full-table scan/response.
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "12") || 12));

    if (!departmentId && !search) {
      return NextResponse.json(
        { error: "departmentId or search is required" },
        { status: 400 },
      );
    }

    // Pending/rejected Faculty Rep uploads are only visible to admins and
    // faculty reps explicitly asking for them (the review queue) — everyone
    // else only ever sees approved material, regardless of what they pass in.
    const requestedStatus = searchParams.get("reviewStatus");
    const currentUser = await getCurrentUser();
    const canSeeUnapproved = currentUser?.role === "ADMIN" || currentUser?.role === "FACULTY REP";
    const reviewStatusFilter =
      canSeeUnapproved && requestedStatus && ["PENDING", "APPROVED", "REJECTED"].includes(requestedStatus)
        ? requestedStatus
        : "APPROVED";

    // Build WHERE conditions on books itself (no JOIN-multiplied columns here)
    const bookConditions = [eq(books.reviewStatus, reviewStatusFilter as any)];
    if (departmentId) bookConditions.push(eq(books.departmentId, departmentId));
    if (type) bookConditions.push(eq(books.type, type));
    if (search && search.trim().length >= 2) {
      const pattern = `%${search.trim()}%`;
      bookConditions.push(
        or(ilike(books.title, pattern), ilike(books.description, pattern))!
      );
    }

    // courseId / level filters require a join — handled via sub-select
    const hasCourseFilter = !!(courseId || level);

    // ── Count (use DISTINCT to avoid inflation from multiple courses) ──
    const countResult = await db
      .select({ count: sql<number>`count(distinct ${books.id})` })
      .from(books)
      .leftJoin(bookCourses, eq(books.id, bookCourses.bookId))
      .leftJoin(courses, eq(bookCourses.courseId, courses.id))
      .where(
        and(
          ...bookConditions,
          ...(courseId ? [eq(bookCourses.courseId, courseId)] : []),
          ...(level ? [eq(courses.level, level as any)] : []),
        )
      );

    const count = Number(countResult?.[0]?.count ?? 0);

    // ── Aggregated fetch — one row per book, courses as "EEE531, EEE533" ──
    const booksWithCourses = await db
      .select({
        id: books.id,
        title: books.title,
        description: books.description,
        type: books.type,
        departmentId: books.departmentId,
        fileUrl: books.fileUrl,
        fileSize: books.fileSize,
        parseStatus: books.parseStatus,
        reviewStatus: books.reviewStatus,
        rejectionReason: books.rejectionReason,
        postedBy: books.postedBy,
        createdAt: books.createdAt,
        // Aggregate all linked course codes into one comma-separated string
        course: sql<string>`string_agg(distinct ${courses.courseCode}, ', ' order by ${courses.courseCode})`,
        // Also keep the highest level for filtering purposes
        level: sql<string>`max(${courses.level})`,
      })
      .from(books)
      .leftJoin(bookCourses, eq(books.id, bookCourses.bookId))
      .leftJoin(courses, eq(bookCourses.courseId, courses.id))
      .where(
        and(
          ...bookConditions,
          ...(courseId ? [eq(bookCourses.courseId, courseId)] : []),
          ...(level ? [eq(courses.level, level as any)] : []),
        )
      )
      // GROUP BY every non-aggregated book column so Postgres is happy
      .groupBy(
        books.id,
        books.title,
        books.description,
        books.type,
        books.departmentId,
        books.fileUrl,
        books.fileSize,
        books.parseStatus,
        books.reviewStatus,
        books.rejectionReason,
        books.postedBy,
        books.createdAt,
      )
      .orderBy(desc(books.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return NextResponse.json({
      books: booksWithCourses,
      page,
      pageSize,
      total: count,
      totalPages: Math.ceil(count / pageSize),
    });
  } catch (error) {
    Sentry.captureException(error);
    console.error("[GET /api/books]", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 },
    );
  }
}


export async function POST(req: Request) {
  try {
    const authCheck = await requireRole(["ADMIN", "FACULTY REP", "STUDENT"]);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const user = authCheck.user!;

    const result = bookSchema.safeParse(await req.json().catch(() => null));
    if (!result.success) {
      const fields = fieldErrors<string>(result.error);
      return reject(400, Object.values(fields)[0] || "Invalid material details", fields as Record<string, string>);
    }
    const { title, description, departmentId, type, courseIds, fileUrl, fileSize } = result.data;

    // Admin uploads publish immediately; everyone else's need admin
    // approval before students can see them.
    const isAdmin = user.role === "ADMIN";

    if (!isAdmin && departmentId !== user.departmentId) {
      return reject(403, "You can only contribute to your own department", {
        departmentId: "You can only contribute to your own department",
      });
    }

    // Every course must belong to (or be shared with) the chosen department.
    const validCourses = await db
      .select({ id: courses.id })
      .from(courses)
      .leftJoin(
        courseDepartments,
        and(eq(courseDepartments.courseId, courses.id), eq(courseDepartments.departmentId, departmentId)),
      )
      .where(
        and(
          inArray(courses.id, courseIds),
          or(eq(courses.departmentId, departmentId), eq(courseDepartments.departmentId, departmentId)),
        ),
      );
    if (new Set(validCourses.map((c) => c.id)).size !== courseIds.length) {
      return reject(400, "One of the selected courses isn't offered by this department", {
        courseIds: "One of the selected courses isn't offered by this department",
      });
    }

    const [dupe] = await db
      .select({ fileUrl: books.fileUrl, title: books.title })
      .from(books)
      .where(
        or(
          eq(books.fileUrl, fileUrl),
          and(eq(books.departmentId, departmentId), sql`lower(${books.title}) = lower(${title})`),
        ),
      )
      .limit(1);
    if (dupe) {
      return dupe.fileUrl === fileUrl
        ? reject(409, "This file has already been submitted")
        : reject(409, "Material with this exact title already exists in this department", {
            title: "This title is already taken in your department. Make it more specific, e.g. add the year or topic.",
          });
    }

    if (!isAdmin) {
      const [{ pending }] = await db
        .select({ pending: sql<number>`count(*)::int` })
        .from(books)
        .where(and(eq(books.postedBy, user.id), eq(books.reviewStatus, "PENDING")));
      if (pending >= MAX_PENDING_PER_USER) {
        return reject(
          429,
          `You have ${pending} uploads waiting for review. Please wait until some are reviewed before adding more.`,
        );
      }
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
        reviewStatus: isAdmin ? "APPROVED" : "PENDING",
        reviewedBy: isAdmin ? user.id : null,
        reviewedAt: isAdmin ? new Date() : null,
      })
      .returning();

    if (courseIds.length) {
      const courseLinks = courseIds.map((courseId) => ({
        bookId: createdBook.id,
        courseId,
      }));
      await db.insert(bookCourses).values(courseLinks);
    }

    // Trigger background parsing job
    await db.insert(jobs).values({
      type: "parse_book",
      payload: { bookId: createdBook.id },
    });

    return NextResponse.json(createdBook, { status: 201 });
  } catch (error) {
    Sentry.captureException(error);
    console.error("[POST /api/books]", error);
    return NextResponse.json(
      { error: "Failed to create book" },
      { status: 500 },
    );
  }
}
