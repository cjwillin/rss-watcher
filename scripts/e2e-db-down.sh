#!/usr/bin/env bash
set -euo pipefail

compose_file="docker-compose.e2e.yml"

if command -v docker >/dev/null 2>&1; then
  docker compose -f "$compose_file" down
  exit 0
fi

# Local postgres fallback: no-op (don’t stop system services automatically).

