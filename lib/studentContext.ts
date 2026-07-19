import { db } from "@/database/drizzle";
import { studentCourses, courses, bookCourses, books, departments, faculty, users } from "@/database/schema";
import { eq, inArray, and } from "drizzle-orm";
import { withCache } from "@/lib/redis";

type ContextUser = Pick<
  typeof users.$inferSelect,
  "id" | "fullName" | "role" | "year" | "departmentId" | "facultyId"
>;

// Ambient "who am I talking to" context for the AI, built server-side from
// the DB rather than trusted from the client (dashboard/ai used to hand-roll
// this itself and send it as a system message — that message now gets
// stripped out anyway, since ai v7 forbids system-role entries in `messages`).
// Cached per-user for a few minutes since department/enrollment rarely change
// mid-session.
export async function getStudentContextBlock(user: ContextUser): Promise<string> {
  return withCache(`student-context:${user.id}`, 600, async () => {
    const [deptRow] = user.departmentId
      ? await db
          .select({ deptName: departments.name, facName: faculty.name })
          .from(departments)
          .leftJoin(faculty, eq(departments.facultyId, faculty.id))
          .where(eq(departments.id, user.departmentId))
          .limit(1)
      : [];

    const enrolled = await db
      .select({ courseId: courses.id, courseCode: courses.courseCode, title: courses.title })
      .from(studentCourses)
      .innerJoin(courses, eq(studentCourses.courseId, courses.id))
      .where(eq(studentCourses.userId, user.id));

    let materialsLine = "";
    if (enrolled.length > 0) {
      const materials = await db
        .select({ title: books.title })
        .from(bookCourses)
        .innerJoin(books, eq(bookCourses.bookId, books.id))
        .where(and(
          inArray(bookCourses.courseId, enrolled.map(c => c.courseId)),
          eq(books.reviewStatus, "APPROVED")
        ))
        .limit(40);

      if (materials.length > 0) {
        materialsLine = `\nMaterials available for these courses (bring up a specific title only when it's actually relevant): ${materials.map(m => m.title).join(", ")}`;
      }
    }

    const label = user.role === "STUDENT" || user.role === "ASPIRANT" ? "Student" : "User";
    const parts = [
      `${label}: ${user.fullName ?? "Unknown"}${user.year ? `, ${user.year} Level` : ""}`,
      deptRow?.deptName
        ? `Department: ${deptRow.deptName}${deptRow.facName ? ` (${deptRow.facName} faculty)` : ""}`
        : null,
      enrolled.length > 0
        ? `Registered courses: ${enrolled.map(c => `${c.courseCode} (${c.title})`).join(", ")}`
        : null,
    ].filter(Boolean);

    return parts.join("\n") + materialsLine;
  });
}
