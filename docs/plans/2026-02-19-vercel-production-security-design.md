# RSS Watcher Vercel Production + Security Design

**Date:** 2026-02-19

## Goal

Ship RSS Watcher as a production-ready Vercel-hosted app with the fastest safe polling cadence available on Vercel-only infrastructure, plus enforceable CI/CD security controls.

## Scope

In scope:
- Fast Vercel cron-driven polling with due-user scheduling and overload safety.
- Full app hardening for production behavior and data integrity.
- SSRF-safe feed ingestion.
- Enforced security workflows and merge gating.

Out of scope:
- Migrating off Vercel.
- New notification channels beyond Pushover + SMTP.
- Advanced rule language beyond substring matching.

## Section 1: Runtime Architecture (Approved)

- Keep `POST /api/internal/poll` on Node runtime with `CRON_SECRET` bearer auth.
- Configure Vercel cron for 1-minute cadence where plan permits.
- Poll execution flow:
  1. Select due users from `pollIntervalSeconds` + last completed poll timestamp.
  2. Process users with per-invocation cap to avoid runtime overruns.
  3. Return structured run stats and backlog signal (`hasMoreDue`) so subsequent minute runs drain backlog.
- Preserve idempotency via existing unique constraints:
  - `entries_feed_entry_key_uq`
  - `alerts_entry_rule_uq`

## Section 2: Production Feature Completion (Approved)

- Add strict feed URL validation:
  - allow only `http` / `https`
  - block localhost, loopback, link-local, RFC1918/private ranges, and metadata hosts/IPs
  - reject embedded credentials in URLs
- Enforce rule scope ownership:
  - when `feedId` is provided, verify feed belongs to same `userId`
- Poller hardening:
  - explicit feed timeout
  - bounded response size
  - entry count cap per feed per run
  - continue-on-error with structured logs
- Keep baseline semantics (`armed=false` first pass) and dedupe behavior.
- Expose operational stats from poll route for observability.

## Section 3: CI/CD Security + Gating (Approved)

- Required security checks:
  - CodeQL
  - Dependency Review
  - gitleaks secret scan
  - ZAP baseline
- Change ZAP from advisory mode to failing mode for actionable severities.
- Add Playwright e2e to required CI checks (merge gate).
- Add workflow concurrency and lock stable action versions where needed.
- Document required branch protection checks in repository docs.

## Section 4: Verification and Done Criteria (Approved)

Required verification before completion claim:
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- Targeted tests for:
  - URL SSRF guardrails
  - rule feed ownership checks
  - poll runner capping/backlog behavior

Production-ready exit criteria:
- Minute-level cron configured (or fastest allowed on active Vercel plan).
- SSRF protections live on feed intake paths.
- Security workflows are passing and marked as required checks.
- E2E-only auth/routes remain hard-gated by `E2E_TEST_MODE=1`.
- Ops docs include required env vars and cron secret rotation guidance.
