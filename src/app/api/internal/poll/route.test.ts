import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runDuePollers: vi.fn(async () => ({ usersProcessed: 0, hasMoreDue: false })),
}));

vi.mock("@/lib/poller/runner", () => ({
  runDuePollers: mocks.runDuePollers,
}));

import { POST } from "@/app/api/internal/poll/route";

describe("internal poll route", () => {
  beforeEach(() => {
    mocks.runDuePollers.mockClear();
    process.env.CRON_SECRET = "test-secret";
  });

  it("returns 401 without valid bearer", async () => {
    const req = new Request("http://localhost/api/internal/poll", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(mocks.runDuePollers).not.toHaveBeenCalled();
  });

  it("runs poller with valid bearer", async () => {
    mocks.runDuePollers.mockResolvedValueOnce({ usersProcessed: 2, hasMoreDue: true });
    const req = new Request("http://localhost/api/internal/poll", {
      method: "POST",
      headers: { authorization: "Bearer test-secret" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mocks.runDuePollers).toHaveBeenCalledTimes(1);
    const body = await res.json();
    expect(body.hasMoreDue).toBe(true);
  });
});
