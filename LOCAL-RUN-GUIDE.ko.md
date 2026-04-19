# 로컬 실행 가이드

이 문서는 이 프로젝트를 로컬에서 실행해서 실제 화면을 브라우저로 확인하는 방법을 단계별로 정리한 가이드입니다.

대상 독자:

- 처음 프로젝트를 받는 개발자
- 화면만 먼저 확인해보고 싶은 기획자/운영자
- backend, frontend, DB를 한 번에 띄워야 하는 팀원

---

## 1. 먼저 알아둘 것

이 프로젝트는 크게 네 덩어리로 실행됩니다.

1. MariaDB
2. MongoDB
3. API 서버 (`8080`)
4. Admin 서버 (`8081`)
5. Main 프론트 (`Vite dev server`)
6. Admin 프론트 (`Vite dev server`)

즉, 화면을 제대로 보려면 `DB 2개 + 서버 2개 + 프론트 2개`가 필요합니다.

---

## 2. 준비물

### 필수 설치

- Git
- Docker
- Java 21
- Node.js
- Corepack 사용 가능 환경

참고:

- backend는 Gradle과 Java 21 기준으로 구성되어 있습니다.
- frontend는 `yarn@4.5.0` workspace를 사용합니다.

---

## 3. 프로젝트 구조 빠르게 보기

- `backend/`: API 서버, Admin 서버, DB 스키마/시드, 로컬 compose
- `frontend/`: main-site, admin-site, 공용 타입/유틸
- `backend/compose.local.mariadb.yml`: MariaDB 로컬 실행 파일
- `backend/compose.local.mongodb.yml`: MongoDB 로컬 실행 파일

---

## 4. 처음 한 번만 할 일

### 4.1 frontend 패키지 설치

프로젝트 루트가 아니라 `frontend/`에서 설치합니다.

```bash
cd frontend
corepack enable
yarn install
```

### 4.2 frontend 환경변수 파일 준비(권장)

기본값이 이미 localhost를 바라보도록 되어 있어서 꼭 필요하진 않지만, 명시적으로 맞춰두는 것을 권장합니다.

```bash
cd frontend
cp .env.example .env.local
```

기본값:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_ADMIN_API_BASE_URL=http://localhost:8081
```

---

## 5. 로컬 DB 실행

`backend/`로 이동한 뒤 아래 명령을 실행합니다.

```bash
cd backend
docker volume create backend_mariadb-data >/dev/null
docker volume create backend_mongodb-data >/dev/null
docker compose -f compose.local.mariadb.yml up -d
docker compose -f compose.local.mongodb.yml up -d
```

상태 확인:

```bash
docker compose -f compose.local.mariadb.yml ps
docker compose -f compose.local.mongodb.yml ps
```

참고:

- MariaDB 포트: `13306`
- MongoDB 포트: `27018`

### Colima를 쓰는 경우

README 기준으로 아래 환경변수를 먼저 잡고 실행하면 됩니다.

```bash
export DOCKER_CONTEXT=colima
```

---

## 6. 스키마와 시드 데이터 넣기

DB만 띄우는 것으로 끝나지 않고, 최소한 스키마와 읽기용 데이터도 넣어야 화면이 의미 있게 보입니다.

`backend/`에서 아래 순서대로 실행합니다.

```bash
./scripts/local/init-mariadb.sh
./scripts/local/seed-mariadb.sh
./scripts/local/init-mongodb.sh
./scripts/local/seed-mongodb.sh
```

### Colima를 쓰는 경우

```bash
export DOCKER_CONTEXT=colima
./scripts/local/init-mariadb.sh
./scripts/local/seed-mariadb.sh
./scripts/local/init-mongodb.sh
./scripts/local/seed-mongodb.sh
```

참고:

- 현재 `02-mock-data.sql`은 최소한의 marker 성격이 강합니다.
- 즉, “완성된 데모 계정 세트”가 자동으로 깔리는 구조는 아닙니다.

### 시드 파일을 수정했다면 **반드시** 재시드

MongoDB 의 `docker-entrypoint-initdb.d/` 는 **컨테이너 초기화 시 한 번만** 실행됩니다. 따라서:

- `backend/docker/mongodb/init/02-seed-read-models.js` 를 수정해도,
- Docker volume (`backend_mongodb-data`) 이 이미 초기화된 상태라면 **자동으로 재실행되지 않습니다**.

스크립트 자체는 idempotent (`_id: /seed_/` 패턴으로 기존 문서 `deleteMany` 후 재삽입) 하므로, 아래 명령을 **수동 실행** 해야 최신 seed 가 반영됩니다:

```bash
cd backend
./scripts/local/seed-mongodb.sh
# Colima 를 쓰는 경우
DOCKER_CONTEXT=colima ./scripts/local/seed-mongodb.sh
```

**체크 포인트** (재시드 필요 신호):
- 백엔드가 "Failed to instantiate … Document" 류 5xxx 에러를 뱉을 때
- seed 스크립트에 새 필드가 추가됐을 때 (예: `requesterUserId`, `updatedAt` 등)
- 새 view collection 추가 / 기존 collection schema 변경 시

MariaDB 쪽 seed 도 동일 원리. `02-mock-data.sql` 수정 시 `./scripts/local/seed-mariadb.sh` 재실행.

> 2026-04-19 세션에 실제로 `requester_request_summary_view` 문서에 `requesterUserId/updatedAt` 필드 누락으로 견적 제출 API 가 code 5000 에러를 냈고, `./scripts/local/seed-mongodb.sh` 수동 재실행으로 복구. 상세는 `docs/REFACTORING-GUIDELINES.ko.md §8` 사례 3.

---

## 7. backend 서버 실행

서버는 `backend/`에서 실행합니다.

### 터미널 1 - API 서버

```bash
cd backend
./gradlew :api-server:bootRun --args='--spring.profiles.active=local'
```

### 터미널 2 - Admin 서버

```bash
cd backend
./gradlew :admin-server:bootRun --args='--spring.profiles.active=local'
```

실행 후 확인 URL:

- API 서버: `http://localhost:8080`
- Admin 서버: `http://localhost:8081`

