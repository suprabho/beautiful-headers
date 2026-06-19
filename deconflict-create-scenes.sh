#!/usr/bin/env bash
# Create the 15 DECONFLICT "Tactile Security Materials" scenes (spec Part 3).
# Password is read from the ADMIN_PASSWORD env var or prompted — never stored in the payload.
#
#   ADMIN_PASSWORD='...' ./deconflict-create-scenes.sh
# or just run it and paste the password when prompted.

set -euo pipefail
cd "$(dirname "$0")"

ENDPOINT="https://aura.promad.design/api/bulk-create-scenes"
PAYLOAD="${1:-deconflict-scenes-payload.json}"   # pass a payload file as arg 1

if [[ -z "${ADMIN_PASSWORD:-}" ]]; then
  read -r -s -p "Admin password: " ADMIN_PASSWORD
  echo
fi

# Merge the password into the payload at POST time (jq keeps it out of the file on disk).
jq --arg pw "$ADMIN_PASSWORD" '{password:$pw, projectId:.projectId, scenes:.scenes}' "$PAYLOAD" \
  | curl -sS -X POST "$ENDPOINT" -H "Content-Type: application/json" --data-binary @- \
  | jq '.summary, (.results[] | {title, slug, success, error})'
