# RSS Watcher

Watch one or more RSS/Atom feeds and alert on keyword matches.

This branch contains the Vercel-deployable Next.js app (multi-user via Google OAuth + Postgres).

## Status

This repository has migrated from a legacy Python implementation to a Vercel-deployable Next.js app.
The previous Python version is preserved under `legacy-python/` for reference.

## What You Get

- Web UI to manage:
  - Feeds (RSS/Atom URLs)
  - Rules (keyword substring matches; global or per-feed)
  - Settings (poll interval, Pushover, SMTP)
- Background polling with Vercel Cron + internal authenticated poll endpoint
- Notifications:
  - iOS push via Pushover (recommended default)
  - Email via SMTP

## Screens

- Home: recent alerts + quick status (last poll/alert)
- App Overview: live counters, recent alerts, and poll health
- Feeds: add/pause/delete
- Rules: add/pause/delete, optional feed scope
- Settings: poll interval + notification credentials
- Logs: poll and delivery events with error context

## Local Dev

```bash
npm install
npm run dev
```

App:

- `http://localhost:3000/`

## Configuration (High Level)

All secrets must be provided via environment variables (Vercel env vars and/or local `.env.local`).

Required env vars (names only):

- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_SECRET` (or `NEXTAUTH_SECRET`)
- `APP_CRED_ENC_KEY` (32-byte base64 key; encrypts per-user notification credentials)
- `CRON_SECRET` (required bearer token for `/api/internal/poll`)
- `POLL_MAX_USERS_PER_RUN` (optional; default `25`)
- `POLL_MAX_ENTRIES_PER_FEED` (optional; default `200`)

Vercel Cron:

- `vercel.json` schedules `/api/internal/poll` daily on Hobby (`0 8 * * *`).
- Faster schedules (hourly/minutely) require Vercel Pro.
- Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` for cron requests.

## CI/CD Required Checks

Configure branch protection so merges require these checks:

- `CI / test`
- `CI / e2e`
- `CodeQL / Analyze (javascript-typescript)`
- `Dependency Review / dependency-review`
- `Secret Scan (gitleaks) / gitleaks`
- `ZAP Baseline / zap`

## Cron Secret Rotation

1. Generate a new strong token.
2. Update `CRON_SECRET` in Vercel environment variables.
3. Redeploy to ensure all runtime instances use the new value.
4. Verify the internal poll route still authenticates via Vercel cron.
5. Remove any old secret material from local shells/history where applicable.

DB migrations:

```bash
npm run db:migrate
```

## License

MIT (see `LICENSE`).
