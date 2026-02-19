#!/usr/bin/env bash
set -euo pipefail

if command -v docker >/dev/null 2>&1; then
  # docker-compose.e2e.yml publishes db on localhost:54333
  echo "postgres://postgres:postgres@localhost:54333/rss_watcher_e2e"
  exit 0
fi

# Fallback: local Postgres on default port.
echo "postgres://postgres:postgres@localhost:5432/rss_watcher_e2e"

