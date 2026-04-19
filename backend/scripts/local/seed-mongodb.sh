#!/usr/bin/env bash
set -euo pipefail

DOCKER_BIN=(docker)
if [[ -n "${DOCKER_CONTEXT:-}" ]]; then
  DOCKER_BIN+=(--context "$DOCKER_CONTEXT")
fi

"${DOCKER_BIN[@]}" volume create backend_mongodb-data >/dev/null
"${DOCKER_BIN[@]}" compose -f compose.local.mongodb.yml up -d mongodb
# createIndex 는 Mongo 자체에서 idempotent (같은 이름이면 no-op). 컬렉션이 이미 있어도 안전.
"${DOCKER_BIN[@]}" compose -f compose.local.mongodb.yml exec -T mongodb mongo fsm_read /docker-entrypoint-initdb.d/01-init-read-store.js
"${DOCKER_BIN[@]}" compose -f compose.local.mongodb.yml exec -T mongodb mongo fsm_read /docker-entrypoint-initdb.d/02-seed-read-models.js

echo "MongoDB init + seed complete on localhost:27018"
