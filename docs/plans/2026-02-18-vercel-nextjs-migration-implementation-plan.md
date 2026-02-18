# RSS Watcher Vercel Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current FastAPI+SQLite deployment with a Vercel-hosted Next.js app using Google OAuth (open signups), per-user isolated state in Postgres (Neon), and scheduled RSS polling via GitHub Actions.

**Architecture:** Next.js web app on Vercel + Postgres (Neon via Vercel Marketplace). A Node-based poller runs in GitHub Actions on a schedule and writes alerts + logs to Postgres and sends per-user notifications (Pushover/SMTP).

**Tech Stack:** Next.js (App Router) + TypeScript, Auth.js/NextAuth (Google), Postgres (Neon), Drizzle ORM + migrations, GitHub Actions (CodeQL, Gitleaks, ZAP baseline, scheduled poller).

---

### Task 1: Create A Dedicated Next.js App Layout In Repo

**Files:**
- Create: `package.json`
- Create: `next.config.js`
- Create: `tsconfig.json`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/app/page.tsx`
- Create: `app/app/feeds/page.tsx`
- Create: `app/app/rules/page.tsx`
- Create: `app/app/settings/page.tsx`
- Create: `app/app/logs/page.tsx`
- Create: `app/api/health/route.ts`
- Create: `app/globals.css`
- Modify: `README.md`
- Modify: `.gitignore`

**Step 1: Scaffold Next.js**

Run:
```bash
cd /root/rss-watcher
npm create next-app@latest .
```

Expected:
- Next.js app files created in repo root
- TypeScript enabled
- App Router enabled

**Step 2: Remove/relocate legacy Python app out of the Vercel build path**

Run:
```bash
cd /root/rss-watcher
mkdir -p legacy-python
git mv rss_watcher legacy-python/rss_watcher
git mv requirements.txt requirements-dev.txt pytest.ini tests legacy-python/
git mv deploy scripts legacy-python/ || true
```

Expected:
- Next.js app is the deployable artifact at repo root
- Legacy code preserved but not part of build

**Step 3: Add basic routes**

- `/api/health` returns `{ ok: true }`
- `/` is public landing with "Sign in with Google"
- `/app/*` reserved for authenticated app

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app and move legacy python"
```

---

### Task 2: Add Auth (Google OAuth, Open Signups)

**Files:**
- Create: `auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts` (or v5 equivalent)
- Create: `middleware.ts`
- Create: `lib/auth/session.ts`
- Modify: `app/page.tsx`
- Modify: `app/app/*` pages to require session

**Step 1: Add auth dependencies**

Run:
```bash
npm i next-auth
```

**Step 2: Implement Google provider**

Env needed (Vercel):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_SECRET`

**Step 3: Protect app routes**

Implement middleware:
- Allow `/`, `/api/health`, `/api/auth/*`, `/privacy`
- Require auth for `/app` and all `/app/*`

**Step 4: Add sign-in/out controls**

- Public landing offers sign-in
- Authenticated header provides sign-out

**Step 5: Add tests**

**Files:**
- Create: `__tests__/middleware.test.ts`

Run:
```bash
npm i -D vitest @types/node
npm test
```

Expected:
- middleware rules unit-tested (pure function helpers)

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Google auth and route protection"
```

---

### Task 3: Add Postgres + Schema + Migrations (Drizzle)

**Files:**
- Create: `drizzle.config.ts`
- Create: `db/schema.ts`
- Create: `db/index.ts`
- Create: `db/migrations/*`
- Create: `lib/crypto/creds.ts`

**Step 1: Add DB deps**

Run:
```bash
npm i drizzle-orm postgres
npm i -D drizzle-kit
```

**Step 2: Define schema**

Tables:
- `users` (uuid, google_sub unique, email, name, timestamps)
- `feeds` (uuid, user_id, url unique per user, enabled, armed, timestamps)
- `rules` (uuid, user_id, feed_id nullable, keyword, enabled, created_at)
- `entries` (uuid, user_id, feed_id, entry_key, seen_at, link/title/published/summary, unique(feed_id, entry_key))
- `alerts` (uuid, user_id, entry_id, rule_id, keyword, created_at, unique(entry_id, rule_id))
- `user_settings` (user_id PK, poll interval, encrypted notif creds)
- `user_log` (bounded pruning)

**Step 3: Add encryption helper**

Env:
- `APP_CRED_ENC_KEY` (base64 32 bytes)

Implement:
- AES-256-GCM encrypt/decrypt
- Store versioned payload strings (eg `v1:<b64iv>:<b64tag>:<b64ct>`)

**Step 4: Create migration**

Run:
```bash
npx drizzle-kit generate
```

**Step 5: Add DB smoke test**

**Files:**
- Create: `__tests__/db-schema.test.ts`

Test:
- can connect with `DATABASE_URL`
- can create a user and user_settings row

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Postgres schema, migrations, and encrypted user settings"
```

---

### Task 4: Implement App UI (Feeds, Rules, Settings, Logs)

**Files:**
- Create: `lib/app/models.ts`
- Create: `lib/app/feeds.ts`
- Create: `lib/app/rules.ts`
- Create: `lib/app/settings.ts`
- Create: `lib/app/logs.ts`
- Modify: `app/app/feeds/page.tsx`
- Modify: `app/app/rules/page.tsx`
- Modify: `app/app/settings/page.tsx`
- Modify: `app/app/logs/page.tsx`
- Create: `app/app/feeds/actions.ts`
- Create: `app/app/rules/actions.ts`
- Create: `app/app/settings/actions.ts`
- Create: `app/app/logs/actions.ts`

**Step 1: Data access layer**

- All queries require `user_id`
- Enforce `user_id` filtering on every operation

**Step 2: Server actions**

Feeds:
- add feed (armed=false)
- toggle enabled
- delete feed

Rules:
- add rule (global or feed-scoped)
- toggle enabled
- delete rule

Settings:
- set poll interval seconds (clamp min 60)
- set Pushover creds (encrypted)
- set SMTP creds (encrypted)
- display “configured” status, do not reveal stored secrets

Logs:
- view recent user_log (pruned)
- clear logs

**Step 3: Tests**

**Files:**
- Create: `__tests__/user-isolation.test.ts`

Test:
- create two users, ensure user A cannot list or mutate user B resources (direct DAL tests)

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: implement per-user feeds/rules/settings/logs UI"
```

---

### Task 5: Implement RSS Poller (Node) With Current Semantics

**Files:**
- Create: `scripts/poll.ts`
- Create: `lib/poller/entry.ts`
- Create: `lib/poller/match.ts`
- Create: `lib/poller/poll-once.ts`
- Create: `lib/poller/notify/pushover.ts`
- Create: `lib/poller/notify/smtp.ts`
- Create: `lib/poller/log.ts`
- Modify: `package.json` (add `poll` script)

**Step 1: Add RSS + mail deps**

Run:
```bash
npm i rss-parser nodemailer
```

**Step 2: Implement entry_key + text extraction**

Match legacy behavior:
- Prefer id/guid/link for key, else hash of title+published+updated
- Match keyword as case-insensitive substring over concatenated title/summary/content
- Normalize keywords by collapsing whitespace

**Step 3: Implement baseline + going-forward semantics**

Per `(user, feed)`:
- If `armed=false`: insert current items into `entries`, set `armed=true`, log “baselined (no alerts)”
- Else: for each item:
  - attempt insert into `entries` (if already exists, skip)
  - evaluate rules for matches
  - skip a rule if `entry.seen_at < rule.created_at`
  - insert `alerts` (unique by entry+rule)
  - send notifications (pushover/smtp) based on user settings
  - log successes/failures

**Step 4: Add tests**

**Files:**
- Create: `__tests__/poller-semantics.test.ts`

Test:
- baseline produces no alerts
- second run produces alerts only for newly inserted entries
- rule created after entry does not backfill

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add scheduled poller with baseline and no-backfill semantics"
```

---

### Task 6: GitHub Actions (Polling + SAST + Secret Scan + DAST)

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/codeql.yml`
- Create: `.github/workflows/secret-scan.yml`
- Create: `.github/workflows/poll-schedule.yml`
- Create: `.github/workflows/dast-zap.yml`
- Create: `.github/dependabot.yml`

**Step 1: CI workflow**

Runs on PR + push:
- install deps (cache)
- typecheck + tests
- `npm audit --production` (non-blocking at first)

**Step 2: CodeQL**

Enable CodeQL for JS/TS.

**Step 3: Secret scanning**

Run Gitleaks (or TruffleHog) on PR + push to `main`.

**Step 4: DAST (baseline)**

Run OWASP ZAP baseline against locally started app:
- start `npm run start` (or `next dev`) on `localhost:3000`
- zap-baseline.py targets `http://127.0.0.1:3000/` (public routes)

**Step 5: Poll schedule**

Runs on `schedule` (every 10-15 minutes) and `workflow_dispatch`:
- uses secrets:
  - `DATABASE_URL`
  - `APP_CRED_ENC_KEY`
- runs `npm run poll`

**Step 6: Commit**

```bash
git add -A
git commit -m "ci: add CodeQL, secret scanning, ZAP DAST, and scheduled polling"
```

---

### Task 7: Vercel Project Wiring (CLI) + Environment Variables

**Files:**
- Modify: `README.md`

**Step 1: Create/link Vercel project**

Run:
```bash
vercel login
vercel link
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add AUTH_SECRET
vercel env add APP_CRED_ENC_KEY
```

**Step 2: Provision Neon via Vercel Marketplace**

Action (UI):
- Add Neon integration to project
- Confirm Postgres env vars are present in Vercel project settings

**Step 3: Set Google redirect URIs**

Add the Vercel URL(s) to Google OAuth client:
- Production callback
- Preview callback (optional)

**Step 4: Verify**

- `vercel --prod` deploy
- visit `/api/health`
- sign in
- create a feed/rule

**Step 5: Commit docs**

```bash
git add README.md
git commit -m "docs: add Vercel + Neon + GitHub Actions setup instructions"
```

