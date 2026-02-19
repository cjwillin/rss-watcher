import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import { runPollerForUser } from "@/lib/poller/runner";

export const runtime = "nodejs";

const E2E_GOOGLE_SUB = "e2e-test-sub";

export async function POST() {
  if (process.env.E2E_TEST_MODE !== "1") {
    return new NextResponse("not found", { status: 404 });
  }

  const db = getDb();
  const row = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.googleSub, E2E_GOOGLE_SUB))
    .limit(1);

  const userId = row[0]?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "missing e2e user" }, { status: 400 });
  }

  const stats = await runPollerForUser(userId);
  return NextResponse.json({ ok: true, stats });
}
