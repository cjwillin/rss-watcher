import { NextResponse } from "next/server";

import { runDuePollers } from "@/lib/poller/runner";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET is not configured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${secret}`) return unauthorized();

  const stats = await runDuePollers();
  return NextResponse.json({ ok: true, stats });
}
