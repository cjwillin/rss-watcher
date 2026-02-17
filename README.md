# RSS Watcher

Watch one or more RSS/Atom feeds and alert on keyword matches.

Includes a minimal, polished web UI plus a background polling loop that de-dupes alerts per `(feed item, rule)`.

## What You Get

- Web UI to manage:
  - Feeds (RSS/Atom URLs)
  - Rules (keyword substring matches; global or per-feed)
  - Settings (poll interval, Pushover, SMTP)
- Background polling with SQLite persistence
- Notifications:
  - iOS push via Pushover (recommended default)
  - Email via SMTP

## Screens

- Home: recent alerts + quick status (last poll/alert)
- Feeds: add/pause/delete
- Rules: add/pause/delete, optional feed scope
- Settings: poll interval + notification credentials

## Quick Start (Local Dev)

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn rss_watcher.main:app --host 0.0.0.0 --port 8080
```

Open:

- `http://127.0.0.1:8080/`

## Configuration

SQLite DB:

- Default (dev): `./data/rss-watcher.db`
- Override with `RSSWATCHER_DB_PATH`

Notifications:

- Pushover:
  - `PUSHOVER_APP_TOKEN`
  - `PUSHOVER_USER_KEY`
- SMTP:
  - `SMTP_HOST`, `SMTP_PORT`
  - `SMTP_USER`, `SMTP_PASS` (optional; supports unauthenticated relays)
  - `SMTP_FROM`, `SMTP_TO`

Environment variables override anything set in the UI.

## Production Deploy (systemd)

See `docs/deploy-systemd.md`.

## Proxmox LXC Notes

See `docs/deploy-proxmox-lxc.md`.

## Security Notes

- If you enter secrets in the web UI, they are stored in SQLite as plaintext.
- Prefer environment variables via an env file readable only by root (example: `/etc/rss-watcher.env`).

## License

MIT (see `LICENSE`).

