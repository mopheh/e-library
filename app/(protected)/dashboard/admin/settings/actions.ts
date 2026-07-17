"use server";

import { db } from "@/database/drizzle";
import { systemSettings, users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const adminUser = await db.query.users.findFirst({ where: eq(users.clerkId, userId) });
  if (!adminUser || adminUser.role !== "ADMIN") throw new Error("Unauthorized");
  return adminUser;
}

export async function getSystemSettings() {
  const [settings] = await db.select().from(systemSettings).limit(1);
  return settings ?? { aiEnabled: true, matricFacultyCheckEnabled: false };
}

export async function setGlobalAiEnabled(enabled: boolean) {
  await requireAdmin();

  const [existing] = await db.select().from(systemSettings).limit(1);
  if (existing) {
    await db
      .update(systemSettings)
      .set({ aiEnabled: enabled, updatedAt: new Date() })
      .where(eq(systemSettings.id, existing.id));
  } else {
    await db.insert(systemSettings).values({ aiEnabled: enabled });
  }

  revalidatePath("/dashboard/manage");
}

export async function setUserAiEnabled(userId: string, enabled: boolean) {
  await requireAdmin();

  await db.update(users).set({ aiEnabled: enabled }).where(eq(users.id, userId));

  revalidatePath("/data/departments");
}

export async function setMatricFacultyCheckEnabled(enabled: boolean) {
  await requireAdmin();

  const [existing] = await db.select().from(systemSettings).limit(1);
  if (existing) {
    await db
      .update(systemSettings)
      .set({ matricFacultyCheckEnabled: enabled, updatedAt: new Date() })
      .where(eq(systemSettings.id, existing.id));
  } else {
    await db.insert(systemSettings).values({ matricFacultyCheckEnabled: enabled });
  }

  revalidatePath("/dashboard/manage");
  revalidatePath("/onboarding");
}