헬스체크:

- API health: `http://localhost:8080/api/bootstrap/health`
- Admin health: `http://localhost:8081/api/admin/bootstrap/health`

Swagger:

- API Swagger: `http://localhost:8080/swagger-ui.html`
- Admin Swagger: `http://localhost:8081/swagger-ui.html`

---

## 8. frontend 서버 실행

프론트는 `frontend/`에서 실행합니다. 워크스페이스 구조·env·라우트 맵 등 프론트 자체 상세는 [`frontend/README.md`](./frontend/README.md) 와 각 앱의 README ([main-site](./frontend/apps/main-site/README.md) / [admin-site](./frontend/apps/admin-site/README.md)) 참조.

### 터미널 3 - main-site

```bash
cd frontend
yarn dev:main-site
```

### 터미널 4 - admin-site

```bash
cd frontend
yarn dev:admin-site
```

참고:

- Vite는 기본적으로 첫 번째 앱을 `5173`에 띄우는 경우가 많습니다.
- 두 번째 앱은 다음 빈 포트를 자동으로 잡습니다.
- 정확한 접속 주소는 실행한 터미널에 표시되는 `Local:` 주소를 확인하면 됩니다.

보통은 아래처럼 보게 됩니다.

- Main site: `http://localhost:5173`
- Admin site: `http://localhost:5174` 또는 다음 빈 포트

---

## 9. 화면 확인 순서 추천

### 9.1 가장 먼저 확인할 것

브라우저에서 아래 주소를 열어보세요.

- Main site: `http://localhost:5173`
- Admin site: `http://localhost:5174` (또는 터미널에 표시된 주소)

### 9.2 main-site에서 볼 수 있는 화면

회원가입/로그인 없이도 일부 공개 화면은 확인할 수 있습니다.

- 공지사항 목록: `/notices`
- 공지사항 상세: `/notices/:noticeId`
- 공급자 탐색: `/suppliers`
- 공급자 상세: `/suppliers/:supplierId`

### 9.3 main-site에서 실제 흐름을 보려면

회원가입이 가능한 역할은 다음 두 가지입니다.

- 요청자
- 공급자

즉, main-site 주요 흐름은 아래처럼 확인하면 됩니다.

1. `/signup`에서 요청자 계정 생성
2. `/login`으로 로그인
3. 사업자 정보 입력
4. 공급자 탐색 / 의뢰 / 견적 / 메시지 화면 확인

또는

1. `/signup`에서 공급자 계정 생성
2. `/login`으로 로그인
3. 공급자 프로필 작성
4. 의뢰 피드 / 견적 / 메시지 화면 확인

### 9.4 admin-site는 어떻게 보나?

중요:

- 현재 repo 기준으로는 `회원가입 화면에서 관리자 계정을 만들 수 없습니다`.
- 그리고 seed SQL에도 기본 관리자 계정이 자동으로 들어가는 흔적은 확인되지 않았습니다.

