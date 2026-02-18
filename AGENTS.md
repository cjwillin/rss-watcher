# Agent Handoff (Read First)

This repository is intended to be modified by AI coding agents (Codex) across sessions.

## Golden Rule

Codex does not reliably retain state across restarts. Persist state in repo markdown files and always begin a new session by reading:

1. `docs/HANDOFF.md`
2. `docs/ARCHITECTURE.md`
3. `docs/OPERATIONS.md`

## Repo Facts

- App: FastAPI + Jinja templates + static CSS (no build step)
- Data: SQLite (`RSSWATCHER_DB_PATH`)
- Polling: background task inside FastAPI lifespan
- Deploy target (current): Proxmox LXC CT112 running systemd service `rss-watcher`

