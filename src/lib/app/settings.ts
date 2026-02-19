import { eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { userSettings } from "@/db/schema";
import { decryptSecret, encryptSecret } from "@/lib/crypto/creds";

export async function getSettings(userId: string) {
  const db = getDb();
  const rows = await db
    .select({
      pollIntervalSeconds: userSettings.pollIntervalSeconds,
      pushoverConfigured: sql<boolean>`(${userSettings.pushoverAppTokenEnc} is not null and ${userSettings.pushoverUserKeyEnc} is not null)`,
      smtpConfigured: sql<boolean>`(${userSettings.smtpHostEnc} is not null and ${userSettings.smtpPortEnc} is not null and ${userSettings.smtpFromEnc} is not null and ${userSettings.smtpToEnc} is not null)`,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  return rows[0] ?? { pollIntervalSeconds: 300, pushoverConfigured: false, smtpConfigured: false };
}

export async function saveSettings(
  userId: string,
  input: {
    pollIntervalSeconds: number;
    pushoverAppToken?: string;
    pushoverUserKey?: string;
    smtpHost?: string;
    smtpPort?: string;
    smtpUser?: string;
    smtpPass?: string;
    smtpFrom?: string;
    smtpTo?: string;
    clearPushover?: boolean;
    clearSmtp?: boolean;
  },
) {
  const db = getDb();
  const interval = Number.isFinite(input.pollIntervalSeconds)
    ? Math.max(60, Math.floor(input.pollIntervalSeconds))
    : 300;

  const set: Record<string, unknown> = {
    pollIntervalSeconds: interval,
    updatedAt: sql`now()`,
  };

  if (input.clearPushover) {
    set.pushoverAppTokenEnc = null;
    set.pushoverUserKeyEnc = null;
  } else if ((input.pushoverAppToken ?? "").trim() || (input.pushoverUserKey ?? "").trim()) {
    // Only update if user provided any pushover fields.
    const t = (input.pushoverAppToken ?? "").trim();
    const u = (input.pushoverUserKey ?? "").trim();
    set.pushoverAppTokenEnc = t ? encryptSecret(t) : null;
    set.pushoverUserKeyEnc = u ? encryptSecret(u) : null;
  }

  if (input.clearSmtp) {
    set.smtpHostEnc = null;
    set.smtpPortEnc = null;
    set.smtpUserEnc = null;
    set.smtpPassEnc = null;
    set.smtpFromEnc = null;
    set.smtpToEnc = null;
  } else if (
    (input.smtpHost ?? "").trim() ||
    (input.smtpPort ?? "").trim() ||
    (input.smtpFrom ?? "").trim() ||
    (input.smtpTo ?? "").trim() ||
    (input.smtpUser ?? "").trim() ||
    (input.smtpPass ?? "").length
  ) {
    // Only update if user provided any smtp fields.
    const host = (input.smtpHost ?? "").trim();
    const port = (input.smtpPort ?? "").trim();
    const user = (input.smtpUser ?? "").trim();
    const pass = input.smtpPass ?? "";
    const from = (input.smtpFrom ?? "").trim();
    const to = (input.smtpTo ?? "").trim();
    set.smtpHostEnc = host ? encryptSecret(host) : null;
    set.smtpPortEnc = port ? encryptSecret(port) : null;
    set.smtpUserEnc = user ? encryptSecret(user) : null;
    set.smtpPassEnc = pass ? encryptSecret(pass) : null;
    set.smtpFromEnc = from ? encryptSecret(from) : null;
    set.smtpToEnc = to ? encryptSecret(to) : null;
  }

  await db
    .insert(userSettings)
    .values({ userId, pollIntervalSeconds: interval })
    .onConflictDoUpdate({ target: userSettings.userId, set });
}

export async function getNotificationSettings(userId: string) {
  const db = getDb();
  const rows = await db
    .select({
      pollIntervalSeconds: userSettings.pollIntervalSeconds,
      pushoverAppTokenEnc: userSettings.pushoverAppTokenEnc,
      pushoverUserKeyEnc: userSettings.pushoverUserKeyEnc,
      smtpHostEnc: userSettings.smtpHostEnc,
      smtpPortEnc: userSettings.smtpPortEnc,
      smtpUserEnc: userSettings.smtpUserEnc,
      smtpPassEnc: userSettings.smtpPassEnc,
      smtpFromEnc: userSettings.smtpFromEnc,
      smtpToEnc: userSettings.smtpToEnc,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  const decrypt = (v: string | null) => (v ? decryptSecret(v) : "");

  return {
    pollIntervalSeconds: row.pollIntervalSeconds,
    pushoverAppToken: decrypt(row.pushoverAppTokenEnc),
    pushoverUserKey: decrypt(row.pushoverUserKeyEnc),
    smtpHost: decrypt(row.smtpHostEnc),
    smtpPort: decrypt(row.smtpPortEnc),
    smtpUser: decrypt(row.smtpUserEnc),
    smtpPass: decrypt(row.smtpPassEnc),
    smtpFrom: decrypt(row.smtpFromEnc),
    smtpTo: decrypt(row.smtpToEnc),
  };
}