즉,

- admin-site 로그인 화면 자체는 열 수 있지만
- 실제 검수/공지/통계 기능까지 보려면 별도의 관리자 계정이 DB에 있어야 합니다.

따라서 관리자 화면을 실제로 체험하려면 아래 둘 중 하나가 필요합니다.

1. 별도 관리자 계정을 직접 생성하는 SQL/스크립트를 추가
2. 기존 DB에 관리자를 수동으로 넣기

현재 문서 기준으로는 이 부분이 자동화되어 있지 않습니다.

---

## 10. 빠른 실행 요약

처음부터 한 번에 정리하면 아래 순서입니다.

### 터미널 A - DB

```bash
cd backend
docker volume create backend_mariadb-data >/dev/null
docker volume create backend_mongodb-data >/dev/null
docker compose -f compose.local.mariadb.yml up -d
docker compose -f compose.local.mongodb.yml up -d
./scripts/local/init-mariadb.sh
./scripts/local/seed-mariadb.sh
./scripts/local/init-mongodb.sh
./scripts/local/seed-mongodb.sh
```

### 터미널 B - API 서버

```bash
cd backend
./gradlew :api-server:bootRun --args='--spring.profiles.active=local'
```

### 터미널 C - Admin 서버

```bash
cd backend
./gradlew :admin-server:bootRun --args='--spring.profiles.active=local'
```

### 터미널 D - Main 프론트

```bash
cd frontend
corepack enable
yarn install
yarn dev:main-site
```

### 터미널 E - Admin 프론트

```bash
cd frontend
yarn dev:admin-site
```

---

## 11. 자주 막히는 지점

### 11.1 프론트는 떴는데 API 호출이 안 되는 경우

확인할 것:

- `http://localhost:8080/api/bootstrap/health`가 열리는지
- `http://localhost:8081/api/admin/bootstrap/health`가 열리는지
- `frontend/.env.local` 또는 기본값이 localhost를 바라보는지

### 11.2 backend 실행 시 DB 연결 오류가 나는 경우

확인할 것:

- MariaDB가 `13306` 포트에서 떠 있는지
- MongoDB가 `27018` 포트에서 떠 있는지
- `application-local.yml` 기준으로 local profile로 실행했는지

### 11.3 admin-site 화면을 실제로 못 들어가는 경우

이건 오류일 수도 있지만, 지금 구조상 `관리자 계정이 자동으로 준비되지 않았기 때문`일 가능성이 큽니다.

### 11.4 화면은 뜨는데 데이터가 너무 비어 있는 경우

확인할 것:

- `init-*`, `seed-*` 스크립트를 모두 실행했는지
- 회원가입 이후 실제로 필요한 데이터(요청자/공급자 프로필, 의뢰, 견적)를 직접 만들어야 하는 흐름인지

---

## 12. 끄는 방법

### frontend / backend 서버

- 실행 중인 터미널에서 `Ctrl + C`

### DB 컨테이너

```bash
cd backend
docker compose -f compose.local.mariadb.yml down
docker compose -f compose.local.mongodb.yml down
```

한쪽만 내려도 다른 쪽은 유지됩니다.

즉,

- MariaDB만 재시작 가능
- MongoDB만 재시작 가능
- 이전처럼 둘이 같이 내려가지 않음

---

## 13. 권장 확인 경로

처음 보는 사람에게 추천하는 확인 순서는 아래와 같습니다.

1. `swagger-ui.html`로 API 서버 살아있는지 확인
2. main-site 접속
3. 공지사항 / 공급자 탐색 화면 먼저 확인
4. 요청자 계정 회원가입
5. 사업자 정보 등록
6. 공급자 탐색 -> 공급자 상세 -> 의뢰 등록 흐름 확인
7. 공급자 계정 회원가입
8. 공급자 프로필 작성 -> 견적 제출 흐름 확인
9. 메시지 / 연락처 공유 흐름 확인
10. 관리자 계정이 준비되어 있다면 admin-site 검수/공지/통계 화면 확인

---

## 14. 한 줄 요약

이 프로젝트를 로컬에서 화면까지 보려면,

`DB 두 개를 띄우고 -> 스키마/시드 넣고 -> backend 두 개를 켜고 -> frontend 두 개를 켜면` 됩니다.

다만 관리자 화면은 기본 관리자 계정이 자동으로 준비되는 구조가 아니라는 점을 꼭 기억하면 됩니다.
