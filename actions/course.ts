"use server";

import { db } from "@/database/drizzle";
import { courses, courseDepartments } from "@/database/schema";
import { and, eq, sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { guarded, redis, redisAvailable } from "@/lib/redis";
import { courseCodeKey, courseSchema, fieldErrors, type CourseField, type CourseInput } from "@/lib/validation/contribution";

type Courses = {
  courseCode: string;
  title: string;
  departmentId: string;
  unitLoad: number;
  semester: string;
  level: string;
  departments: string[]; // borrowing department IDs
};

export const createCourses = async (data: Courses) => {
  try {
    if (!data) throw new Error("Course is required");

    const authCheck = await requireRole(["ADMIN", "FACULTY REP"]);
    if (!authCheck.authorized) {
      throw new Error(authCheck.error || "Unauthorized");
    }

    const existingCourse = await db
      .select()
      .from(courses)
      .where(eq(courses.courseCode, data.courseCode))
      .limit(1);

    if (existingCourse.length > 0) {
      throw new Error("Course already exists");
    }

    // @ts-ignore
    const [newCourse] = await db
      .insert(courses)
      .values({
        courseCode: data.courseCode,
        title: data.title,
        departmentId: data.departmentId,
        unitLoad: data.unitLoad,
        semester: data.semester as any,
        level: data.level as any,
      })
      .returning({ id: courses.id });

    // Insert borrowing departments into the junction table
    if (data.departments && data.departments.length > 0) {
      const rows = data.departments
        .filter((dId) => dId !== data.departmentId) // exclude owner dept (optional de-dup)
        .map((departmentId) => ({
          courseId: newCourse.id,
          departmentId,
        }));

      if (rows.length > 0) {
        await db.insert(courseDepartments).values(rows);
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error occurred";
    throw new Error(message);
  }
};

export const getCoursesByDepartment = async (departmentId: string) => {
  return db
    .select({
      id: courses.id,
      title: courses.title,
      courseCode: courses.courseCode,
    })
    .from(courses)
    .where(eq(courses.departmentId, departmentId));
};

/** Replace all borrowing departments for a course */
export const updateCourseDepartments = async (
  courseId: string,
  departmentIds: string[],
) => {
  const authCheck = await requireRole(["ADMIN", "FACULTY REP"]);
  if (!authCheck.authorized) {
    throw new Error(authCheck.error || "Unauthorized");
  }

  // Delete existing entries
  await db
    .delete(courseDepartments)
    .where(eq(courseDepartments.courseId, courseId));

  if (departmentIds.length === 0) return;

  await db.insert(courseDepartments).values(
    departmentIds.map((departmentId) => ({ courseId, departmentId })),
  );
};

/** Get the list of borrowing department IDs for a course */
export const getCourseDepartments = async (courseId: string) => {
  const rows = await db
    .select({ departmentId: courseDepartments.departmentId })
    .from(courseDepartments)
    .where(eq(courseDepartments.courseId, courseId));
  return rows.map((r) => r.departmentId);
};

// Non-admins adding courses is a spam vector (course lists feed registration,
// grades and the library), so cap it per user per day.
const COURSE_ADDS_PER_DAY = 5;

async function overDailyCourseLimit(userId: string) {
  if (!redisAvailable()) return false; // fail open: validation still applies
  try {
    const key = `course-quick-add:${userId}:${new Date().toISOString().slice(0, 10)}`;
    const count = await guarded(() => redis!.incr(key));
    if (count === 1) await guarded(() => redis!.expire(key, 60 * 60 * 24));
    return count > COURSE_ADDS_PER_DAY;
  } catch {
    return false;
  }
}

export type QuickCourseInput = CourseInput;
export type QuickCourseResult =
  | {
      ok: true;
      course: { id: string; courseCode: string; title: string };
      /** "created" = new course; "linked" = existing course from another department now shared with this one; "existing" = already in this department */
      outcome: "created" | "linked" | "existing";
    }
  | { ok: false; error: string; fieldErrors?: Partial<Record<CourseField, string>> };

/**
 * Lets anyone contributing material add a missing course inline, without
 * going through the admin course manager. Students and faculty reps can only
 * add to their own department; admins to any. If the code already exists
 * elsewhere (e.g. a GST course), it's shared with this department instead of
 * duplicated. Returns a result object rather than throwing, because Next
 * masks thrown server-action messages in production.
 */
export const quickCreateCourse = async (input: QuickCourseInput): Promise<QuickCourseResult> => {
  const authCheck = await requireRole(["ADMIN", "FACULTY REP", "STUDENT"]);
  if (!authCheck.authorized) return { ok: false, error: authCheck.error || "Unauthorized" };
  const user = authCheck.user!;

  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) {
    const fields = fieldErrors<CourseField>(parsed.error);
    return { ok: false, error: Object.values(fields)[0] || "Invalid course", fieldErrors: fields };
  }
  const data = parsed.data;

  const isAdmin = user.role === "ADMIN";
  if (!isAdmin && data.departmentId !== user.departmentId) {
    return { ok: false, error: "You can only add courses to your own department" };
  }
  if (!isAdmin && (await overDailyCourseLimit(user.id))) {
    return {
      ok: false,
      error: `You've added ${COURSE_ADDS_PER_DAY} courses today. Ask your faculty rep if you need more.`,
    };
  }

  try {
    const [existing] = await db
      .select({ id: courses.id, courseCode: courses.courseCode, title: courses.title, departmentId: courses.departmentId })
      .from(courses)
      // Match regardless of spacing, so "CSC 201" and a stray legacy "CSC201" are the same course.
      .where(sql`upper(replace(${courses.courseCode}, ' ', '')) = ${courseCodeKey(data.courseCode)}`)
      .limit(1);

    if (existing) {
      const course = { id: existing.id, courseCode: existing.courseCode, title: existing.title };
      if (existing.departmentId === data.departmentId) return { ok: true, course, outcome: "existing" };

      const [link] = await db
        .select({ id: courseDepartments.id })
        .from(courseDepartments)
        .where(and(eq(courseDepartments.courseId, existing.id), eq(courseDepartments.departmentId, data.departmentId)))
        .limit(1);
      if (link) return { ok: true, course, outcome: "existing" };

      await db
        .insert(courseDepartments)
        .values({ courseId: existing.id, departmentId: data.departmentId })
        .onConflictDoNothing();
      return { ok: true, course, outcome: "linked" };
    }

    const [created] = await db
      .insert(courses)
      .values({
        courseCode: data.courseCode,
        title: data.title,
        departmentId: data.departmentId,
        unitLoad: data.unitLoad,
        semester: data.semester,
        level: data.level,
      })
      .onConflictDoNothing({ target: courses.courseCode })
      .returning({ id: courses.id, courseCode: courses.courseCode, title: courses.title });

    // Lost a race with someone adding the same code at the same moment.
    if (!created) return { ok: false, error: `${data.courseCode} was just added. Refresh the course list and pick it.` };

    return { ok: true, course: created, outcome: "created" };
  } catch (e) {
    console.error("quickCreateCourse failed:", e);
    return { ok: false, error: "Couldn't add the course. Please try again." };
  }
};
