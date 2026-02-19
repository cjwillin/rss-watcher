import nodemailer from "nodemailer";

import type { NotificationPayload } from "@/lib/notify/pushover";

export type SmtpConfig = {
  host: string;
  port: number;
  user?: string;
  pass?: string;
  from: string;
  to: string;
};

export type SmtpNotifyResult = {
  ok: boolean;
  channel: "smtp";
  error?: string;
};

export async function sendSmtp(config: SmtpConfig, payload: NotificationPayload): Promise<SmtpNotifyResult> {
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: config.user || config.pass ? { user: config.user ?? "", pass: config.pass ?? "" } : undefined,
  });

  const text = payload.url ? `${payload.message}\n\n${payload.url}` : payload.message;
  await transport.sendMail({
    from: config.from,
    to: config.to,
    subject: payload.title,
    text,
  });

  return { ok: true, channel: "smtp" };
}
