import { createHash } from "node:crypto";

import type { NormalizedEntry } from "@/lib/poller/types";

function pickFirstString(values: unknown[]): string {
  for (const v of values) {
    const s = typeof v === "string" ? v.trim() : "";
    if (s) return s;
  }
  return "";
}

function toNullableString(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : null;
}

export function normalizeFeedEntry(raw: Record<string, unknown>): NormalizedEntry | null {
  const sourceTitle = pickFirstString([raw.title]);
  const guid = pickFirstString([raw.guid, raw.id]);
  const link = pickFirstString([raw.link, raw.id, raw.guid]);
  const title = sourceTitle || "(untitled)";
  const published = toNullableString(raw.pubDate ?? raw.isoDate ?? raw.published ?? raw.updated);
  const summary = toNullableString(raw.contentSnippet ?? raw.summary ?? raw.content);

  if (!link && !guid && !sourceTitle) return null;

  const stableSource =
    guid || `${link}|${title}|${published ?? ""}|${summary?.slice(0, 256) ?? ""}`;
  const entryKey = createHash("sha256").update(stableSource).digest("hex");

  return {
    entryKey,
    title,
    link: link || guid || "about:blank",
    published,
    summary,
  };
}
