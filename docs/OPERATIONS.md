# Operations

## Current Deploy Target (as of 2026-02-18)

- Proxmox LXC: CT112
- Hostname: `rss-watcher`
- Service: `rss-watcher.service`
- Listen: `0.0.0.0:8080`
- UI: `http://<ct-ip>:8080/`
- Logs UI: `http://<ct-ip>:8080/logs`

IP may change if DHCP. To find it:

```bash
pct exec 112 -- ip -brief addr show eth0
```

## On-Box Paths

Inside CT112:

- App: `/opt/rss-watcher`
- Venv: `/opt/rss-watcher/.venv`
- SQLite DB: `/opt/rss-watcher/data/rss-watcher.db`
- Env file (root-only): `/etc/rss-watcher.env`
- systemd unit: `/etc/systemd/system/rss-watcher.service`

## Service Commands (from Proxmox host)

```bash
pct exec 112 -- systemctl status rss-watcher --no-pager
pct exec 112 -- systemctl restart rss-watcher
pct exec 112 -- journalctl -u rss-watcher --no-pager -n 200
```

## Safe Deploy (Do Not Wipe DB)

Do not delete `/opt/rss-watcher/data/` during deploy.

Use the repo helper on the Proxmox host:

```bash
CTID=112 ./scripts/deploy-to-proxmox-ct.sh
```

This script excludes `.git/`, `.venv/`, and `data/` when building the tarball, preserving persistent state.

## One-shot Poll (Debug)

Run a single poll inside CT112 (useful for debugging):

```bash
pct exec 112 -- bash -lc 'cd /opt/rss-watcher; /opt/rss-watcher/.venv/bin/python -c "import asyncio; from rss_watcher.watcher import poll_once; print(asyncio.run(poll_once()))"'
```

## Deterministic End-to-End Test (Push)

1. Enable test endpoint:
   - set `RSSWATCHER_ENABLE_TEST_ENDPOINTS=1` in `/etc/rss-watcher.env`
   - restart service
2. Add a feed pointing to:
   - `http://127.0.0.1:8080/test/feed.xml?kw=<unique>`
3. Add a rule scoped to that feed with the same `<unique>` keyword.
4. Run one-shot poll (above).
5. Confirm:
   - `/logs` shows `match` and `notify pushover sent`
   - device receives push.

Disable test endpoint afterwards by removing the env var or setting it to `0`.

## CI / Security

- CI: `.github/workflows/ci.yml`
- Secret scanning:
  - `.github/workflows/secret-scan.yml` (scheduled)
  - `.github/workflows/secret-scan-once.yml` (manual)

