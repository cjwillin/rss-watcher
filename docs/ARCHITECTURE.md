# Architecture

## Overview

RSS Watcher is a single-process FastAPI web app that:

- Serves a minimal UI (Jinja2 templates + static CSS)
- Stores configuration and state in SQLite
- Runs a background polling loop to fetch RSS/Atom feeds
- Creates alerts when feed items match keyword rules
- Sends notifications (Pushover, SMTP)
- Writes an internal app log visible in the UI (`/logs`)

## Key Modules

- `rss_watcher/main.py`
  - FastAPI routes for UI pages (`/`, `/feeds`, `/rules`, `/settings`, `/logs`)
  - Lifespan starts background polling loop (`run_loop`)
  - Optional test-only RSS endpoint (`/test/feed.xml`) guarded by env

- `rss_watcher/watcher.py`
  - `poll_once()` fetches feeds, parses entries, matches rules, creates alerts, sends notifications
  - `run_loop()` calls `poll_once()` on a configurable interval

- `rss_watcher/notifier.py`
  - Pushover integration via HTTPS
  - SMTP integration via Python stdlib `smtplib`
  - Reads secrets from env first, falls back to DB kv settings

- `rss_watcher/db.py`
  - SQLite connection + migrations
  - `kv` helpers
  - `app_log` writer + bounded pruning

## Data Model (SQLite)

Tables (most important):

- `feeds`
  - `url` unique
  - `enabled` toggles polling
  - `armed` (important): new feeds start `armed=0` to baseline without alerts

- `rules`
  - `keyword` substring match (case-insensitive)
  - `feed_id` nullable (NULL = global rule)
  - `created_at` used to avoid backfilling old items when a new rule is added

- `entries`
  - De-dupe per `(feed_id, entry_key)`
  - `seen_at` is when we first observed the item (used for "rules apply going forward")

- `alerts`
  - De-dupe per `(entry_id, rule_id)`

- `app_log`
  - Internal log events (poll start/finish, fetch errors, matches, notify sent/failed)

## Polling + Matching Semantics

### Feed baseline (no backlog spam)

When a feed is newly added via UI:

- It is inserted with `armed=0`
- On the next poll, the watcher:
  - stores current items into `entries` (seen)
  - sets `armed=1`
  - emits a log `feed baselined (no alerts)`
- Subsequent polls only consider *newly-seen* entries for alerts.

### Alert only for newly-seen entries

On a normal poll for `armed=1` feeds:

- If an entry already exists in `entries`, it is skipped (no alert).
- Only entries inserted during the current poll are evaluated for matching and alerts.

### Rules apply going forward

Even for newly-seen entries, the watcher skips alerts for a rule if:

- `entries.seen_at < rules.created_at`

This prevents rule backfill when a rule is created after an entry was already observed.

## Notifications

### Pushover (iOS push)

- Uses env vars: `PUSHOVER_APP_TOKEN`, `PUSHOVER_USER_KEY`
- Or DB kv values: `pushover_app_token`, `pushover_user_key`
- The watcher logs `notify pushover sent` or `notify pushover failed` with traceback.

### SMTP (email)

- Uses env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_TO`
- Or DB kv values: `smtp_*`
- The watcher logs `notify email sent` or `notify email failed`.

## UI Debugging

- `GET /logs` renders the most recent log entries and expands error stack traces.
- `POST /logs/clear` clears the log table.

## Test Endpoint (Optional)

`GET /test/feed.xml?kw=...`

- Returns a minimal RSS document containing `kw` in the item title/description
- Guarded by env: set `RSSWATCHER_ENABLE_TEST_ENDPOINTS=1` to enable
- Intended for deterministic end-to-end validation (keyword match + notification) without waiting for a real feed.

