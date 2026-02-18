# Vercel UI Polish + E2E Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the Next.js Vercel app look polished (marketing landing + custom sign-in) and add deterministic Playwright E2E coverage for signed-in flows.

**Architecture:** Keep the existing “paper/ink” CSS system; add `/signin` and improve `/` marketing sections. For E2E, run a disposable Docker Postgres, migrate with Drizzle, use `E2E_TEST_MODE=1` to enable test-only auth and reset endpoints.

**Tech Stack:** Next.js (App Router), next-auth@4, Drizzle, Postgres, @playwright/test

---

### Task 1: Add `/signin` Page + Wire NextAuth To Use It

**Files:**
- Create: `src/app/signin/page.tsx`
- Create: `src/components/SignInCard.tsx`
- Modify: `src/lib/auth.ts`
- Modify: `src/middleware.ts`
- Modify: `src/lib/session.ts`

**Step 1: Write the failing unit test for redirects**

Add a small test that asserts our “sign in path” is consistent.

- Create: `src/lib/paths.test.ts` (if missing) or extend it
- Add test that expects the sign-in path to be `/signin`

Run: `npm test`
Expected: FAIL (until we implement sign-in path usage consistently)

**Step 2: Implement `/signin` page**

- Build a dedicated sign-in page with the existing visual system.
- Use a client component (`SignInCard`) to call NextAuth `signIn()`.

**Step 3: Wire NextAuth to use custom sign-in**

- In `src/lib/auth.ts`, set `pages.signIn = "/signin"`.

**Step 4: Update redirects**

- In `src/middleware.ts`, redirect to `/signin` (not `/api/auth/signin`).
- In `src/lib/session.ts`, redirect to `/signin` in all cases.

**Step 5: Verify**

Run:
- `npm run lint`
- `npm test`

Expected:
- Lint: exit 0
- Vitest: all tests pass

**Step 6: Commit**

```bash
git add src/app/signin/page.tsx src/components/SignInCard.tsx src/lib/auth.ts src/middleware.ts src/lib/session.ts src/lib/*.test.ts
git commit -m "feat: add custom signin page and consistent redirects"
```

---

### Task 2: Make `/` A Marketing Landing Page (Splash + Inline Illustrations)

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`
- Create: `src/components/Illustrations.tsx`

**Step 1: Add a focused component snapshot test**

Create a minimal test that ensures the landing includes the hero CTA link to `/signin` and at least one illustration.

- Create: `src/app/landing.test.tsx` (or similar)

Run: `npm test`
Expected: FAIL

**Step 2: Implement landing**

- Replace “app status” chips with marketing content.
- Add 2-3 inline SVG illustrations (simple, consistent).
- Ensure only primary CTA is “Sign in” when signed out.

**Step 3: Verify**

Run:
- `npm run lint`
- `npm test`
- `npm run build`

Expected: exit 0 for all.

**Step 4: Commit**

```bash
git add src/app/page.tsx src/app/globals.css src/components/Illustrations.tsx src/app/*.test.tsx
git commit -m "feat: polish landing page with marketing sections and illustrations"
```

---

### Task 3: Redirect `/app` To `/app/feeds`

**Files:**
- Modify: `src/app/app/page.tsx`

**Step 1: Add a simple route test (optional)**

If route tests exist, add one; otherwise skip and validate via E2E.

**Step 2: Implement redirect**

Use `redirect("/app/feeds")`.

**Step 3: Verify + Commit**

Run: `npm run lint && npm test`

Commit:
```bash
git add src/app/app/page.tsx
git commit -m "feat: redirect /app to /app/feeds"
```

---

### Task 4: Add Test-Only Auth (Credentials Provider In `E2E_TEST_MODE`)

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/lib/auth-user.ts` (if needed)
- Create: `src/app/api/e2e/reset/route.ts`

**Step 1: Add failing tests for auth token shape**

Add/extend tests to ensure session contains `googleSub` when using credentials.

Run: `npm test`
Expected: FAIL

**Step 2: Implement Credentials provider guarded by env**

- If `process.env.E2E_TEST_MODE === "1"`, add Credentials provider.
- On credentials sign-in, upsert a deterministic user:
  - `googleSub = "e2e-test-sub"`
- Ensure `jwt` callback sets `token.googleSub` for credentials sign-in too (from `user`).

**Step 3: Add `/api/e2e/reset` guarded by env**

- If not in test mode: return 404.
- In test mode: delete all user-scoped rows for the e2e user (feeds/rules/entries/alerts/settings/log).

**Step 4: Verify + Commit**

Run: `npm run lint && npm test`

Commit:
```bash
git add src/lib/auth.ts src/app/api/e2e/reset/route.ts src/lib/*.test.ts
git commit -m "test: add E2E test-mode auth and reset endpoint"
```

---

### Task 5: Add Docker Postgres For E2E

**Files:**
- Create: `docker-compose.e2e.yml`
- Modify: `package.json`
- Modify: `.gitignore`

**Step 1: Implement compose file**

- Postgres 16
- Expose on `localhost:54333`
- DB: `rss_watcher_e2e`, user/pass: `postgres/postgres` (local-only)

**Step 2: Add scripts**

Add scripts:
- `e2e:db:up`
- `e2e:db:down`
- `e2e:db:wait` (simple wait loop)
- `e2e:prepare` (migrate)

**Step 3: Verify**

Run:
- `docker compose -f docker-compose.e2e.yml up -d`
- `DATABASE_URL=... npm run db:migrate`

**Step 4: Commit**

```bash
git add docker-compose.e2e.yml package.json .gitignore
git commit -m "test: add docker postgres wiring for e2e"
```

---

### Task 6: Add Playwright Runner + E2E Tests

**Files:**
- Modify: `package.json`
- Create: `playwright.config.ts`
- Create: `e2e/app.spec.ts`

**Step 1: Add deps + config**

- Add `@playwright/test` to devDependencies.
- Create `playwright.config.ts` with `webServer`:
  - command: `npm run build && PORT=3000 npm run start`
  - env: `E2E_TEST_MODE=1`, `DATABASE_URL=...`, `AUTH_SECRET=...`

**Step 2: Write E2E tests**

Test flow:
- Visit `/` and click “Sign in”
- On `/signin`, click “Continue as test user” (only in test mode)
- Call `/api/e2e/reset` to clean state
- Add feed, verify appears, toggle, delete
- Add rule, verify appears, toggle, delete
- Change poll interval and save, reload, verify persisted
- Clear logs and verify empty state

**Step 3: Run E2E**

Run:
- `npm run e2e:db:up`
- `DATABASE_URL=... npm run db:migrate`
- `DATABASE_URL=... AUTH_SECRET=devsecret E2E_TEST_MODE=1 npx playwright test`

Expected: PASS

**Step 4: Commit**

```bash
git add playwright.config.ts e2e/app.spec.ts package.json package-lock.json
git commit -m "test: add playwright e2e coverage for signed-in app flows"
```

---

### Task 7: Final Verification (Production-like)

**Step 1: Unit/lint/build**

Run:
- `npm run lint`
- `npm test`
- `npm run build`

Expected: exit 0

**Step 2: E2E**

Run:
- `docker compose -f docker-compose.e2e.yml up -d`
- `DATABASE_URL=... npm run db:migrate`
- `DATABASE_URL=... AUTH_SECRET=devsecret E2E_TEST_MODE=1 npx playwright test`

Expected: PASS

