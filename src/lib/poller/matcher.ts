import type { NormalizedEntry, PollRule } from "@/lib/poller/types";

export function ruleMatchesEntry(rule: PollRule, feedId: string, entry: NormalizedEntry): boolean {
  if (!rule.enabled) return false;
  if (rule.feedId && rule.feedId !== feedId) return false;

  const keyword = rule.keyword.trim().toLowerCase();
  if (!keyword) return false;

  const haystack = `${entry.title} ${entry.summary ?? ""}`.toLowerCase();
  return haystack.includes(keyword);
}

export function collectMatches(rules: PollRule[], feedId: string, entry: NormalizedEntry): PollRule[] {
  return rules.filter((rule) => ruleMatchesEntry(rule, feedId, entry));
}

