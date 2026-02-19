import { describe, expect, it } from "vitest";

import { validateFeedUrl } from "@/lib/security/feed-url";

describe("validateFeedUrl", () => {
  it("accepts public https urls", () => {
    const out = validateFeedUrl("https://example.com/rss.xml");
    expect(out.ok).toBe(true);
  });

  it("rejects localhost and private ranges", () => {
    expect(validateFeedUrl("http://127.0.0.1/feed").ok).toBe(false);
    expect(validateFeedUrl("http://10.0.0.5/feed").ok).toBe(false);
    expect(validateFeedUrl("http://169.254.169.254/latest/meta-data").ok).toBe(false);
  });

  it("rejects credentialed urls", () => {
    expect(validateFeedUrl("https://user:pass@example.com/feed").ok).toBe(false);
  });

  it("allows localhost only in e2e test mode", () => {
    process.env.E2E_TEST_MODE = "1";
    expect(validateFeedUrl("http://localhost:3000/api/e2e/feed").ok).toBe(true);
    delete process.env.E2E_TEST_MODE;
    expect(validateFeedUrl("http://localhost:3000/api/e2e/feed").ok).toBe(false);
  });
});
