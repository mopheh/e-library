import { db } from "@/database/drizzle";
import {
  users,
  departments,
  faculty,
  userBooks,
  readingSessions,
  sessions,
  studentCourses,
} from "@/database/schema";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";

async function getSummaryStats() {
  const roleCounts = await db
    .select({
      role: users.role,
      count: sql<number>`count(*)`,
    })
    .from(users)
    .groupBy(users.role);

  const facultyCounts = await db
    .select({
      faculty: faculty.name,
      total: sql<number>`count(*)`,
      students: sql<number>`count(*) filter (where ${users.role} = 'STUDENT')`,
      aspirants: sql<number>`count(*) filter (where ${users.role} = 'ASPIRANT')`,
    })
    .from(users)
    .leftJoin(faculty, eq(users.facultyId, faculty.id))
    .groupBy(faculty.name)
    .orderBy(faculty.name);

  const totalUsers = roleCounts.reduce((sum, r) => sum + Number(r.count), 0);
  const roleMap: Record<string, number> = {};
  for (const r of roleCounts) {
    roleMap[r.role ?? "UNKNOWN"] = Number(r.count);
  }

  const lines: string[] = [
    "PLATFORM SUMMARY",
    "",
    `Report Generated,${new Date().toLocaleDateString("en-NG")}`,
    "",
    "Role,Count",
    `Total Users,${totalUsers}`,
    `Students,${roleMap["STUDENT"] || 0}`,
    `Aspirants,${roleMap["ASPIRANT"] || 0}`,
    `Faculty Reps,${roleMap["FACULTY REP"] || 0}`,
    `Admins,${roleMap["ADMIN"] || 0}`,
    "",
    "STUDENTS BY FACULTY",
    "",
    "Faculty,Total,Students,Aspirants",
    ...facultyCounts.map(
      (f) =>
        `${escapeCsv(f.faculty || "Unassigned")},${f.total},${f.students},${f.aspirants}`
    ),
    "",
    "---",
    "",
  ];

  return lines;
}

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  try {
    const authCheck = await requireRole(["ADMIN"]);
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { searchParams } = new URL(req.url);
    const exportType = searchParams.get("type") || "students";

    if (exportType === "students") {
      return await exportStudents();
    }

    if (exportType === "activity") {
      return await exportActivity();
    }

    return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
  } catch (error) {
    console.error("[GET /api/admin/export]", error);
    return NextResponse.json(
      { error: "Failed to generate export" },
      { status: 500 }
    );
  }
}

async function exportStudents() {
  const summary = await getSummaryStats();

  const rows = await db
    .select({
      fullName: users.fullName,
      email: users.email,
      matricNo: users.matricNo,
      role: users.role,
      level: users.year,
      gender: users.gender,
      phone: users.phoneNumber,
      department: departments.name,
      faculty: faculty.name,
      aiEnabled: users.aiEnabled,
      lastActivity: users.lastActivityDate,
      joinedAt: users.createdAt,
    })
    .from(users)
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .leftJoin(faculty, eq(users.facultyId, faculty.id))
    .orderBy(users.fullName);

  const headers = [
    "Full Name",
    "Email",
    "Matric No",
    "Role",
    "Level",
    "Gender",
    "Phone",
    "Department",
    "Faculty",
    "AI Enabled",
    "Last Active",
    "Joined",
  ];

  const csvRows = rows.map((r) =>
    [
      r.fullName,
      r.email,
      r.matricNo,
      r.role,
      r.level,
      r.gender,
      r.phone,
      r.department,
      r.faculty,
      r.aiEnabled ? "Yes" : "No",
      r.lastActivity
        ? new Date(r.lastActivity).toLocaleDateString("en-NG")
        : "",
      r.joinedAt ? new Date(r.joinedAt).toLocaleDateString("en-NG") : "",
    ]
      .map(escapeCsv)
      .join(",")
  );

  const csv = [...summary, headers.join(","), ...csvRows].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="students-report-${date}.csv"`,
    },
  });
}

async function exportActivity() {
  const summary = await getSummaryStats();

  const rows = await db
    .select({
      fullName: users.fullName,
      email: users.email,
      matricNo: users.matricNo,
      role: users.role,
      level: users.year,
      department: departments.name,
      faculty: faculty.name,
      booksAccessed: sql<number>`coalesce((
        select count(*) from ${userBooks} ub where ub.user_id = ${users.id}
      ), 0)`,
      totalReadingMinutes: sql<number>`coalesce((
        select sum(${readingSessions.duration}) from ${readingSessions} rs where rs.user_id = ${users.id}
      ), 0)`,
      totalPagesRead: sql<number>`coalesce((
        select sum(${readingSessions.pagesRead}) from ${readingSessions} rs where rs.user_id = ${users.id}
      ), 0)`,
      cbtSessions: sql<number>`coalesce((
        select count(*) from ${sessions} s where s.user_id = ${users.id}
      ), 0)`,
      avgCbtScore: sql<number>`coalesce((
        select round(avg(s.score)::numeric, 1) from ${sessions} s where s.user_id = ${users.id} and s.score is not null
      ), 0)`,
      coursesEnrolled: sql<number>`coalesce((
        select count(*) from ${studentCourses} sc where sc.user_id = ${users.id}
      ), 0)`,
    })
    .from(users)
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .leftJoin(faculty, eq(users.facultyId, faculty.id))
    .orderBy(users.fullName);

  const headers = [
    "Full Name",
    "Email",
    "Matric No",
    "Role",
    "Level",
    "Department",
    "Faculty",
    "Books Accessed",
    "Reading Minutes",
    "Pages Read",
    "CBT Sessions",
    "Avg CBT Score",
    "Courses Enrolled",
  ];

  const csvRows = rows.map((r) =>
    [
      r.fullName,
      r.email,
      r.matricNo,
      r.role,
      r.level,
      r.department,
      r.faculty,
      r.booksAccessed,
      r.totalReadingMinutes,
      r.totalPagesRead,
      r.cbtSessions,
      r.avgCbtScore,
      r.coursesEnrolled,
    ]
      .map(escapeCsv)
      .join(",")
  );

  const csv = [...summary, headers.join(","), ...csvRows].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="activity-report-${date}.csv"`,
    },
  });
}
