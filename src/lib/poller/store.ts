import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { alerts, entries, feeds, rules, userLog, userSettings, users } from "@/db/schema";
import type { NormalizedEntry, PollFeed, PollRule, PollUser } from "@/lib/poller/types";

export type StoredEntry = {
  id: string;
  userId: string;
  feedId: string;
  entryKey: string;
  link: string;
  title: string;
  published: string | null;
  summary: string | null;
};

export async function listEnabledFeeds(userId: string): Promise<PollFeed[]> {
  const db = getDb();
  return db
    .select({
      id: feeds.id,
      userId: feeds.userId,
      name: feeds.name,
      url: feeds.url,
      enabled: feeds.enabled,
      armed: feeds.armed,
    })
    .from(feeds)
    .where(and(eq(feeds.userId, userId), eq(feeds.enabled, true)));
}

export async function listEnabledRules(userId: string): Promise<PollRule[]> {
  const db = getDb();
  return db
    .select({
      id: rules.id,
      userId: rules.userId,
      feedId: rules.feedId,
      keyword: rules.keyword,
      enabled: rules.enabled,
    })
    .from(rules)
    .where(and(eq(rules.userId, userId), eq(rules.enabled, true)));
}

export async function storeEntryIfNew(
  userId: string,
  feedId: string,
  entry: NormalizedEntry,
): Promise<{ created: boolean; entry: StoredEntry }> {
  const db = getDb();

  const inserted = await db
    .insert(entries)
    .values({
      userId,
      feedId,
      entryKey: entry.entryKey,
      link: entry.link,
      title: entry.title,
      published: entry.published,
      summary: entry.summary,
    })
    .onConflictDoNothing({ target: [entries.feedId, entries.entryKey] })
    .returning({
      id: entries.id,
      userId: entries.userId,
      feedId: entries.feedId,
      entryKey: entries.entryKey,
      link: entries.link,
      title: entries.title,
      published: entries.published,
      summary: entries.summary,
    });

  if (inserted[0]) return { created: true, entry: inserted[0] };

  const existing = await db
    .select({
      id: entries.id,
      userId: entries.userId,
      feedId: entries.feedId,
      entryKey: entries.entryKey,
      link: entries.link,
      title: entries.title,
      published: entries.published,
      summary: entries.summary,
    })
    .from(entries)
    .where(and(eq(entries.feedId, feedId), eq(entries.entryKey, entry.entryKey)))
    .limit(1);

  if (!existing[0]) {
    throw new Error("entry upsert failed unexpectedly");
  }

  return { created: false, entry: existing[0] };
}

export async function storeAlertIfNew(input: {
  userId: string;
  entryId: string;
  ruleId: string;
  keyword: string;
}): Promise<{ created: boolean; alertId: string | null }> {
  const db = getDb();

  const inserted = await db
    .insert(alerts)
    .values(input)
    .onConflictDoNothing({ target: [alerts.entryId, alerts.ruleId] })
    .returning({ id: alerts.id });

  if (inserted[0]) return { created: true, alertId: inserted[0].id };

  const existing = await db
    .select({ id: alerts.id })
    .from(alerts)
    .where(and(eq(alerts.entryId, input.entryId), eq(alerts.ruleId, input.ruleId)))
    .limit(1);

  return { created: false, alertId: existing[0]?.id ?? null };
}

export async function markFeedsArmed(feedIds: string[]): Promise<void> {
  if (!feedIds.length) return;
  const db = getDb();
  await db.update(feeds).set({ armed: true }).where(inArray(feeds.id, feedIds));
}

export async function listDueUsers(now = new Date()): Promise<PollUser[]> {
  const db = getDb();
  const rows = await db.execute<{
    user_id: string;
    poll_interval_seconds: number;
    last_poll_at: Date | null;
  }>(sql`
    select
      u.id as user_id,
      us.poll_interval_seconds,
      max(ul.ts) filter (where ul.area = 'poller' and ul.message = 'run_complete') as last_poll_at
    from ${users} u
    inner join ${userSettings} us on us.user_id = u.id
    left join ${userLog} ul on ul.user_id = u.id
    group by u.id, us.poll_interval_seconds
  `);

  return rows
    .map((r) => ({
      userId: r.user_id,
      pollIntervalSeconds: Number(r.poll_interval_seconds) || 300,
      lastPollAt: r.last_poll_at,
    }))
    .filter((u) => {
      if (!u.lastPollAt) return true;
      const elapsed = (now.getTime() - u.lastPollAt.getTime()) / 1000;
      return elapsed >= Math.max(60, u.pollIntervalSeconds);
    });
}

export async function getRecentRunStatus(userId: string): Promise<{
  lastPollAt: Date | null;
  lastPollErrorAt: Date | null;
}> {
  const db = getDb();

  const rows = await db
    .select({
      ts: userLog.ts,
      level: userLog.level,
      message: userLog.message,
    })
    .from(userLog)
    .where(and(eq(userLog.userId, userId), eq(userLog.area, "poller")))
    .orderBy(desc(userLog.id))
    .limit(100);

  let lastPollAt: Date | null = null;
  let lastPollErrorAt: Date | null = null;

  for (const row of rows) {
    if (!lastPollAt && row.message === "run_complete") {
      lastPollAt = row.ts;
    }
    if (!lastPollErrorAt && row.level === "error") {
      lastPollErrorAt = row.ts;
    }
    if (lastPollAt && lastPollErrorAt) break;
  }

  return { lastPollAt, lastPollErrorAt };
}
