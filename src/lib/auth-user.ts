import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { userSettings, users } from "@/db/schema";

export type UpsertUserInput = {
  googleSub: string;
  email?: string | null;
  name?: string | null;
};

export async function upsertUserByGoogleSub(input: UpsertUserInput): Promise<{
  userId: string;
}> {
  const db = getDb();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.googleSub, input.googleSub))
    .limit(1);

  if (existing.length) {
    // Keep profile reasonably fresh.
    await db
      .update(users)
      .set({
        email: input.email ?? null,
        name: input.name ?? null,
      })
      .where(eq(users.id, existing[0]!.id));

    // Ensure settings row exists.
    await db
      .insert(userSettings)
      .values({ userId: existing[0]!.id })
      .onConflictDoNothing();

    return { userId: existing[0]!.id };
  }

  const inserted = await db
    .insert(users)
    .values({
      googleSub: input.googleSub,
      email: input.email ?? null,
      name: input.name ?? null,
    })
    .returning({ id: users.id });

  const userId = inserted[0]!.id;
  await db.insert(userSettings).values({ userId }).onConflictDoNothing();
  return { userId };
}

export async function getUserIdByGoogleSub(googleSub: string): Promise<string | null> {
  const db = getDb();
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.googleSub, googleSub))
    .limit(1);
  return rows[0]?.id ?? null;
}
