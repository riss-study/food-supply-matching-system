# Backend Foundation

Task 01 foundation for the Phase 1 backend.

## Run

```bash
./gradlew :api-server:bootRun
./gradlew :admin-server:bootRun
```

## Run with local profile

```bash
docker volume create backend_mariadb-data >/dev/null
docker volume create backend_mongodb-data >/dev/null
docker compose -f compose.local.mariadb.yml up -d
docker compose -f compose.local.mongodb.yml up -d
export DOCKER_CONTEXT=colima # if you use Colima
./gradlew :api-server:bootRun --args='--spring.profiles.active=local'
./gradlew :admin-server:bootRun --args='--spring.profiles.active=local'
```

Local profile overrides:

- MariaDB (R2DBC): `localhost:13306`
- MongoDB: `localhost:27018`

## Local infrastructure

```bash
docker volume create backend_mariadb-data >/dev/null
docker volume create backend_mongodb-data >/dev/null
docker compose -f compose.local.mariadb.yml up -d
docker compose -f compose.local.mongodb.yml up -d
docker compose -f compose.local.mariadb.yml ps
docker compose -f compose.local.mongodb.yml ps
docker compose -f compose.local.mariadb.yml down
docker compose -f compose.local.mongodb.yml down
```

The local compose files provision:

- `compose.local.mariadb.yml`: MariaDB `11.4` on `13306`
- `compose.local.mongodb.yml`: MongoDB `4.4` on `27018` (AVX 미지원 환경 호환용)
- Existing local data is preserved by reusing the original Docker volumes `backend_mariadb-data` and `backend_mongodb-data`.

## Schema / Seed Commands

Initialize relational schema:

```bash
export DOCKER_CONTEXT=colima # if you use Colima
./scripts/local/init-mariadb.sh
```

Seed relational mock data:

```bash
export DOCKER_CONTEXT=colima # if you use Colima
./scripts/local/seed-mariadb.sh
```

Initialize Mongo read store:

```bash
export DOCKER_CONTEXT=colima # if you use Colima
./scripts/local/init-mongodb.sh
```

Seed Mongo read models:

```bash
export DOCKER_CONTEXT=colima # if you use Colima
./scripts/local/seed-mongodb.sh
```

## Verify

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Swagger UI (admin): `http://localhost:8081/swagger-ui.html`
- Bootstrap health: `http://localhost:8080/api/bootstrap/health`
- Bootstrap health (admin): `http://localhost:8081/api/admin/bootstrap/health`
