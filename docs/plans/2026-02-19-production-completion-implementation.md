# RSS Watcher Production Completion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver full production functionality (poller, alerting, notifications, logs, dashboard status) and complete CI/CD security roadmap on the Next.js/Vercel branch.

**Architecture:** Use a secured internal poll API route triggered by Vercel Cron. Build idempotent polling pipeline over existing Drizzle schema, then wire UI status surfaces and complete security workflows with required checks.

**Tech Stack:** Next.js App Router, next-auth, Drizzle ORM, Postgres, Node crypto/mail/http, Playwright, GitHub Actions (CodeQL/Dependency Review/gitleaks/ZAP)

---

### Task 1: Add Polling Core Domain Module (Parser + Matching + Entry Key)

**Files:**
- Create: `src/lib/poller/types.ts`
- Create: `src/lib/poller/normalize.ts`
- Create: `src/lib/poller/matcher.ts`
- Test: `src/lib/poller/normalize.test.ts`
- Test: `src/lib/poller/matcher.test.ts`

**Step 1: Write failing normalize tests**

Run: `npm test`
Expected: fail for missing `src/lib/poller/normalize.ts`.

**Step 2: Implement minimal normalize module**

- Normalize feed entries into stable shape.
- Generate deterministic `entryKey`.

**Step 3: Write failing matcher tests**

Run: `npm test`
Expected: fail for missing `src/lib/poller/matcher.ts`.

**Step 4: Implement matcher**

- Case-insensitive substring match against title+summary.
- Support global and feed-scoped rules.

**Step 5: Verify**

Run: `npm test`
Expected: new poller unit tests pass.

**Step 6: Commit**

```bash
git add src/lib/poller/types.ts src/lib/poller/normalize.ts src/lib/poller/matcher.ts src/lib/poller/normalize.test.ts src/lib/poller/matcher.test.ts
git commit -m "feat: add poller normalization and matcher core"
```

---

### Task 2: Build Poller Persistence and Logging Services

**Files:**
- Create: `src/lib/poller/store.ts`
- Create: `src/lib/poller/log.ts`
- Modify: `src/lib/app/logs.ts`
- Test: `src/lib/poller/store.test.ts`

**Step 1: Write failing persistence test**

- Verify deduped entry insert and alert insert behavior.

Run: `npm test`
Expected: fail for missing poller store functions.

**Step 2: Implement store module**

- Insert entries idempotently.
- Insert alerts idempotently via existing unique constraints.
- Query recent status markers.

**Step 3: Implement log writer helpers**

- Structured helper for `info|warn|error` user log writes.

**Step 4: Verify**

Run: `npm test`
Expected: all tests pass.

**Step 5: Commit**

```bash
git add src/lib/poller/store.ts src/lib/poller/log.ts src/lib/poller/store.test.ts src/lib/app/logs.ts
git commit -m "feat: add poller persistence and logging helpers"
```

---

### Task 3: Implement Notification Adapters (Pushover + SMTP)

**Files:**
- Create: `src/lib/notify/pushover.ts`
- Create: `src/lib/notify/smtp.ts`
- Create: `src/lib/notify/index.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Test: `src/lib/notify/pushover.test.ts`
- Test: `src/lib/notify/smtp.test.ts`

**Step 1: Add failing notifier tests**

- Pushover request shape test (mock fetch).
- SMTP transport call test (mock transporter).

Run: `npm test`
Expected: failing tests.

**Step 2: Install SMTP dependency**

Run: `npm i nodemailer`

**Step 3: Implement adapters**

- Decrypt stored creds using existing crypto module.
- Send payloads and return typed result objects.

**Step 4: Verify**

Run: `npm run lint && npm test`
Expected: pass.

**Step 5: Commit**

```bash
git add src/lib/notify/pushover.ts src/lib/notify/smtp.ts src/lib/notify/index.ts src/lib/notify/pushover.test.ts src/lib/notify/smtp.test.ts package.json package-lock.json
git commit -m "feat: implement pushover and smtp notification adapters"
```

---

### Task 4: Implement Poll Executor Service

**Files:**
- Create: `src/lib/poller/runner.ts`
- Create: `src/lib/poller/scheduler.ts`
- Test: `src/lib/poller/runner.test.ts`

**Step 1: Write failing runner integration tests**

- Seed users/feeds/rules/settings.
- Assert new entries + alerts + logs after run.

Run: `npm test`
Expected: fail for missing runner/scheduler modules.

**Step 2: Implement due-user scheduling**

- Select users due by interval and last poll marker.

**Step 3: Implement full run pipeline**

- Fetch feeds, normalize items, dedupe store, match rules, create alerts, send notifications, write logs.

**Step 4: Verify**

Run: `npm run lint && npm test`
Expected: pass.

**Step 5: Commit**

```bash
git add src/lib/poller/runner.ts src/lib/poller/scheduler.ts src/lib/poller/runner.test.ts
git commit -m "feat: add poll execution runner with due-user scheduling"
```

---

### Task 5: Add Secured Internal Poll API + Test Mode Trigger

**Files:**
- Create: `src/app/api/internal/poll/route.ts`
- Create: `src/app/api/e2e/poll/route.ts`
- Test: `src/app/api/internal/poll/route.test.ts`

**Step 1: Write failing auth guard tests**

- Missing/invalid bearer token returns 401.
- Valid token runs poller and returns summary.

Run: `npm test`
Expected: fail.

**Step 2: Implement internal poll route**

- `POST` only.
- Require `CRON_SECRET`.
- Execute poll runner and return run stats.

**Step 3: Add test-only poll trigger route**

- Available only when `E2E_TEST_MODE=1`.

**Step 4: Verify**

Run: `npm run lint && npm test`
Expected: pass.

**Step 5: Commit**

```bash
git add src/app/api/internal/poll/route.ts src/app/api/e2e/poll/route.ts src/app/api/internal/poll/route.test.ts
git commit -m "feat: add secured internal poll API and e2e trigger"
```

---

### Task 6: Update UI Surfaces (Overview + Logs) With Real Status

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/app/logs/page.tsx`
- Modify: `src/lib/app/logs.ts`
- Create: `src/lib/app/overview.ts`

