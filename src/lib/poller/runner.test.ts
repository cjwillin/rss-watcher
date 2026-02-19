import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const parseURL = vi.fn(async () => ({
    items: [
      {
        guid: "g1",
        title: "ransomware update",
        link: "https://example.com/1",
        pubDate: new Date().toUTCString(),
        contentSnippet: "a",
      },
    ],
  }));

  const listEnabledFeeds = vi.fn(async () => [
    { id: "f1", userId: "u1", name: "F", url: "https://example.com/feed", enabled: true, armed: true },
  ]);
  const listEnabledRules = vi.fn(async () => [
    { id: "r1", userId: "u1", feedId: null, keyword: "ransomware", enabled: true },
  ]);
  const storeEntryIfNew = vi.fn(async () => ({
    created: true,
    entry: {
      id: "e1",
      userId: "u1",
      feedId: "f1",
      entryKey: "k",
      link: "https://example.com/1",
      title: "ransomware update",
      published: null,
      summary: null,
    },
  }));
  const storeAlertIfNew = vi.fn(async () => ({ created: true, alertId: "a1" }));
  const markFeedsArmed = vi.fn(async () => {});
  const listDueUsers = vi.fn(async () => [{ userId: "u1", pollIntervalSeconds: 300, lastPollAt: null }]);

  const getNotificationSettings = vi.fn(async () => null);
  const notifyAll = vi.fn(async () => ({ sent: 0, failed: 0, errors: [] }));
  const logInfo = vi.fn(async () => {});
  const logWarn = vi.fn(async () => {});
  const logError = vi.fn(async () => {});

  return {
    parseURL,
    listEnabledFeeds,
    listEnabledRules,
    storeEntryIfNew,
    storeAlertIfNew,
    markFeedsArmed,
    listDueUsers,
    getNotificationSettings,
    notifyAll,
    logInfo,
    logWarn,
    logError,
  };
});

vi.mock("rss-parser", () => {
  return {
    default: class {
      parseURL = mocks.parseURL;
    },
  };
});

vi.mock("@/lib/poller/store", () => ({
  listEnabledFeeds: mocks.listEnabledFeeds,
  listEnabledRules: mocks.listEnabledRules,
  storeEntryIfNew: mocks.storeEntryIfNew,
  storeAlertIfNew: mocks.storeAlertIfNew,
  markFeedsArmed: mocks.markFeedsArmed,
  listDueUsers: mocks.listDueUsers,
}));

vi.mock("@/lib/app/settings", () => ({ getNotificationSettings: mocks.getNotificationSettings }));
vi.mock("@/lib/notify", () => ({ notifyAll: mocks.notifyAll }));
vi.mock("@/lib/poller/log", () => ({
  logInfo: mocks.logInfo,
  logWarn: mocks.logWarn,
  logError: mocks.logError,
}));

import { runDuePollers, runPollerForUser } from "@/lib/poller/runner";

describe("runPollerForUser", () => {
  beforeEach(() => {
    process.env.POLL_MAX_USERS_PER_RUN = "";
    process.env.POLL_MAX_ENTRIES_PER_FEED = "";
    mocks.parseURL.mockReset();
    mocks.parseURL.mockResolvedValue({
      items: [
        {
          guid: "g1",
          title: "ransomware update",
          link: "https://example.com/1",
          pubDate: new Date().toUTCString(),
          contentSnippet: "a",
        },
      ],
    });
    mocks.listDueUsers.mockReset();
    mocks.listDueUsers.mockResolvedValue([{ userId: "u1", pollIntervalSeconds: 300, lastPollAt: null }]);
    mocks.listEnabledFeeds.mockReset();
    mocks.listEnabledFeeds.mockResolvedValue([
      { id: "f1", userId: "u1", name: "F", url: "https://example.com/feed", enabled: true, armed: true },
    ]);
    mocks.listEnabledRules.mockReset();
    mocks.listEnabledRules.mockResolvedValue([
      { id: "r1", userId: "u1", feedId: null, keyword: "ransomware", enabled: true },
    ]);
    mocks.storeEntryIfNew.mockClear();
    mocks.storeAlertIfNew.mockClear();
  });

  it("stores entries and alerts for matches", async () => {
    const stats = await runPollerForUser("u1");
    expect(stats.feedsPolled).toBe(1);
    expect(stats.entriesInserted).toBe(1);
    expect(stats.alertsInserted).toBe(1);
    expect(mocks.storeEntryIfNew).toHaveBeenCalledTimes(1);
    expect(mocks.storeAlertIfNew).toHaveBeenCalledTimes(1);
  });

  it("runs due users aggregation", async () => {
    const stats = await runDuePollers();
    expect(stats.usersProcessed).toBe(1);
  });

  it("caps users per run and marks backlog", async () => {
    process.env.POLL_MAX_USERS_PER_RUN = "2";
    mocks.listDueUsers.mockResolvedValue([
      { userId: "u1", pollIntervalSeconds: 300, lastPollAt: null },
      { userId: "u2", pollIntervalSeconds: 300, lastPollAt: null },
      { userId: "u3", pollIntervalSeconds: 300, lastPollAt: null },
    ]);

    const stats = await runDuePollers();
    expect(stats.usersProcessed).toBe(2);
    expect(stats.hasMoreDue).toBe(true);
  });

  it("caps entries processed per feed per run", async () => {
    process.env.POLL_MAX_ENTRIES_PER_FEED = "1";
    mocks.parseURL.mockResolvedValue({
      items: [
        { guid: "g1", title: "ransomware one", link: "https://example.com/1", contentSnippet: "x" },
        { guid: "g2", title: "ransomware two", link: "https://example.com/2", contentSnippet: "x" },
      ],
    });

    await runPollerForUser("u1");
    expect(mocks.storeEntryIfNew).toHaveBeenCalledTimes(1);
  });
});
