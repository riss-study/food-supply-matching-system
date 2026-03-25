#!/usr/bin/env bash
set -euo pipefail

DOCKER_BIN=(docker)
if [[ -n "${DOCKER_CONTEXT:-}" ]]; then
  DOCKER_BIN+=(--context "$DOCKER_CONTEXT")
fi

"${DOCKER_BIN[@]}" volume create backend_mariadb-data >/dev/null
"${DOCKER_BIN[@]}" compose -f compose.local.mariadb.yml up -d mariadb
"${DOCKER_BIN[@]}" compose -f compose.local.mariadb.yml exec -T mariadb mariadb -uroot -proot fsm_command < docker/mariadb/init/02-mock-data.sql

echo "MariaDB mock data seeded on localhost:13306"
