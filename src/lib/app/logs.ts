import { and, desc, eq, gte, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { userLog } from "@/db/schema";

export async function listLogs(userId: string) {
  const db = getDb();
  return db
    .select({
      id: userLog.id,
      ts: userLog.ts,
      level: userLog.level,
      area: userLog.area,
      message: userLog.message,
      entryLink: userLog.entryLink,
      error: userLog.error,
    })
    .from(userLog)
    .where(eq(userLog.userId, userId))
    .orderBy(desc(userLog.id))
    .limit(250);
}

export async function getLogSummary(userId: string) {
  const db = getDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      total24h: sql<number>`count(*)::int`,
      errors24h: sql<number>`count(*) filter (where ${userLog.level} = 'error')::int`,
      notifyFailures24h: sql<number>`count(*) filter (where ${userLog.area} = 'notify' and ${userLog.level} in ('error','warn'))::int`,
    })
    .from(userLog)
    .where(and(eq(userLog.userId, userId), gte(userLog.ts, since)));

  return {
    total24h: rows[0]?.total24h ?? 0,
    errors24h: rows[0]?.errors24h ?? 0,
    notifyFailures24h: rows[0]?.notifyFailures24h ?? 0,
  };
}

export async function clearLogs(userId: string) {
  const db = getDb();
  await db.delete(userLog).where(eq(userLog.userId, userId));
}
