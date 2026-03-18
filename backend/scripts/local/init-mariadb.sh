#!/usr/bin/env bash
set -euo pipefail

DOCKER_BIN=(docker)
if [[ -n "${DOCKER_CONTEXT:-}" ]]; then
  DOCKER_BIN+=(--context "$DOCKER_CONTEXT")
fi

"${DOCKER_BIN[@]}" compose -f compose.local.yml up -d mariadb
"${DOCKER_BIN[@]}" compose -f compose.local.yml exec -T mariadb mariadb -uroot -proot fsm_command < docker/mariadb/init/01-schema.sql

echo "MariaDB schema initialized on localhost:13306"
