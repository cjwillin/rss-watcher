import { sendPushover } from "@/lib/notify/pushover";
import { sendSmtp } from "@/lib/notify/smtp";

export type UserNotificationSettings = {
  pushoverAppToken: string;
  pushoverUserKey: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  smtpTo: string;
};

export type SendNotificationInput = {
  settings: UserNotificationSettings | null;
  title: string;
  message: string;
  link?: string;
};

export type SendNotificationSummary = {
  sent: number;
  failed: number;
  errors: string[];
};

export async function notifyAll(input: SendNotificationInput): Promise<SendNotificationSummary> {
  const summary: SendNotificationSummary = { sent: 0, failed: 0, errors: [] };
  const settings = input.settings;
  if (!settings) return summary;

  const jobs: Array<Promise<void>> = [];

  if (settings.pushoverAppToken && settings.pushoverUserKey) {
    jobs.push(
      sendPushover(
        {
          appToken: settings.pushoverAppToken,
          userKey: settings.pushoverUserKey,
        },
        {
          title: input.title,
          message: input.message,
          url: input.link,
          urlTitle: input.link ? "Open entry" : undefined,
        },
      ).then((res) => {
        if (res.ok) summary.sent += 1;
        else {
          summary.failed += 1;
          summary.errors.push(res.error ?? `pushover ${res.status}`);
        }
      }),
    );
  }

  if (settings.smtpHost && settings.smtpPort && settings.smtpFrom && settings.smtpTo) {
    jobs.push(
      sendSmtp(
        {
          host: settings.smtpHost,
          port: Number(settings.smtpPort) || 587,
          user: settings.smtpUser || undefined,
          pass: settings.smtpPass || undefined,
          from: settings.smtpFrom,
          to: settings.smtpTo,
        },
        {
          title: input.title,
          message: input.message,
          url: input.link,
          urlTitle: input.link ? "Open entry" : undefined,
        },
      )
        .then(() => {
          summary.sent += 1;
        })
        .catch((err: unknown) => {
          summary.failed += 1;
          summary.errors.push(err instanceof Error ? err.message : String(err));
        }),
    );
  }

  await Promise.all(jobs);
  return summary;
}
