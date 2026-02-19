import { and, desc, eq, gte, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { alerts, entries, feeds, rules } from "@/db/schema";
import { getRecentRunStatus } from "@/lib/poller/store";

export type OverviewStats = {
  feedCount: number;
  enabledFeedCount: number;
  ruleCount: number;
  enabledRuleCount: number;
  alerts24h: number;
  lastAlertAt: Date | null;
  lastPollAt: Date | null;
  lastPollErrorAt: Date | null;
};

export async function getOverviewStats(userId: string): Promise<OverviewStats> {
  const db = getDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [feedRows, ruleRows, alert24Rows, lastAlertRows, runStatus] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)::int`,
        enabledCount: sql<number>`count(*) filter (where ${feeds.enabled} = true)::int`,
      })
      .from(feeds)
      .where(eq(feeds.userId, userId)),
    db
      .select({
        count: sql<number>`count(*)::int`,
        enabledCount: sql<number>`count(*) filter (where ${rules.enabled} = true)::int`,
      })
      .from(rules)
      .where(eq(rules.userId, userId)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(alerts)
      .where(and(eq(alerts.userId, userId), gte(alerts.createdAt, since))),
    db
      .select({ createdAt: alerts.createdAt })
      .from(alerts)
      .where(eq(alerts.userId, userId))
      .orderBy(desc(alerts.createdAt))
      .limit(1),
    getRecentRunStatus(userId),
  ]);

  return {
    feedCount: feedRows[0]?.count ?? 0,
    enabledFeedCount: feedRows[0]?.enabledCount ?? 0,
    ruleCount: ruleRows[0]?.count ?? 0,
    enabledRuleCount: ruleRows[0]?.enabledCount ?? 0,
    alerts24h: alert24Rows[0]?.count ?? 0,
    lastAlertAt: lastAlertRows[0]?.createdAt ?? null,
    lastPollAt: runStatus.lastPollAt,
    lastPollErrorAt: runStatus.lastPollErrorAt,
  };
}

export async function listRecentAlerts(userId: string) {
  const db = getDb();
  return db
    .select({
      id: alerts.id,
      keyword: alerts.keyword,
      createdAt: alerts.createdAt,
      entryLink: entries.link,
      entryTitle: entries.title,
    })
    .from(alerts)
    .innerJoin(entries, eq(entries.id, alerts.entryId))
    .where(eq(alerts.userId, userId))
    .orderBy(desc(alerts.createdAt))
    .limit(10);
}
