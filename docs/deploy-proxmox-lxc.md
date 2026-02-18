# Deploy on Proxmox LXC

This project runs well inside an unprivileged Ubuntu container.

## Suggested container settings

- Unprivileged: yes
- Features: `nesting=1` (not strictly required, but common)
- Network: DHCP or static
- Disk: 1GB is usually plenty for the app; more if you store lots of history

## Ports

- App listens on `:8080` by default.
- If you enable Proxmox firewalling, allow inbound TCP/8080.

## Persistence

Data is stored in SQLite at:

- `/opt/rss-watcher/data/rss-watcher.db` (recommended)

Back it up like any other single-file DB (or snapshot the container).

## Deploy Updates Safely

When deploying new code, do not delete `/opt/rss-watcher/data/` (or you will wipe configuration and alert history).

If you deploy via tarball extraction, exclude `data/` and `.venv/` from the archive, or extract without removing the destination first.

This repo includes a helper script for Proxmox hosts:

- `scripts/deploy-to-proxmox-ct.sh`
