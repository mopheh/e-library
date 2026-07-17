"use server";

import { db } from "@/database/drizzle";
import { books, users, notifications, departments } from "@/database/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { pusherServer } from "@/lib/pusher";

async function requireReviewer() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const currentUser = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "FACULTY REP")) {
    throw new Error("Forbidden");
  }
  return currentUser;
}

/** Faculty Reps operate faculty-wide (all departments in their faculty), not just their own department. */
async function departmentIdsForFacultyRep(currentUser: { facultyId: string | null }): Promise<string[]> {
  if (!currentUser.facultyId) return [];
  const depts = await db.select({ id: departments.id }).from(departments).where(eq(departments.facultyId, currentUser.facultyId));
  return depts.map((d) => d.id);
}

/**
 * Fetches Faculty Rep uploads awaiting review.
 * Admins see all departments' pending uploads. Faculty Reps see every
 * department in their own faculty.
 */
export async function getPendingBooks() {
  try {
    const currentUser = await requireReviewer();

    const conditions = [eq(books.reviewStatus, "PENDING")];
    if (currentUser.role === "FACULTY REP") {
      const deptIds = await departmentIdsForFacultyRep(currentUser);
      conditions.push(inArray(books.departmentId, deptIds.length ? deptIds : ["00000000-0000-0000-0000-000000000000"]));
    }

    const pending = await db.query.books.findMany({
      where: and(...conditions),
      with: {
        department: true,
        postedByUser: true,
      },
      orderBy: [desc(books.createdAt)],
      limit: 200,
    });

    if (pending.length > 0) {
      try {
        const clerkIds = pending.map((b) => b.postedByUser.clerkId);
        const client = await clerkClient();
        const clerkUsers = await client.users.getUserList({ userId: clerkIds, limit: 500 });
        const clerkMap = new Map(clerkUsers.data.map((u) => [u.id, u.imageUrl]));
        const mapped = pending.map((b) => ({
          ...b,
          postedByUser: { ...b.postedByUser, imageUrl: clerkMap.get(b.postedByUser.clerkId) || null },
        }));
        return { success: true, data: mapped };
      } catch (err) {
        console.error("Failed to fetch clerk images for pending books:", err);
      }
    }

    return { success: true, data: pending };
  } catch (error) {
    console.error("Error fetching pending books:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to load pending uploads" };
  }
}

export async function approveBook(bookId: string) {
  try {
    const currentUser = await requireReviewer();

    const book = await db.query.books.findFirst({ where: eq(books.id, bookId) });
    if (!book) throw new Error("Book not found");
    if (currentUser.role === "FACULTY REP") {
      const deptIds = await departmentIdsForFacultyRep(currentUser);
      if (!deptIds.includes(book.departmentId)) {
        throw new Error("You can only review uploads for departments in your own faculty.");
      }
    }

    await db.update(books).set({
      reviewStatus: "APPROVED",
      reviewedBy: currentUser.id,
      reviewedAt: new Date(),
      rejectionReason: null,
    }).where(eq(books.id, bookId));

    const [notif] = await db.insert(notifications).values({
      userId: book.postedBy,
      type: "GENERAL",
      message: `Your upload "${book.title}" has been approved and is now live.`,
      targetId: book.id,
    }).returning();

    pusherServer
      .trigger(`user-${book.postedBy}`, "new-notification", notif)
      .catch((err) => console.error("Pusher trigger failed (new-notification):", err));

    revalidatePath("/dashboard/manage");
    return { success: true };
  } catch (error) {
    console.error("Error approving book:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to approve upload" };
  }
}

export async function rejectBook(bookId: string, reason: string) {
  try {
    const currentUser = await requireReviewer();

    const book = await db.query.books.findFirst({ where: eq(books.id, bookId) });
    if (!book) throw new Error("Book not found");
    if (currentUser.role === "FACULTY REP") {
      const deptIds = await departmentIdsForFacultyRep(currentUser);
      if (!deptIds.includes(book.departmentId)) {
        throw new Error("You can only review uploads for departments in your own faculty.");
      }
    }

    await db.update(books).set({
      reviewStatus: "REJECTED",
      reviewedBy: currentUser.id,
      reviewedAt: new Date(),
      rejectionReason: reason || null,
    }).where(eq(books.id, bookId));

    const [notif] = await db.insert(notifications).values({
      userId: book.postedBy,
      type: "GENERAL",
      message: `Your upload "${book.title}" was rejected.${reason ? ` Reason: ${reason}` : ""}`,
      targetId: book.id,
    }).returning();

    pusherServer
      .trigger(`user-${book.postedBy}`, "new-notification", notif)
      .catch((err) => console.error("Pusher trigger failed (new-notification):", err));

    revalidatePath("/dashboard/manage");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting book:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to reject upload" };
  }
}
