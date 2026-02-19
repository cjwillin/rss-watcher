# RSS Watcher Vercel Production + Security Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the Next.js/Vercel RSS Watcher production-ready with SSRF-safe feed polling, throughput-safe minute cron execution, and enforced CI/CD security gating.

**Architecture:** Keep Vercel cron + internal authenticated poll route. Harden intake and poll execution with validation/caps, then make security workflows and e2e checks merge-blocking. Use strict TDD for each behavior change.

**Tech Stack:** Next.js 16, next-auth, Drizzle ORM, Postgres/Neon, rss-parser, nodemailer, Vitest, Playwright, GitHub Actions

---

### Task 1: Add Feed URL SSRF Guardrails

**Files:**
- Create: `src/lib/security/feed-url.ts`
- Test: `src/lib/security/feed-url.test.ts`
- Modify: `src/lib/app/feeds.ts`

**Step 1: Write failing unit tests for URL policy**

```ts
import { describe, expect, it } from "vitest";
import { validateFeedUrl } from "@/lib/security/feed-url";

describe("validateFeedUrl", () => {
  it("accepts public https URLs", () => {
    expect(validateFeedUrl("https://example.com/rss.xml").ok).toBe(true);
  });

  it("rejects localhost/private targets", () => {
    expect(validateFeedUrl("http://127.0.0.1/feed").ok).toBe(false);
    expect(validateFeedUrl("http://10.0.0.5/feed").ok).toBe(false);
    expect(validateFeedUrl("http://169.254.169.254/latest/meta-data").ok).toBe(false);
  });

  it("rejects credentials in URL", () => {
    expect(validateFeedUrl("https://user:pass@example.com/feed").ok).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/security/feed-url.test.ts`  
Expected: FAIL (module/function missing)

**Step 3: Implement minimal validator**

```ts
const METADATA_HOSTS = new Set(["169.254.169.254", "metadata.google.internal"]);

export function validateFeedUrl(raw: string): { ok: true; url: string } | { ok: false; reason: string } {
  const value = raw.trim();
  let u: URL;
  try { u = new URL(value); } catch { return { ok: false, reason: "invalid_url" }; }

  if (!["http:", "https:"].includes(u.protocol)) return { ok: false, reason: "invalid_scheme" };
  if (u.username || u.password) return { ok: false, reason: "credentials_not_allowed" };

  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return { ok: false, reason: "blocked_host" };
  if (METADATA_HOSTS.has(host)) return { ok: false, reason: "blocked_host" };

  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) {
    return { ok: false, reason: "blocked_ip" };
  }

  return { ok: true, url: u.toString() };
}
```

**Step 4: Wire validator into feed creation**

```ts
const verdict = validateFeedUrl(cleanUrl);
if (!verdict.ok) return;
await db.insert(feeds).values({ userId, name: cleanName, url: verdict.url, enabled: true });
```

**Step 5: Run tests**

Run: `npm test -- src/lib/security/feed-url.test.ts src/lib/app/user-isolation.test.ts`  
Expected: PASS

**Step 6: Commit**

```bash
git add src/lib/security/feed-url.ts src/lib/security/feed-url.test.ts src/lib/app/feeds.ts
git commit -m "feat: harden feed URL intake with SSRF guardrails"
```

### Task 2: Enforce Rule Feed Ownership

**Files:**
- Test: `src/lib/app/user-isolation.test.ts`
- Modify: `src/lib/app/rules.ts`

**Step 1: Add failing test for foreign feed scope**

```ts
it("rejects rule scoped to another user's feed", async () => {
  // create user A + user B + feed owned by B
  // call addRule(userA, "x", feedOwnedByB)
  // expect no inserted scoped rule
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/app/user-isolation.test.ts`  
Expected: FAIL

**Step 3: Implement minimal ownership check**

```ts
if (fid) {
  const feed = await db.select({ id: feeds.id }).from(feeds)
    .where(and(eq(feeds.id, fid), eq(feeds.userId, userId))).limit(1);
  if (!feed[0]) return;
}
```

**Step 4: Re-run tests**

Run: `npm test -- src/lib/app/user-isolation.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/app/rules.ts src/lib/app/user-isolation.test.ts
git commit -m "fix: enforce feed ownership for scoped rules"
```

### Task 3: Harden Poll Runner Capacity and Observability

**Files:**
- Test: `src/lib/poller/runner.test.ts`
- Modify: `src/lib/poller/runner.ts`
- Modify: `src/lib/poller/types.ts`
- Modify: `src/app/api/internal/poll/route.ts`

**Step 1: Add failing tests for caps/backlog signal**

```ts
it("caps processed users per invocation and exposes hasMoreDue", async () => {
  // mock due users > cap
  // expect only cap processed and hasMoreDue true
});

it("caps entries per feed per run", async () => {
  // mock many parsed items
  // expect processing stops at cap
});
```

