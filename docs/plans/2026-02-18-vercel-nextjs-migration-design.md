# RSS Watcher Vercel Migration (Next.js + Google + Postgres + GitHub Poller) Design

**Date:** 2026-02-18

## Goal

Move RSS Watcher from a Proxmox LXC running FastAPI + SQLite to a Vercel-hosted, internet-facing app on free tiers, with:

- Google OAuth login (open signups)
- Strict per-user isolation (each user has their own feeds/rules/alerts/settings)
- Postgres storage (Neon via Vercel Marketplace)
- Scheduled polling driven by GitHub Actions (not Vercel Cron)
- Modern security automation: SAST/DAST/secret scanning on GitHub on every deploy path

Out of scope for this phase:

- Migrating existing Proxmox SQLite data (we start fresh)
- Paid infrastructure (no Vercel Pro, no managed schedulers requiring payment)

## Constraints / Reality Checks

- Vercel’s “Vercel Postgres” product is no longer the default for new projects; Postgres is typically provisioned via the Marketplace (Neon). We will use Neon’s free plan via Vercel Marketplace.
- Vercel Cron on Hobby is limited to once/day, which is insufficient for RSS polling. Polling will run on GitHub Actions schedule (repo is public, so scheduled Actions are available).
- A public app cannot expose state-mutating routes without authentication; Google OAuth is required.

## Architecture Overview

### Web App (Vercel)

- Framework: Next.js (App Router), TypeScript
- Auth: Google OAuth via Auth.js / NextAuth
- UI: server components where sensible + client components for forms; minimal styling carried forward from existing app.

Routes:

- Public:
  - `/` landing page (marketing / explanation / sign-in link)
  - `/privacy` (minimal privacy policy: what is stored, who can see it)
- Authenticated (requires session):
  - `/app` dashboard (recent alerts, quick stats)
  - `/app/feeds` manage feeds
  - `/app/rules` manage rules
  - `/app/settings` notification credentials and poll configuration
  - `/app/logs` recent user-scoped logs (poll results, errors)

No admin-only global views are exposed; all state is per-user.

### Database (Neon Postgres)

We will use a relational schema close to the current SQLite model, plus user scoping and auth tables.

Core tables (draft):

- `users`
  - `id` (uuid)
  - `google_sub` (text unique)
  - `email` (text)
  - `name` (text)
  - `created_at`
- `feeds`
  - `id` (uuid)
  - `user_id` (fk)
  - `name` (text)
  - `url` (text)
  - `enabled` (bool)
  - `armed` (bool) baseline semantics (new feeds start `false`)
  - `created_at`
  - unique (`user_id`, `url`)
- `rules`
  - `id` (uuid)
  - `user_id` (fk)
  - `feed_id` (uuid nullable) NULL means “global rule for user”
  - `keyword` (text)
  - `enabled` (bool)
  - `created_at`
- `entries`
  - `id` (uuid)
  - `user_id` (fk)
  - `feed_id` (fk)
  - `entry_key` (text) stable ID/guid/link/hash
  - `link`, `title`, `published`, `summary`
  - `seen_at`
  - unique (`feed_id`, `entry_key`)
- `alerts`
  - `id` (uuid)
  - `user_id` (fk)
  - `entry_id` (fk)
  - `rule_id` (fk)
  - `keyword`
  - `created_at`
  - unique (`entry_id`, `rule_id`)
- `user_settings`
  - `user_id` (pk/fk)
  - `poll_interval_seconds` (int) used by poller (min clamp)
  - `pushover_app_token_enc` (bytea/text)
  - `pushover_user_key_enc` (bytea/text)
  - `smtp_host_enc`, `smtp_port_enc`, `smtp_user_enc`, `smtp_pass_enc`, `smtp_from_enc`, `smtp_to_enc`
  - `created_at`, `updated_at`
- `user_log`
  - `id`
  - `user_id`
  - `ts`, `level`, `area`, `message`
  - `feed_id`, `rule_id`, `entry_link`
  - `error` (text)

