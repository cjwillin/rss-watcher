import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { feeds } from "@/db/schema";
import { validateFeedUrl } from "@/lib/security/feed-url";

export async function listFeeds(userId: string) {
  const db = getDb();
  return db
    .select({
      id: feeds.id,
      name: feeds.name,
      url: feeds.url,
      enabled: feeds.enabled,
      armed: feeds.armed,
      createdAt: feeds.createdAt,
    })
    .from(feeds)
    .where(eq(feeds.userId, userId))
    .orderBy(feeds.createdAt);
}

export async function addFeed(userId: string, name: string, url: string) {
  const db = getDb();
  const cleanName = name.trim() || "Feed";
  const cleanUrl = url.trim();
  if (!cleanUrl) return;
  const verdict = validateFeedUrl(cleanUrl);
  if (!verdict.ok) return;

  await db
    .insert(feeds)
    .values({
      userId,
      name: cleanName,
      url: verdict.url,
      enabled: true,
      // armed defaults false: baseline on first poll
    })
    .onConflictDoNothing();
}

export async function toggleFeed(userId: string, feedId: string) {
  const db = getDb();
  const row = await db
    .select({ enabled: feeds.enabled })
    .from(feeds)
    .where(and(eq(feeds.userId, userId), eq(feeds.id, feedId)))
    .limit(1);
  if (!row.length) return;
  await db
    .update(feeds)
    .set({ enabled: !row[0]!.enabled })
    .where(and(eq(feeds.userId, userId), eq(feeds.id, feedId)));
}

export async function deleteFeed(userId: string, feedId: string) {
  const db = getDb();
  await db.delete(feeds).where(and(eq(feeds.userId, userId), eq(feeds.id, feedId)));
}
