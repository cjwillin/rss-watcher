# Security Policy

## Reporting a Vulnerability

If you discover a security issue, please do not open a public issue.

Contact: open a private report via GitHub Security Advisories for this repository.

## Notes

- Runtime secrets must be provided via environment variables (Vercel env vars or local env).
- User-provided notification credentials are stored encrypted at rest (requires `APP_CRED_ENC_KEY`).
- Internal cron execution requires `CRON_SECRET` bearer auth at `/api/internal/poll`.
- Feed URLs are validated to reduce SSRF exposure (non-http(s), localhost/private/link-local/metadata targets are blocked).

## Security CI Gates

Protected branches should require all of the following checks:

- `CodeQL / Analyze (javascript-typescript)`
- `Dependency Review / dependency-review`
- `Secret Scan (gitleaks) / gitleaks`
- `ZAP Baseline / zap`
- `CI / test`
- `CI / e2e`
