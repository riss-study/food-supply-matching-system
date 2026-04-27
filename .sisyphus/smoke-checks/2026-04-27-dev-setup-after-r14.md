# 로컬 dev 환경 setup (R14 secret 외부화 이후)

R14 부터 모든 secret (JWT/MariaDB/Redis) 가 환경변수로 외부화됨. 평문 secret 은 git 에 절대 안 들어감.

## 최초 1회 셋업

```bash
cd backend

# 1) .env 만들기 — 절대 commit 금지 (.gitignore 에 등록됨)
cp .env.example .env

# 2) JWT secret 생성 (32바이트 = 64 hex 문자)
JWT_SECRET=$(openssl rand -hex 32)
sed -i.bak "s|CHANGE_ME_64_HEX_CHARS_FROM_OPENSSL_RAND_HEX_32|$JWT_SECRET|" .env

# 3) Redis 비밀번호 생성
REDIS_PW=$(openssl rand -hex 16)
sed -i.bak "s|CHANGE_ME_redis_min_24_chars|$REDIS_PW|g" .env

# 4) MariaDB 비밀번호도 적당히
sed -i.bak 's|CHANGE_ME_root|root_local_pw|; s|CHANGE_ME_fsm|fsm_local_pw|g' .env

# 5) backup 파일 삭제
rm -f .env.bak

# 6) application-local.yml 만들기 (.example 복사)
cp api-server/src/main/resources/application-local.yml.example api-server/src/main/resources/application-local.yml
cp admin-server/src/main/resources/application-local.yml.example admin-server/src/main/resources/application-local.yml
# (이 파일들도 .gitignore 에 등록됨 — 그대로 사용)
```

## 매번 서버 띄울 때

```bash
cd backend

# 인프라
docker compose -f compose.local.mariadb.yml up -d

# Spring Boot — .env 의 값을 export 후 실행
set -a; source .env; set +a
SPRING_PROFILES_ACTIVE=local ./gradlew :api-server:bootRun &
SPRING_PROFILES_ACTIVE=local ./gradlew :admin-server:bootRun &
```

또는 IntelliJ IDEA 의 **EnvFile 플러그인** 으로 `.env` 자동 로드.

## 운영 환경

`.env` 사용 안 함. 각 환경변수를 secret manager (Vault, AWS Secrets Manager, Kubernetes Secret 등) 에서 주입:

- `SECURITY_JWT_SECRET`
- `SPRING_R2DBC_USERNAME`, `SPRING_R2DBC_PASSWORD`
- `SPRING_DATA_REDIS_PASSWORD`
- `FSM_SECURITY_TRUSTED_PROXIES` (운영 reverse proxy IP/CIDR)
- `FSM_CORS_ALLOWED_ORIGIN_PATTERNS` (운영 프론트 host)

## 검증

```bash
# Redis 인증 확인
docker exec fsm-local-mariadb-redis-1 redis-cli ping
# → NOAUTH (인증 없이는 차단)

docker exec fsm-local-mariadb-redis-1 redis-cli -a "$REDIS_PASSWORD" --no-auth-warning ping
# → PONG

# API health
curl http://localhost:8080/actuator/health
```
