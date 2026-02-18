# Security Policy

## Reporting a Vulnerability

If you discover a security issue, please do not open a public issue.

Contact: open a private report via GitHub Security Advisories for this repository.

## Notes

- Runtime secrets must be provided via environment variables (Vercel env vars or local env).
- User-provided notification credentials are stored encrypted at rest (requires `APP_CRED_ENC_KEY`).
