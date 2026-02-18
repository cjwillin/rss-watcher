#!/usr/bin/env bash
set -euo pipefail

compose_file="docker-compose.e2e.yml"

if command -v docker >/dev/null 2>&1; then
  docker compose -f "$compose_file" up -d
  exit 0
fi

# Fallback: try to start local Postgres and create the E2E DB.
if command -v systemctl >/dev/null 2>&1; then
  systemctl start postgresql >/dev/null 2>&1 || true
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "No docker and no psql found. Install Docker or PostgreSQL client/server for E2E." >&2
  exit 1
fi

# Ensure a password exists so TCP connections can authenticate.
runuser -u postgres -- psql -v ON_ERROR_STOP=1 -c "ALTER USER postgres PASSWORD 'postgres';" >/dev/null

if ! runuser -u postgres -- psql -tc "SELECT 1 FROM pg_database WHERE datname='rss_watcher_e2e'" | tr -d "[:space:]" | grep -q 1; then
  runuser -u postgres -- createdb rss_watcher_e2e
fi

