# Handoff (Session State)

This file is meant to let a new Codex agent resume seamlessly.

## Repo

- GitHub: `cjwillin/rss-watcher`
- Working dir on this machine: `/root/rss-watcher`
- Deploy helper: `scripts/deploy-to-proxmox-ct.sh`

## Deploy Target

- Proxmox LXC CT: `112`
- systemd service: `rss-watcher.service`
- Port: `8080`
- Data: SQLite at `/opt/rss-watcher/data/rss-watcher.db` inside the container

## Original Goals (Status)

- Watch manually specified RSS feeds: DONE
- Multiple feeds: DONE
- Keyword matching: DONE (case-insensitive substring over title/summary/content)
- Alerting: DONE (de-duped per entry+rule)
- Notify via iOS push: DONE (Pushover)
- Notify via email: IMPLEMENTED (SMTP) but not verified end-to-end in production
- Minimal, modern UI: DONE (templates + CSS)
- Debuggability: DONE (`/logs` tab + internal log table)
- Tests: DONE (offline integration test; baseline behavior regression test)

## Important Behavioral Guarantees

### "Alert only going forward"

Implemented protections to avoid historical spam:

1. New feeds start `armed=0` and are baselined on first poll (no alerts).
2. Alerts are only generated for entries newly inserted during the current poll.
3. New rules do not backfill: entries with `seen_at < rules.created_at` are skipped for that rule.

## Deterministic Testing

`/test/feed.xml` exists for deterministic end-to-end validation but is gated by env:

- Enable: `RSSWATCHER_ENABLE_TEST_ENDPOINTS=1` in `/etc/rss-watcher.env`
- Disable: unset or set to `0`

## Secrets Handling

- Prefer `/etc/rss-watcher.env` (root-only) for secrets.
- Do not store credentials in repo or in markdown files.

## Known Setup Notes (Codex Environment)

These are not required for app runtime but were configured during this project:

- `frontend-design` skill installed to `/root/.codex/skills/frontend-design`
- "Superpowers" repo cloned to `/root/.codex/superpowers`
  - symlink: `/root/.agents/skills/superpowers` -> `/root/.codex/superpowers/skills`
- Codex may need restart to discover newly installed skills.

## What To Do First In A New Session

1. Read `docs/HANDOFF.md` and `docs/ARCHITECTURE.md`.
2. Confirm deploy health:
   - `curl http://<ct-ip>:8080/health`
   - `pct exec 112 -- systemctl status rss-watcher --no-pager`
3. If making code changes:
   - update repo
   - run tests in CT: `pct exec 112 -- bash -lc 'cd /opt/rss-watcher; . .venv/bin/activate; pip install -r requirements-dev.txt; python -m pytest -q'`
   - deploy via `CTID=112 ./scripts/deploy-to-proxmox-ct.sh`

