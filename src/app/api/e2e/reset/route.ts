import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { alerts, entries, feeds, rules, userLog, userSettings, users } from "@/db/schema";

export const runtime = "nodejs";

const E2E_GOOGLE_SUB = "e2e-test-sub";

export async function POST() {
  if (process.env.E2E_TEST_MODE !== "1") {
    return new NextResponse("not found", { status: 404 });
  }

  const db = getDb();

  const u = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.googleSub, E2E_GOOGLE_SUB))
    .limit(1);

  const userId = u[0]?.id;
  if (!userId) return NextResponse.json({ ok: true, cleared: false });

  // Delete in FK order.
  await db.delete(alerts).where(eq(alerts.userId, userId));
  await db.delete(entries).where(eq(entries.userId, userId));
  await db.delete(rules).where(eq(rules.userId, userId));
  await db.delete(feeds).where(eq(feeds.userId, userId));
  await db.delete(userLog).where(eq(userLog.userId, userId));
  await db.delete(userSettings).where(eq(userSettings.userId, userId));

  return NextResponse.json({ ok: true, cleared: true });
}

