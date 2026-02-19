export type PushoverConfig = {
  appToken: string;
  userKey: string;
};

export type NotificationPayload = {
  title: string;
  message: string;
  url?: string;
  urlTitle?: string;
};

export type NotifyResult = {
  ok: boolean;
  channel: "pushover";
  status: number;
  error?: string;
};

export async function sendPushover(
  config: PushoverConfig,
  payload: NotificationPayload,
): Promise<NotifyResult> {
  const body = new URLSearchParams({
    token: config.appToken,
    user: config.userKey,
    title: payload.title,
    message: payload.message,
  });

  if (payload.url) body.set("url", payload.url);
  if (payload.urlTitle) body.set("url_title", payload.urlTitle);

  const res = await fetch("https://api.pushover.net/1/messages.json", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  if (res.ok) {
    return { ok: true, channel: "pushover", status: res.status };
  }

  const text = await res.text();
  return {
    ok: false,
    channel: "pushover",
    status: res.status,
    error: text.slice(0, 500),
  };
}
