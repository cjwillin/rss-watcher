# Security Policy

## Reporting a Vulnerability

If you discover a security issue, please do not open a public issue.

Contact: open a private report via GitHub Security Advisories for this repository.

## Notes

- If you enter secrets in the web UI, they are stored in the SQLite DB as plaintext.
- Prefer environment variables in a root-owned env file (example: `/etc/rss-watcher.env`, mode `0600`).

