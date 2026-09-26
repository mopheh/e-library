import { db } from "@/database/drizzle";
import { studyLogs } from "@/database/schema";
import { getCurrentUser } from "@/lib/auth";
import { invalidateCache } from "@/lib/redis";
import { invalidatePlan } from "@/lib/planner";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Log not found" }, { status: 404 });

    const deleted = await db
      .delete(studyLogs)
      .where(and(eq(studyLogs.id, id), eq(studyLogs.userId, user.id)))
      .returning({ id: studyLogs.id });

    if (deleted.length === 0) return NextResponse.json({ error: "Log not found" }, { status: 404 });

    await Promise.all([invalidateCache(`analytics:${user.id}`), invalidatePlan(user.id)]);
    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error deleting study log:", error);
    return NextResponse.json({ error: "Couldn't delete this log" }, { status: 500 });
  }
}
