#!/usr/bin/env bash
set -euo pipefail

# Deploy this repo into a Proxmox LXC container without clobbering persistent data.
#
# Usage:
#   CTID=112 ./scripts/deploy-to-proxmox-ct.sh
#
# Notes:
# - Preserves `/opt/rss-watcher/data/` and `/opt/rss-watcher/.venv/` on the container.
# - Requires `pct` on the host and an existing systemd service inside the CT.

CTID="${CTID:-}"
if [[ -z "${CTID}" ]]; then
  echo "CTID is required, e.g. CTID=112 $0" >&2
  exit 2
fi

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARBALL="/tmp/rss-watcher-deploy-${CTID}.tgz"
CT_TMP="/tmp/rss-watcher-deploy.tgz"
DST="/opt/rss-watcher"

tar \
  -C "${SRC_DIR}" \
  --exclude='./.git' \
  --exclude='./.venv' \
  --exclude='./data' \
  --exclude='./__pycache__' \
  --exclude='./.pytest_cache' \
  -czf "${TARBALL}" .

pct push "${CTID}" "${TARBALL}" "${CT_TMP}"

pct exec "${CTID}" -- bash -lc "
  set -euo pipefail
  mkdir -p '${DST}'
  tar -xzf '${CT_TMP}' -C '${DST}'
  chown -R rsswatcher:rsswatcher '${DST}'
  systemctl restart rss-watcher
  systemctl --no-pager --full status rss-watcher | sed -n '1,20p'
"

echo "Deployed to CT ${CTID}."

