import { expect, test } from "@playwright/test";

async function acceptNextDialog(page: import("@playwright/test").Page) {
  page.once("dialog", async (d) => d.accept());
}

test("public landing renders and links to /signin", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /catch the moments/i })).toBeVisible();

  // Prefer the primary CTA, but either header or hero is fine.
  await page.getByRole("link", { name: "Sign in" }).first().click();
  await expect(page).toHaveURL(/\/signin/);
});

test("signed-in app flow: feeds, rules, settings, logs", async ({ page, request }) => {
  await page.goto("/signin");

  const providersRes = await request.get("/api/auth/providers");
  expect(providersRes.ok()).toBeTruthy();
  const providers = (await providersRes.json()) as Record<string, unknown>;
  expect(Object.keys(providers)).toContain("credentials");

  await page.getByRole("button", { name: /continue as test user/i }).click();
  await expect(page).toHaveURL(/\/app/);

  // Hard reset after login to ensure deterministic state.
  const reset = await request.post("/api/e2e/reset");
  expect(reset.ok()).toBeTruthy();

  // Feeds: add
  await page.goto("/app/feeds");
  const feedName = "Security News";
  const feedUrl = "http://localhost:3000/api/e2e/feed";

  await page.getByLabel("Name").fill(feedName);
  await page.getByLabel("URL").fill(feedUrl);
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText(feedName)).toBeVisible();

  // Rules: add
  await page.goto("/app/rules");
  await page.getByLabel("Keyword").fill("ransomware");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("ransomware")).toBeVisible();

  // Trigger poll twice: first call baselines the feed, second call creates a keyword match.
  const poll1 = await request.post("/api/e2e/poll");
  expect(poll1.ok()).toBeTruthy();
  const poll2 = await request.post("/api/e2e/poll");
  expect(poll2.ok()).toBeTruthy();

  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByText("Recent Alerts")).toBeVisible();
  await expect(page.locator(".tag", { hasText: "ransomware" }).first()).toBeVisible();

  // Settings: save poll interval
  await page.goto("/app/settings");
  const poll = page.getByLabel("Poll interval (seconds)");
  await poll.fill("120");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(poll).toHaveValue("120");

  // Logs: clear
  await page.goto("/app/logs");
  await expect(page.getByText(/matched:ransomware/i)).toBeVisible();
  await acceptNextDialog(page);
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(page.getByText(/no logs yet/i)).toBeVisible();
});
