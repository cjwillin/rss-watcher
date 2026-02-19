import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { feeds, rules } from "@/db/schema";

export async function listRules(userId: string) {
  const db = getDb();
  const rows = await db
    .select({
      id: rules.id,
      keyword: rules.keyword,
      enabled: rules.enabled,
      feedId: rules.feedId,
      createdAt: rules.createdAt,
      feedName: feeds.name,
    })
    .from(rules)
    .leftJoin(feeds, and(eq(feeds.id, rules.feedId), eq(feeds.userId, userId)))
    .where(eq(rules.userId, userId))
    .orderBy(rules.createdAt);
  return rows;
}

export async function addRule(userId: string, keyword: string, feedId: string | null) {
  const db = getDb();
  const kw = keyword.trim();
  if (!kw) return;
  const fid = feedId && feedId.trim() ? feedId.trim() : null;
  if (fid) {
    const scopedFeed = await db
      .select({ id: feeds.id })
      .from(feeds)
      .where(and(eq(feeds.id, fid), eq(feeds.userId, userId)))
      .limit(1);
    if (!scopedFeed[0]) return;
  }

  await db.insert(rules).values({
    userId,
    keyword: kw,
    feedId: fid,
    enabled: true,
  });
}

export async function toggleRule(userId: string, ruleId: string) {
  const db = getDb();
  const row = await db
    .select({ enabled: rules.enabled })
    .from(rules)
    .where(and(eq(rules.userId, userId), eq(rules.id, ruleId)))
    .limit(1);
  if (!row.length) return;
  await db
    .update(rules)
    .set({ enabled: !row[0]!.enabled })
    .where(and(eq(rules.userId, userId), eq(rules.id, ruleId)));
}

export async function deleteRule(userId: string, ruleId: string) {
  const db = getDb();
  await db.delete(rules).where(and(eq(rules.userId, userId), eq(rules.id, ruleId)));
}
