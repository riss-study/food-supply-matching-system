#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/../.."

export DOCKER_HOST="${DOCKER_HOST:-unix:///Users/riss/.colima/default/docker.sock}"

echo "============================================"
echo "  잇다(food2008) 시드 데이터 투입"
echo "============================================"

echo ""
echo "=== 1/2. MariaDB 시드 ==="
docker exec fsm-local-mariadb-mariadb-1 mariadb -uroot -proot fsm_command < docker/mariadb/init/02-mock-data.sql
echo "MariaDB 시드 완료"

echo ""
echo "=== 2/2. MongoDB 시드 ==="
docker exec fsm-local-mongodb-mongodb-1 mongo --port 27017 fsm_read < docker/mongodb/init/02-seed-read-models.js
echo ""

echo "============================================"
echo "  시드 완료!"
echo ""
echo "  테스트 계정 (비밀번호: Test1234!)"
echo "  - 관리자: admin@test.com"
echo "  - 요청자: buyer@test.com"
echo "  - 공급자: supplier@test.com"
echo "============================================"
