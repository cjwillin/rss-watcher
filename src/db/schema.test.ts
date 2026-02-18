import { describe, expect, it } from "vitest";

import { getDb } from "./index";

describe("db schema", () => {
  it("connects when DATABASE_URL is set", async () => {
    if (!process.env.DATABASE_URL) return;

    const db = getDb();
    // Minimal smoke query; avoids printing anything sensitive.
    const rows = await db.execute<{ ok: number }>("select 1 as ok");
    expect(Array.isArray(rows)).toBe(true);
    expect(rows[0]?.ok).toBe(1);
  });
});