Notes:

- Everything is scoped by `user_id`. No cross-user reads/writes.
- We keep the same anti-spam semantics: baseline feeds (`armed=false` then set true on first poll), alerts only for newly-seen entries, and “rules apply going forward” using created timestamps.

### Secrets and Credential Storage

User-entered credentials (Pushover and SMTP) must be stored. Because the DB is shared and internet-facing:

- Encrypt at rest using symmetric encryption with an app-level key:
  - env var: `APP_CRED_ENC_KEY` (32 bytes base64 or hex; used by web app and poller)
- Decrypt only at use time (poller and authenticated settings view).
- Never log decrypted values.

### Polling (GitHub Actions)

Polling is moved out of the Vercel runtime into a scheduled GitHub Actions workflow.

- Schedule: every 10-15 minutes (tunable)
- Job:
  - Checkout repo
  - Install dependencies
  - Run `node scripts/poll.ts` (or similar)
  - Poller connects directly to Neon Postgres using a connection string stored in GitHub Actions secrets.

Important: this means **GitHub Actions must have DB credentials**. That is acceptable because:

- Repo is public but secrets are not exposed to PRs from forks (we will restrict scheduled workflow to `main` only)
- We will also gate any on-demand poll workflow with a secret token.

### Security Controls (GitHub)

We’ll implement “state of the art” scanning within free tooling constraints:

- SAST: GitHub CodeQL for JavaScript/TypeScript on PR + push to `main`
- Dependency scanning:
  - Dependabot for npm
  - `dependency-review` action for PRs
  - `npm audit` in CI (non-blocking initially, then ratchet)
- Secret scanning:
  - Gitleaks or TruffleHog action on PR + push to `main`
  - Pre-commit guidance (optional) but CI is required
- DAST:
  - OWASP ZAP baseline scan against the deployed Preview URL for PRs (public pages only)
  - OWASP ZAP baseline scan against production URL on push to `main`

Authentication-aware DAST is non-trivial with Google OAuth (requires a test auth bypass or recorded session). We will not introduce an auth bypass on a public app. Instead, DAST will focus on:

- headers, common misconfigs
- public endpoints, robots, and any accidental exposure

## Detailed Semantics to Preserve (from current app)

- Baseline new feeds: new feed starts unarmed; first poll inserts entries and flips `armed=true` without alerts.
- Alert only on newly-seen entries: if entry exists, skip.
- Rules apply going forward: if `entry.seen_at < rule.created_at`, skip creating alert.
- De-dupe:
  - entries unique per `(feed_id, entry_key)`
  - alerts unique per `(entry_id, rule_id)`

## Testing Strategy

- Unit tests:
  - keyword matching normalization
  - entry_key generation behavior
- Integration tests:
  - poller end-to-end using a mocked HTTP server + a real Postgres test DB (or a temporary schema)
  - ensure baseline behavior
  - ensure “going forward” rule behavior
  - ensure de-dupe invariants
- Web app tests:
  - basic route protection (middleware)
  - minimal form flows (feeds/rules/settings) with a mocked session

## Operational Runbook (New)

- Vercel deploys on push to `main` (standard)
- GitHub Actions schedule runs poller; poller writes user logs and alerts
- If poller breaks:
  - Check Actions logs
  - Check `user_log` for user-specific failures
  - Rollback by reverting commit and re-running workflow

## Required External Setup (User-Owned)

- Google OAuth client (Web application):
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - redirect URL depends on Vercel project URL
- Vercel project connected to GitHub repo
- Neon Postgres provisioned via Vercel Marketplace
- Secrets:
  - Vercel env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET` (session), `APP_CRED_ENC_KEY`, and database env vars injected by integration
  - GitHub Actions secrets: `DATABASE_URL` (poller), optionally `APP_CRED_ENC_KEY` if poller needs decrypt (it does), plus any other needed runtime config

