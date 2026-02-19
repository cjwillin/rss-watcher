import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    googleSub: text("google_sub").notNull(),
    email: text("email"),
    name: text("name"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_google_sub_uq").on(t.googleSub)],
);

export const feeds = pgTable(
  "feeds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    armed: boolean("armed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("feeds_user_url_uq").on(t.userId, t.url),
    index("feeds_user_enabled_idx").on(t.userId, t.enabled),
  ],
);

export const rules = pgTable(
  "rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    feedId: uuid("feed_id").references(() => feeds.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("rules_user_enabled_idx").on(t.userId, t.enabled),
    index("rules_user_feed_idx").on(t.userId, t.feedId),
  ],
);

export const entries = pgTable(
  "entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    feedId: uuid("feed_id")
      .notNull()
      .references(() => feeds.id, { onDelete: "cascade" }),
    entryKey: text("entry_key").notNull(),
    link: text("link").notNull(),
    title: text("title").notNull(),
    published: text("published"),
    summary: text("summary"),
    seenAt: timestamp("seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("entries_feed_entry_key_uq").on(t.feedId, t.entryKey),
    index("entries_user_feed_seen_idx").on(t.userId, t.feedId, t.seenAt),
  ],
);

export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    ruleId: uuid("rule_id")
      .notNull()
      .references(() => rules.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("alerts_entry_rule_uq").on(t.entryId, t.ruleId),
    index("alerts_user_created_idx").on(t.userId, t.createdAt),
  ],
);

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),

  pollIntervalSeconds: integer("poll_interval_seconds").notNull().default(300),

  pushoverAppTokenEnc: text("pushover_app_token_enc"),
  pushoverUserKeyEnc: text("pushover_user_key_enc"),

  smtpHostEnc: text("smtp_host_enc"),
  smtpPortEnc: text("smtp_port_enc"),
  smtpUserEnc: text("smtp_user_enc"),
  smtpPassEnc: text("smtp_pass_enc"),
  smtpFromEnc: text("smtp_from_enc"),
  smtpToEnc: text("smtp_to_enc"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userLog = pgTable(
  "user_log",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
    level: text("level").notNull(),
    area: text("area").notNull(),
    message: text("message").notNull(),

    feedId: uuid("feed_id"),
    ruleId: uuid("rule_id"),
    entryLink: text("entry_link"),
    error: text("error"),
  },
  (t) => [index("user_log_user_ts_idx").on(t.userId, t.ts)],
);