**Step 2: Run tests to verify failure**

Run: `npm test -- src/lib/poller/runner.test.ts src/app/api/internal/poll/route.test.ts`  
Expected: FAIL

**Step 3: Implement minimal cap-aware flow**

```ts
const MAX_USERS_PER_RUN = Number(process.env.POLL_MAX_USERS_PER_RUN ?? 25);
const MAX_ENTRIES_PER_FEED = Number(process.env.POLL_MAX_ENTRIES_PER_FEED ?? 200);

export async function runDuePollers(now = new Date()) {
  const dueUsers = await getDueUsers(now);
  const toProcess = dueUsers.slice(0, MAX_USERS_PER_RUN);
  const hasMoreDue = dueUsers.length > toProcess.length;
  // aggregate stats
  return { ...stats, hasMoreDue };
}
```

**Step 4: Update poll API response contract**

```ts
const stats = await runDuePollers();
return NextResponse.json({ ok: true, stats, hasMoreDue: stats.hasMoreDue });
```

**Step 5: Re-run targeted tests**

Run: `npm test -- src/lib/poller/runner.test.ts src/app/api/internal/poll/route.test.ts`  
Expected: PASS

**Step 6: Commit**

```bash
git add src/lib/poller/runner.ts src/lib/poller/types.ts src/app/api/internal/poll/route.ts src/lib/poller/runner.test.ts src/app/api/internal/poll/route.test.ts
git commit -m "feat: add poll runner caps and backlog telemetry"
```

### Task 4: Set Minute Cron and Tighten Internal Poll Auth Tests

**Files:**
- Modify: `vercel.json`
- Test: `src/app/api/internal/poll/route.test.ts`

**Step 1: Add failing test for missing CRON_SECRET**

```ts
it("returns 500 when CRON_SECRET is missing", async () => {
  delete process.env.CRON_SECRET;
  const req = new Request("http://localhost/api/internal/poll", { method: "POST" });
  const res = await POST(req);
  expect(res.status).toBe(500);
});
```

**Step 2: Run test to verify failure (if absent)**

Run: `npm test -- src/app/api/internal/poll/route.test.ts`  
Expected: FAIL until assertion exists

**Step 3: Set fastest cron cadence for Vercel-only model**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [{ "path": "/api/internal/poll", "schedule": "*/1 * * * *" }]
}
```

**Step 4: Re-run tests**

Run: `npm test -- src/app/api/internal/poll/route.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add vercel.json src/app/api/internal/poll/route.test.ts
git commit -m "chore: enable minute cron and expand poll auth tests"
```

### Task 5: Enforce Security Workflows as Practical Gates

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/zap-baseline.yml`
- Modify: `.github/workflows/secret-scan.yml`
- Modify: `README.md`
- Modify: `SECURITY.md`

**Step 1: Add e2e to CI in failing-first mode**

- Add `e2e` job in `ci.yml` that runs `npm run test:e2e`.
- Keep existing lint/test/build job.

Run: `npm run test:e2e`  
Expected: PASS locally, job exists in workflow diff.

**Step 2: Make ZAP failing for actionable severities**

```yaml
with:
  target: ${{ secrets.ZAP_TARGET_URL }}
  fail_action: true
```

**Step 3: Add workflow concurrency controls**

```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

Apply similarly to security workflows where appropriate.

**Step 4: Document required checks**

- In `README.md`/`SECURITY.md`, list required branch protection checks:
  - `CI / test`
  - `CI / e2e`
  - `CodeQL / analyze`
  - `Dependency Review / dependency-review`
  - `Secret Scan (gitleaks) / gitleaks`
  - `ZAP Baseline / zap`

**Step 5: Verify workflows syntactically and test suite**

Run:
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run test:e2e`

Expected: PASS

**Step 6: Commit**

```bash
git add .github/workflows/ci.yml .github/workflows/zap-baseline.yml .github/workflows/secret-scan.yml README.md SECURITY.md
git commit -m "ci: enforce e2e and security gating workflows"
```

### Task 6: Final Verification and Release Checklist

**Files:**
- Modify: `README.md`
- Modify: `SECURITY.md`

**Step 1: Add runtime env + ops guidance**

Document names and purpose for:
- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_SECRET` / `NEXTAUTH_SECRET`
- `APP_CRED_ENC_KEY`
- `CRON_SECRET`
- `POLL_MAX_USERS_PER_RUN` (optional)
- `POLL_MAX_ENTRIES_PER_FEED` (optional)

**Step 2: Add cron secret rotation procedure**

- rotate in Vercel env
- redeploy
- verify `/api/internal/poll` authorized call

**Step 3: Full verification evidence**

Run:
```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

Expected:
- all commands exit `0`
- no failing tests
- build succeeds without runtime auth/poller regressions

**Step 4: Commit**

```bash
git add README.md SECURITY.md
git commit -m "docs: add production ops and security check requirements"
```
