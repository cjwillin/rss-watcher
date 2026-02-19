import Parser from "rss-parser";

import { getNotificationSettings } from "@/lib/app/settings";
import { collectMatches } from "@/lib/poller/matcher";
import { normalizeFeedEntry } from "@/lib/poller/normalize";
import { logError, logInfo, logWarn } from "@/lib/poller/log";
import { getDueUsers } from "@/lib/poller/scheduler";
import {
  listEnabledFeeds,
  listEnabledRules,
  markFeedsArmed,
  storeAlertIfNew,
  storeEntryIfNew,
} from "@/lib/poller/store";
import type { PollRunStats } from "@/lib/poller/types";
import { notifyAll } from "@/lib/notify";

const parser = new Parser<Record<string, unknown>>();

function asRecord(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object") return {};
  return v as Record<string, unknown>;
}

function intEnv(name: string, fallback: number, min: number): number {
  const raw = (process.env[name] ?? "").trim();
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.floor(n));
}

export async function runPollerForUser(userId: string): Promise<PollRunStats> {
  const maxEntriesPerFeed = intEnv("POLL_MAX_ENTRIES_PER_FEED", 200, 1);
  const stats: PollRunStats = {
    usersProcessed: 1,
    feedsPolled: 0,
    entriesInserted: 0,
    alertsInserted: 0,
    notificationsSent: 0,
    notificationsFailed: 0,
    errors: 0,
    hasMoreDue: false,
  };

  const [feeds, rules, settings] = await Promise.all([
    listEnabledFeeds(userId),
    listEnabledRules(userId),
    getNotificationSettings(userId),
  ]);

  await logInfo({ userId, area: "poller", message: "run_started" });

  const toArm: string[] = [];

  for (const feed of feeds) {
    stats.feedsPolled += 1;
    try {
      const parsed = await parser.parseURL(feed.url);
      const items = Array.isArray(parsed.items) ? parsed.items : [];

      for (const item of items.slice(0, maxEntriesPerFeed)) {
        const normalized = normalizeFeedEntry(asRecord(item));
        if (!normalized) continue;

        const entryUpsert = await storeEntryIfNew(userId, feed.id, normalized);
        if (!entryUpsert.created) continue;

        stats.entriesInserted += 1;

        if (!feed.armed) {
          continue;
        }

        const matchedRules = collectMatches(rules, feed.id, normalized);
        for (const rule of matchedRules) {
          const alertUpsert = await storeAlertIfNew({
            userId,
            entryId: entryUpsert.entry.id,
            ruleId: rule.id,
            keyword: rule.keyword,
          });

          if (!alertUpsert.created) continue;

          stats.alertsInserted += 1;

          const notify = await notifyAll({
            settings,
            title: `RSS Watcher: ${rule.keyword}`,
            message: `${normalized.title}\nMatched keyword: ${rule.keyword}`,
            link: normalized.link,
          });

          stats.notificationsSent += notify.sent;
          stats.notificationsFailed += notify.failed;

          if (notify.failed > 0) {
            for (const err of notify.errors) {
              await logWarn({
                userId,
                area: "notify",
                message: "delivery_failed",
                feedId: feed.id,
                ruleId: rule.id,
                entryLink: normalized.link,
                error: err,
              });
            }
          }

          await logInfo({
            userId,
            area: "alert",
            message: `matched:${rule.keyword}`,
            feedId: feed.id,
            ruleId: rule.id,
            entryLink: normalized.link,
          });
        }
      }

      if (!feed.armed) {
        toArm.push(feed.id);
      }
    } catch (err: unknown) {
      stats.errors += 1;
      await logError({
        userId,
        area: "poller",
        message: "feed_poll_failed",
        feedId: feed.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  await markFeedsArmed(toArm);

  await logInfo({
    userId,
    area: "poller",
    message: "run_complete",
  });

  return stats;
}

export async function runDuePollers(now = new Date()): Promise<PollRunStats> {
  const dueUsers = await getDueUsers(now);
  const maxUsersPerRun = intEnv("POLL_MAX_USERS_PER_RUN", 25, 1);
  const usersToProcess = dueUsers.slice(0, maxUsersPerRun);

  const stats: PollRunStats = {
    usersProcessed: 0,
    feedsPolled: 0,
    entriesInserted: 0,
    alertsInserted: 0,
    notificationsSent: 0,
    notificationsFailed: 0,
    errors: 0,
    hasMoreDue: dueUsers.length > usersToProcess.length,
  };

  for (const due of usersToProcess) {
    const userStats = await runPollerForUser(due.userId);
    stats.usersProcessed += 1;
    stats.feedsPolled += userStats.feedsPolled;
    stats.entriesInserted += userStats.entriesInserted;
    stats.alertsInserted += userStats.alertsInserted;
    stats.notificationsSent += userStats.notificationsSent;
    stats.notificationsFailed += userStats.notificationsFailed;
    stats.errors += userStats.errors;
  }

  return stats;
}
