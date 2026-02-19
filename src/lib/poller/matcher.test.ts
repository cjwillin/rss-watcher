import { describe, expect, it } from "vitest";

import { collectMatches, ruleMatchesEntry } from "@/lib/poller/matcher";
import type { NormalizedEntry, PollRule } from "@/lib/poller/types";

const entry: NormalizedEntry = {
  entryKey: "x",
  title: "Security ransomware update",
  link: "https://example.com/x",
  published: null,
  summary: "Incident summary",
};

const globalRule: PollRule = {
  id: "r1",
  userId: "u1",
  feedId: null,
  keyword: "RANSOMWARE",
  enabled: true,
};

describe("ruleMatchesEntry", () => {
  it("matches case-insensitive substring", () => {
    expect(ruleMatchesEntry(globalRule, "f1", entry)).toBe(true);
  });

  it("respects feed scoping", () => {
    expect(ruleMatchesEntry({ ...globalRule, feedId: "f2" }, "f1", entry)).toBe(false);
  });
});

describe("collectMatches", () => {
  it("returns matching rules only", () => {
    const out = collectMatches(
      [
        globalRule,
        { ...globalRule, id: "r2", keyword: "nothing" },
        { ...globalRule, id: "r3", enabled: false },
      ],
      "f1",
      entry,
    );
    expect(out.map((r) => r.id)).toEqual(["r1"]);
  });
});

