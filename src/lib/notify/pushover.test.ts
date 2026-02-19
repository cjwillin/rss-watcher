import { describe, expect, it, vi } from "vitest";

import { sendPushover } from "@/lib/notify/pushover";

describe("sendPushover", () => {
  it("posts expected form payload", async () => {
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const out = await sendPushover(
      { appToken: "app", userKey: "user" },
      { title: "T", message: "M", url: "https://example.com/a", urlTitle: "Open" },
    );

    expect(out.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const args = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(args[0]).toContain("api.pushover.net/1/messages.json");

    const body = args[1].body as URLSearchParams;
    expect(body.get("token")).toBe("app");
    expect(body.get("user")).toBe("user");
    expect(body.get("title")).toBe("T");
    expect(body.get("message")).toBe("M");
  });
});
