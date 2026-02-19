import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  limitRows: [] as Array<{ id: string }>,
  insertValues: vi.fn(),
}));

vi.mock("@/db", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => mocks.limitRows,
        }),
      }),
    }),
    insert: () => ({
      values: async (payload: unknown) => {
        mocks.insertValues(payload);
      },
    }),
  }),
}));

import { addRule } from "@/lib/app/rules";

describe("addRule", () => {
  beforeEach(() => {
    mocks.limitRows = [];
    mocks.insertValues.mockReset();
  });

  it("does not insert scoped rule when feed does not belong to user", async () => {
    mocks.limitRows = [];
    await addRule("u1", "ransomware", "feed-other-user");
    expect(mocks.insertValues).not.toHaveBeenCalled();
  });

  it("inserts scoped rule when feed belongs to user", async () => {
    mocks.limitRows = [{ id: "feed-owned" }];
    await addRule("u1", "ransomware", "feed-owned");
    expect(mocks.insertValues).toHaveBeenCalledTimes(1);
  });
});
