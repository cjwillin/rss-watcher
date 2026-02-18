#!/usr/bin/env bash
set -euo pipefail

url="$(bash "$(dirname "$0")/e2e-db-url.sh")"

# Extract host/port from the URL (simple parse; URL is fixed-format).
if [[ "$url" =~ ^postgres://[^@]+@([^:/]+):([0-9]+)/ ]]; then
  host="${BASH_REMATCH[1]}"
  port="${BASH_REMATCH[2]}"
else
  echo "Unexpected E2E DATABASE_URL: $url" >&2
  exit 1
fi

export PGPASSWORD="postgres"
for i in $(seq 1 60); do
  if pg_isready -h "$host" -p "$port" -U postgres -d rss_watcher_e2e >/dev/null 2>&1; then
    exit 0
  fi
  sleep 1
done

echo "Timed out waiting for Postgres to be ready at $host:$port" >&2
exit 1
