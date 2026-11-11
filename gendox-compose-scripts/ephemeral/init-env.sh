#!/usr/bin/env bash
#
# Writes .env for this checkout: a project name and a free set of ports. Run it
# once per checkout. It is the only script here, because choosing free ports is
# the one thing Docker Compose cannot do. Writing .env by hand from env.example
# works as well.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

if [ -f .env ]; then
  echo ".env already exists, nothing changed:" >&2
  grep -E '^(COMPOSE_PROJECT_NAME|EPH_[A-Z_]+_PORT)=' .env
  exit 0
fi

root="$(cd ../.. && pwd)"
folder="$(basename "$root" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//' | cut -c1-40)"

# Slots other environments own: stopped containers carry theirs as a label, and
# other worktrees of this repository may have a .env that was never started.
taken="$(docker ps -a --filter label=dev.ctrlspace.gendox.ephemeral=true \
  --format '{{.Label "dev.ctrlspace.gendox.ephemeral.api-port"}}' 2>/dev/null || true)"
while IFS= read -r worktree; do
  other="$worktree/gendox-compose-scripts/ephemeral/.env"
  if [ -f "$other" ]; then
    taken="$taken"$'\n'"$(sed -n 's/^EPH_API_PORT=//p' "$other")"
  fi
done < <(git worktree list --porcelain 2>/dev/null | sed -n 's/^worktree //p')

slot=""
for n in $(seq 1 99); do
  candidate="$(printf '%02d' "$n")"
  if echo "$taken" | grep -qx "81$candidate"; then continue; fi
  busy=0
  for port in "81$candidate" "31$candidate" "85$candidate" "55$candidate"; do
    if nc -z 127.0.0.1 "$port" >/dev/null 2>&1; then busy=1; fi
  done
  if [ "$busy" -eq 0 ]; then slot="$candidate"; break; fi
done
[ -n "$slot" ] || { echo "No free slot. See: docker compose ls -a" >&2; exit 1; }

name="gendox-eph-$folder"
# Another clone with the same folder name already uses it.
if docker compose ls -a -q 2>/dev/null | grep -qx "$name"; then
  name="$name-$slot"
fi

{
  echo "# Written by init-env.sh. One environment per checkout."
  echo "COMPOSE_PROJECT_NAME=$name"
  echo "EPH_API_PORT=81$slot"
  echo "EPH_FRONTEND_PORT=31$slot"
  echo "EPH_KEYCLOAK_PORT=85$slot"
  echo "EPH_DB_PORT=55$slot"
  echo
  # Provider keys: reuse those of the main checkout, else start blank.
  main="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null || echo .)")/gendox-compose-scripts/ephemeral/.env"
  if [ -f "$main" ] && grep -qE '^[A-Z_]+_KEY=.' "$main"; then
    grep -E '^[A-Z_]+_KEY=' "$main"
  else
    sed -n '/^# Optional provider keys/,$p' env.example
  fi
} > .env

echo "Wrote .env:" >&2
grep -E '^(COMPOSE_PROJECT_NAME|EPH_[A-Z_]+_PORT)=' .env
echo "Next: docker compose up -d --wait" >&2