**Step 1: Add failing overview data tests**

- Validate recent alerts/last poll/last alert aggregation query.

Run: `npm test`
Expected: fail.

**Step 2: Implement overview query module**

- Pull real alert/status counters.

**Step 3: Render on landing and/or app entry**

- Replace placeholders with live data for signed-in users.

**Step 4: Verify**

Run: `npm run lint && npm test && npm run build`
Expected: pass.

**Step 5: Commit**

```bash
git add src/lib/app/overview.ts src/app/page.tsx src/app/app/logs/page.tsx src/lib/app/logs.ts
git commit -m "feat: show real alert and poll status in UI"
```

---

### Task 7: Configure Vercel Cron

**Files:**
- Create: `vercel.json`
- Modify: `README.md`

**Step 1: Add cron config**

- Schedule every minute calling `/api/internal/poll`.

**Step 2: Document env vars**

- Add `CRON_SECRET`, note required auth header behavior.

**Step 3: Verify**

Run: `npm run build`
Expected: pass.

**Step 4: Commit**

```bash
git add vercel.json README.md
git commit -m "chore: configure vercel cron for poll worker"
```

---

### Task 8: Extend E2E To Cover Poll + Alerts + Logs

**Files:**
- Modify: `e2e/app.spec.ts`
- Modify: `playwright.config.ts`
- Modify: `package.json`

**Step 1: Add failing E2E expectations**

- Trigger `/api/e2e/poll`, expect logs + alerts to appear.

Run: `npm run test:e2e`
Expected: fail.

**Step 2: Implement E2E flow updates**

- Seed feed/rule.
- Trigger poll endpoint.
- Assert visible alert card and log rows.

**Step 3: Verify**

Run: `npm run test:e2e`
Expected: pass.

**Step 4: Commit**

```bash
git add e2e/app.spec.ts playwright.config.ts package.json package-lock.json
git commit -m "test: extend e2e coverage for polling alerts and logs"
```

---

### Task 9: CI/CD Security Workflows

**Files:**
- Create: `.github/workflows/codeql.yml`
- Create: `.github/workflows/dependency-review.yml`
- Create: `.github/workflows/zap-baseline.yml`
- Modify: `.github/workflows/secret-scan.yml`
- Modify: `README.md`

**Step 1: Add CodeQL workflow**

Run: `act`/push-based verification where available.

**Step 2: Add dependency review workflow**

- Run on PRs.

**Step 3: Add ZAP baseline workflow**

- Target production URL from secret/env.

**Step 4: Verify workflow lint**

Run: `yamllint .github/workflows/*.yml` (if available) or manual schema check.

**Step 5: Commit**

```bash
git add .github/workflows/codeql.yml .github/workflows/dependency-review.yml .github/workflows/zap-baseline.yml .github/workflows/secret-scan.yml README.md
git commit -m "ci: add security workflows for sast deps and dast"
```

---

### Task 10: Final Verification + Release Checklist

**Step 1: Local verification**

Run:
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run test:e2e`

Expected: all pass.

**Step 2: Deploy + smoke**

Run:
- `git push origin feature/vercel-nextjs`
- `vercel deploy --prod`

Then verify:
- `/signin` Google redirect works.
- Add feed + rule.
- Force poll (`/api/internal/poll` with token) and observe alert/log.
- Notification channel delivery success in logs.

**Step 3: Branch completion**

- Request code review.
- Merge after required checks pass.

