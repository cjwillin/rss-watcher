import { desc, eq } from "drizzle-orm";

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

export async function clearLogs(userId: string) {
  const db = getDb();
  await db.delete(userLog).where(eq(userLog.userId, userId));
}

