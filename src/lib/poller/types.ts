export type PollFeed = {
  id: string;
  userId: string;
  name: string;
  url: string;
  enabled: boolean;
  armed: boolean;
};

export type PollRule = {
  id: string;
  userId: string;
  feedId: string | null;
  keyword: string;
  enabled: boolean;
};

export type NormalizedEntry = {
  entryKey: string;
  title: string;
  link: string;
  published: string | null;
  summary: string | null;
};

export type PollUser = {
  userId: string;
  pollIntervalSeconds: number;
  lastPollAt: Date | null;
};

export type PollRunStats = {
  usersProcessed: number;
  feedsPolled: number;
  entriesInserted: number;
  alertsInserted: number;
  notificationsSent: number;
  notificationsFailed: number;
  errors: number;
  hasMoreDue: boolean;
};
