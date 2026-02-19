import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { getDb } from "@/db";
import { migrateDb } from "@/db/migrate";
import { feeds, rules, users } from "@/db/schema";
import { storeAlertIfNew, storeEntryIfNew } from "@/lib/poller/store";

describe("poller store", () => {
  it("dedupes entry and alert inserts", async () => {
    if (!process.env.DATABASE_URL) return;

    await migrateDb();
    const db = getDb();

    const insertedUser = await db
      .insert(users)
      .values({ googleSub: `store-test-${randomUUID()}` })
      .returning({ id: users.id });
    const userId = insertedUser[0]!.id;

    const insertedFeed = await db
      .insert(feeds)
      .values({ userId, name: "F", url: `https://example.com/${randomUUID()}.xml`, enabled: true, armed: true })
      .returning({ id: feeds.id });
    const feedId = insertedFeed[0]!.id;

    const insertedRule = await db
      .insert(rules)
      .values({ userId, feedId, keyword: "x", enabled: true })
      .returning({ id: rules.id });
    const ruleId = insertedRule[0]!.id;

    const entryA = await storeEntryIfNew(userId, feedId, {
      entryKey: "k1",
      title: "Title",
      link: "https://example.com/a",
      published: null,
      summary: null,
    });

    const entryB = await storeEntryIfNew(userId, feedId, {
      entryKey: "k1",
      title: "Title",
      link: "https://example.com/a",
      published: null,
      summary: null,
    });

    expect(entryA.created).toBe(true);
    expect(entryB.created).toBe(false);
    expect(entryA.entry.id).toBe(entryB.entry.id);

    const alertA = await storeAlertIfNew({ userId, entryId: entryA.entry.id, ruleId, keyword: "x" });
    const alertB = await storeAlertIfNew({ userId, entryId: entryA.entry.id, ruleId, keyword: "x" });

    expect(alertA.created).toBe(true);
    expect(alertB.created).toBe(false);

    // Cleanup to keep test DB small.
    await db.delete(rules).where(eq(rules.id, ruleId));
    await db.delete(feeds).where(eq(feeds.id, feedId));
    await db.delete(users).where(eq(users.id, userId));
  });
});
