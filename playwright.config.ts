import { defineConfig } from "@playwright/test";

// Use localhost to match next-auth's default URL construction when NEXTAUTH_URL is unset.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : [["html"], ["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run build && PORT=3000 npm run start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // DB/auth are provided by `npm run test:e2e` via env vars.
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      AUTH_SECRET: process.env.AUTH_SECRET ?? "",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? baseURL,
      APP_CRED_ENC_KEY: process.env.APP_CRED_ENC_KEY ?? "",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "dummy",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "dummy",
      E2E_TEST_MODE: process.env.E2E_TEST_MODE ?? "0",
    },
  },
});
