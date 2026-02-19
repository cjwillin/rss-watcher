import { NextResponse } from "next/server";

export const runtime = "nodejs";

const g = globalThis as unknown as { __rssWatcherE2eFeedSeq?: number };

export async function GET() {
  if (process.env.E2E_TEST_MODE !== "1") {
    return new NextResponse("not found", { status: 404 });
  }

  g.__rssWatcherE2eFeedSeq = (g.__rssWatcherE2eFeedSeq ?? 0) + 1;
  const seq = g.__rssWatcherE2eFeedSeq;
  const withKeyword = seq >= 2;

  const title = withKeyword ? `Ransomware bulletin ${seq}` : `Daily digest ${seq}`;
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>E2E Feed</title>
    <link>http://localhost:3000/api/e2e/feed</link>
    <description>Deterministic feed for tests</description>
    <item>
      <guid>e2e-${seq}</guid>
      <title>${title}</title>
      <link>http://localhost:3000/e2e/${seq}</link>
      <description>${withKeyword ? "keyword matched" : "no match yet"}</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
  </channel>
</rss>`;

  return new NextResponse(body, {
    status: 200,
    headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "no-store" },
  });
}
