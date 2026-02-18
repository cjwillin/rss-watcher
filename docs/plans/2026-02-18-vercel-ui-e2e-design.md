# Vercel UI Polish + E2E Design

**Date:** 2026-02-18

## Goal

Ship a simple, polished Vercel-hosted RSS Watcher app:

- Public marketing landing page at `/` (splash, copy, inline illustrations) with a single CTA: **Sign in**.
- Dedicated sign-in page at `/signin` (same visual system).
- Signed-in app under `/app/*` with consistent, “legacy-python” polish.
- Deterministic end-to-end tests that cover signed-in flows without driving real Google OAuth UI.

## Non-Goals

- Implement the poller, feed fetching, alert generation, or notification delivery.
- Implement “real” alerts UI beyond placeholders.
- Add more auth providers beyond Google (production) and test-only credentials (E2E).

## UX / Routing

- `/` (public):
  - Marketing splash with sections: hero, how-it-works, feature grid, security/trust, footer.
  - Inline SVG illustrations (no stock photos).
  - Single CTA button linking to `/signin`.
- `/signin` (public):
  - Centered card: “Continue with Google”.
  - When `E2E_TEST_MODE=1`, also show “Continue as test user”.
- `/app`:
  - Redirect to `/app/feeds` for now (keeps polish high, avoids half-baked dashboard).
- Auth gating:
  - `middleware.ts` continues to protect `/app/*`, but redirects unauthenticated users to `/signin`.
  - Server-side `requireUserId()` also redirects to `/signin`.

## Visual System

Keep the existing “paper/ink” theme and legacy typography:

- Fonts: Fraunces (display), IBM Plex Sans (body), IBM Plex Mono (mono).
- Background: soft radial gradients + subtle grid texture.
- Components: cards, pills, buttons, nav, forms as defined in `src/app/globals.css`.

Add only what’s needed for marketing layout + sign-in page (no new UI framework).

## Auth Design (Production vs E2E)

Production:

- NextAuth Google provider only.
- Custom sign-in page via `pages.signIn = "/signin"`.

E2E mode (`E2E_TEST_MODE=1`):

- Enable a NextAuth Credentials provider (only in test mode).
- Credentials sign-in sets a deterministic `googleSub` on the JWT/session so existing user isolation works.
- Add test-only API routes under `/api/e2e/*` for DB reset (guarded by `E2E_TEST_MODE`).

## E2E Testing Strategy

Use `@playwright/test` runner.

- Bring up a disposable Postgres via Docker (`docker-compose.e2e.yml`).
- Run Drizzle migrations against that DB (`DATABASE_URL`).
- Start the Next.js server with env:
  - `E2E_TEST_MODE=1`
  - `DATABASE_URL=<docker postgres url>`
  - `AUTH_SECRET=<test value>`
  - (Google env vars can be dummy for E2E since Credentials provider is used)

Test flows:

- Public:
  - `/` loads and contains CTA.
  - CTA navigates to `/signin`.
  - `/api/health` returns `{ ok: true }`.
- Auth:
  - Sign in as test user.
- App:
  - Feeds: add, toggle, delete.
  - Rules: add (global and scoped), toggle, delete.
  - Settings: save poll interval + clear flows.
  - Logs: clear logs (and verify empty state).

## Security / Safety

- Test-only auth and `/api/e2e/*` routes are gated by `E2E_TEST_MODE=1`.
- No secrets committed; all runtime secrets remain env vars.

