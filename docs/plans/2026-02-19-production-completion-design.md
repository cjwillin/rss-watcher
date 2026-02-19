# RSS Watcher Production Completion Design

**Date:** 2026-02-19

## Goal

Complete the Next.js/Vercel migration so RSS Watcher is fully functional in production with:

- background polling
- keyword matching and deduped alerts
- Pushover + SMTP notification delivery
- useful runtime logs and dashboard signals
- CI/CD security controls (SAST, dependency review, secret scanning, DAST, deploy gating)

## Product Scope

In scope:

- Poll enabled feeds for each signed-in user according to per-user poll interval.
- Persist feed items (`entries`) and matched notifications (`alerts`) with idempotency.
- Deliver notifications using encrypted credentials from `user_settings`.
- Populate Logs UI with real poll/delivery events and errors.
- Show recent alert data and last poll/last alert status on home screens.
- Add and enforce CI/CD security workflows and merge/deploy gating.

Out of scope:

- Complex rule language beyond current substring matching.
- Real-time push channels beyond Pushover/SMTP.
- Multi-region scheduler orchestration.

## Runtime Architecture

Primary scheduler model: **Vercel Cron + secured internal API route**.

- Add internal endpoint: `POST /api/internal/poll`
- Protect endpoint with shared secret header:
  - `Authorization: Bearer ${CRON_SECRET}`
- Configure Vercel Cron to call endpoint every minute.
- Worker selects users whose `pollIntervalSeconds` window is due.
- Worker executes poll pipeline:
  1. fetch feeds
  2. parse/normalize entries
  3. dedupe/persist
  4. evaluate rules
  5. persist alerts
  6. send notifications
  7. write logs

Idempotency:

- `entries_feed_entry_key_uq` prevents duplicate entries.
- `alerts_entry_rule_uq` prevents duplicate alerts.
- Safe to rerun cron on overlap/retry.

## Data and Processing Design

### Feed Polling

- Use `feedparser`-compatible parsing behavior in Node ecosystem to read RSS/Atom.
- Normalize each item into:
  - `entry_key` (stable hash of `guid|id|link|title|published`)
  - `title`, `link`, `published`, `summary`
- Skip entries with insufficient identifiers.

### Matching

- Rules remain case-insensitive substring checks over `title + summary`.
- Rule applicability:
  - global (`feedId = null`) or feed-specific (`feedId = current feed`)
- One alert row per matching `(entry, rule)`.

### Notifications

Pushover:

- Decrypt app token/user key from settings.
- POST to Pushover API with alert details.

SMTP:

- Decrypt SMTP host/port/user/pass/from/to.
- Send concise email containing matched title/link/keyword/feed.

Delivery behavior:

- Attempt both configured channels.
- Channel failures are logged; one channel failure does not block the other.

### Logging and Status

- Write `user_log` entries for:
  - poll cycle start/end
  - feed fetch failures
  - parse failures
  - match counts
  - per-channel delivery success/failure
- Home screens show:
  - recent alerts
  - last successful poll time
  - last alert time

## Security Design

- `CRON_SECRET` required for internal poll endpoint.
- `E2E_TEST_MODE=1` gates all test-only auth/routes.
- No secrets in git; runtime secrets only via Vercel/GitHub secrets.
- Existing encrypted settings (`APP_CRED_ENC_KEY`) remain required for notification credentials.

## CI/CD Security Roadmap Completion

Add/verify workflows:

- CodeQL (SAST)
- Dependency Review (PR gate)
- gitleaks (secret scanning)
- OWASP ZAP baseline (DAST) against production URL

Gating:

- Required checks enabled before merge/deploy.
- Failed security checks block merge to protected branch.

## Testing Strategy

Unit tests:

- parser/normalization
- matcher logic
- notification adapters (mock external calls)
- cron auth guard

Integration tests:

- poll pipeline over seeded DB users/feeds/rules/settings
- idempotent reruns

E2E tests:

- existing public/auth/app flows
- trigger internal poll in test mode
- assert alerts + logs become visible

Operational verification:

- staging/production smoke run confirms end-to-end alert delivery.

## Risks and Mitigations

- Scheduler overlap/reruns:
  - mitigated by DB uniqueness constraints and idempotent operations.
- Third-party feed variability:
  - robust parsing with defensive logging per feed.
- Notification provider transient errors:
  - per-channel error logs, no total pipeline abort.
- Security workflow noise:
  - baseline configs + clear suppression policy for false positives.

