import { describe, expect, it } from "vitest";

import { normalizeFeedEntry } from "@/lib/poller/normalize";

describe("normalizeFeedEntry", () => {
  it("normalizes common rss fields", () => {
    const e = normalizeFeedEntry({
      guid: "abc",
      link: "https://example.com/a",
      title: "Alert",
      pubDate: "Mon, 01 Jan 2026 00:00:00 GMT",
      contentSnippet: "Something happened",
    });
    expect(e).not.toBeNull();
    expect(e?.entryKey).toHaveLength(64);
    expect(e?.title).toBe("Alert");
    expect(e?.link).toBe("https://example.com/a");
  });

  it("returns null for unusable payload", () => {
    const e = normalizeFeedEntry({});
    expect(e).toBeNull();
  });
});

