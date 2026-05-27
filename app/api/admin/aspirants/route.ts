import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import {
  users,
  candidateProfiles,
  verificationRequests,
  departments,
  faculty,
  candidateAttempts,
} from "@/database/schema";
import { eq, desc, count, sql, ilike, or, and } from "drizzle-orm";
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authCheck = await requireRole(["ADMIN", "FACULTY REP"]);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const statusFilter = searchParams.get("status") ?? "ALL"; // ALL | PENDING | APPROVED | REJECTED | NO_REQUEST
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") ?? "20"));

    // --- Fetch all aspirants ---
    const conditions: any[] = [eq(users.role, "ASPIRANT")];
    if (search.trim().length >= 2) {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(users.fullName, pattern),
          ilike(users.email, pattern)
        )!
      );
    }

    const allAspirants = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        createdAt: users.createdAt,
        // From candidateProfiles
        jambScore: candidateProfiles.jambScore,
        intendedDepartmentId: candidateProfiles.intendedDepartmentId,
        subjectCombinations: candidateProfiles.subjectCombinations,
        // Latest verification request status
        verificationStatus: verificationRequests.status,
        verificationId: verificationRequests.id,
        jambNo: verificationRequests.jambNo,
        level: verificationRequests.level,
        admissionYear: verificationRequests.admissionYear,
        verificationCreatedAt: verificationRequests.createdAt,
        // Intended department / faculty from verification
        deptName: departments.name,
        facultyName: faculty.name,
        // CBT attempts count
        cbtAttempts: sql<number>`(
          select count(*) from candidate_attempts ca where ca.user_id = ${users.id}
        )`,
      })
      .from(users)
      .leftJoin(candidateProfiles, eq(candidateProfiles.userId, users.id))
      .leftJoin(
        verificationRequests,
        and(
          eq(verificationRequests.userId, users.id),
          // Pick the most recent verification request via subquery
          eq(
            verificationRequests.id,
            sql`(select vr.id from verification_requests vr where vr.user_id = ${users.id} order by vr.created_at desc limit 1)`
          )
        )
      )
      .leftJoin(departments, eq(departments.id, verificationRequests.approvedDepartmentId))
      .leftJoin(faculty, eq(faculty.id, verificationRequests.approvedFacultyId))
      .where(and(...conditions))
      .orderBy(desc(users.createdAt));

    // Client-side status filter (simpler than a complex SQL branch)
    const filtered = allAspirants.filter((a) => {
      if (statusFilter === "ALL") return true;
      if (statusFilter === "NO_REQUEST") return !a.verificationStatus;
      return a.verificationStatus === statusFilter;
    });

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    // --- Summary stats ---
    const pending = allAspirants.filter((a) => a.verificationStatus === "PENDING").length;
    const approved = allAspirants.filter((a) => a.verificationStatus === "APPROVED").length;
    const rejected = allAspirants.filter((a) => a.verificationStatus === "REJECTED").length;
    const noRequest = allAspirants.filter((a) => !a.verificationStatus).length;

    return NextResponse.json({
      aspirants: paginated,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      page,
      stats: {
        total: allAspirants.length,
        pending,
        approved,
        rejected,
        noRequest,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/admin/aspirants]", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
