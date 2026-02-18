import { describe, expect, it } from "vitest";

import { isProtectedAppPath, SIGN_IN_PATH } from "./paths";

describe("isProtectedAppPath", () => {
  it("protects /app and subpaths", () => {
    expect(isProtectedAppPath("/app")).toBe(true);
    expect(isProtectedAppPath("/app/")).toBe(true);
    expect(isProtectedAppPath("/app/feeds")).toBe(true);
  });

  it("does not protect non-app paths", () => {
    expect(isProtectedAppPath("/")).toBe(false);
    expect(isProtectedAppPath("/api/health")).toBe(false);
    expect(isProtectedAppPath("/apples")).toBe(false);
  });
});

describe("SIGN_IN_PATH", () => {
  it("is a stable, absolute path", () => {
    expect(SIGN_IN_PATH).toBe("/signin");
  });
});
