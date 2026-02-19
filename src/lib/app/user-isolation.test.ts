import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { getDb } from "@/db";
import { migrateDb } from "@/db/migrate";
import { feeds, rules, users } from "@/db/schema";
import { addRule } from "@/lib/app/rules";

describe("user isolation", () => {
  it("does not allow user B to delete user A's feed when queries are user-scoped", async () => {
    if (!process.env.DATABASE_URL) return;

    await migrateDb();
    const db = getDb();

    const u = await db
      .insert(users)
      .values([{ googleSub: `test-sub-a-${randomUUID()}` }, { googleSub: `test-sub-b-${randomUUID()}` }])
      .returning({ id: users.id });

    const userA = u[0]!.id;
    const userB = u[1]!.id;

    const f = await db
      .insert(feeds)
      .values({
        userId: userA,
        name: "A",
        url: `https://example.com/${randomUUID()}.xml`,
      })
      .returning({ id: feeds.id });

    const feedId = f[0]!.id;

    // A user mismatch should yield no deletion.
    await db.delete(feeds).where(and(eq(feeds.userId, userB), eq(feeds.id, feedId)));

    const stillThere = await db
      .select({ id: feeds.id })
      .from(feeds)
      .where(and(eq(feeds.userId, userA), eq(feeds.id, feedId)))
      .limit(1);

    expect(stillThere.length).toBe(1);
  });

  it("does not allow creating a scoped rule against another user's feed", async () => {
    if (!process.env.DATABASE_URL) return;

    await migrateDb();
    const db = getDb();

    const u = await db
      .insert(users)
      .values([{ googleSub: `test-sub-a-${randomUUID()}` }, { googleSub: `test-sub-b-${randomUUID()}` }])
      .returning({ id: users.id });

    const userA = u[0]!.id;
    const userB = u[1]!.id;

    const f = await db
      .insert(feeds)
      .values({
        userId: userB,
        name: "B",
        url: `https://example.com/${randomUUID()}.xml`,
      })
      .returning({ id: feeds.id });

    const foreignFeedId = f[0]!.id;
    await addRule(userA, "ransomware", foreignFeedId);

    const created = await db
      .select({ id: rules.id })
      .from(rules)
      .where(and(eq(rules.userId, userA), eq(rules.feedId, foreignFeedId)))
      .limit(1);

    expect(created.length).toBe(0);
  });
});
