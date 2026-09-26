import { db } from "@/database/drizzle";
import { semesterResults } from "@/database/schema";
import { getCurrentUser } from "@/lib/auth";
import { b2KeyFromUrl, deleteB2File, signedB2ReadUrl, slipKeyPrefix } from "@/lib/b2-delete";
import { loadGrades } from "@/lib/grades";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

type Params = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f-]{36}$/i;

// Only ever returns a row the caller owns.
async function ownResult(id: string, userId: string) {
  if (!UUID.test(id)) return null;
  const [row] = await db
    .select()
    .from(semesterResults)
    .where(and(eq(semesterResults.id, id), eq(semesterResults.userId, userId)))
    .limit(1);
  return row ?? null;
}

async function removeSlipFile(url: string | null) {
  if (!url) return;
  try {
    await deleteB2File(url);
  } catch (err) {
    // The B2 orphan sweep would catch it later anyway
    console.error("[grades] Failed to delete result slip:", err);
  }
}

// View the attached result slip: a 5-minute signed link, owner only.
export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const row = await ownResult((await params).id, user.id);
    if (!row?.slipUrl) return NextResponse.json({ error: "No result slip attached" }, { status: 404 });

    const url = await signedB2ReadUrl(row.slipUrl);
    if (!url) return NextResponse.json({ error: "Slip unavailable" }, { status: 404 });
    return NextResponse.json({ url });
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error signing result slip:", error);
    return NextResponse.json({ error: "Couldn't open the slip" }, { status: 500 });
  }
}

const slipSchema = z.object({ slipUrl: z.string().url().nullable() });

// Attach, replace or remove the result slip.
export async function PATCH(req: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const row = await ownResult((await params).id, user.id);
    if (!row) return NextResponse.json({ error: "Semester not found" }, { status: 404 });

    const parsed = slipSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid slip" }, { status: 400 });
    }
    // Only files this student uploaded as a slip - otherwise anyone could
    // attach another file's URL and use GET to mint a signed link to it.
    if (parsed.data.slipUrl && !b2KeyFromUrl(parsed.data.slipUrl)?.startsWith(slipKeyPrefix(user.id))) {
      return NextResponse.json({ error: "Upload the slip through the app" }, { status: 400 });
    }

    await db
      .update(semesterResults)
      .set({ slipUrl: parsed.data.slipUrl, updatedAt: new Date() })
      .where(eq(semesterResults.id, row.id));
    if (row.slipUrl && row.slipUrl !== parsed.data.slipUrl) await removeSlipFile(row.slipUrl);

    return NextResponse.json(await loadGrades(user.id));
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error updating result slip:", error);
    return NextResponse.json({ error: "Couldn't update the slip" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const row = await ownResult((await params).id, user.id);
    if (!row) return NextResponse.json({ error: "Semester not found" }, { status: 404 });

    await db.delete(semesterResults).where(eq(semesterResults.id, row.id)); // cascades course_grades
    await removeSlipFile(row.slipUrl);

    return NextResponse.json(await loadGrades(user.id));
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error deleting semester:", error);
    return NextResponse.json({ error: "Couldn't delete this semester" }, { status: 500 });
  }
}
