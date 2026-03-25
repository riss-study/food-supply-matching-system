#!/usr/bin/env bash
set -euo pipefail

DOCKER_BIN=(docker)
if [[ -n "${DOCKER_CONTEXT:-}" ]]; then
  DOCKER_BIN+=(--context "$DOCKER_CONTEXT")
fi

"${DOCKER_BIN[@]}" volume create backend_mongodb-data >/dev/null
"${DOCKER_BIN[@]}" compose -f compose.local.mongodb.yml up -d mongodb
"${DOCKER_BIN[@]}" compose -f compose.local.mongodb.yml exec -T mongodb mongo fsm_read /docker-entrypoint-initdb.d/02-seed-read-models.js

echo "MongoDB mock read models seeded on localhost:27018"
