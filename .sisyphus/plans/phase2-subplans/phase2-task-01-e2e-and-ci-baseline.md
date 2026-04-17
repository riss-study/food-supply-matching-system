# Phase 2 Task 01 - E2E 및 CI 베이스라인

## 메인 Task 메타데이터

| 항목 | 값 |
|------|-----|
| **메인 Task ID** | P2-01 |
| **Wave** | 1 (Launch Readiness + Delivery Baseline) |
| **우선순위** | P0 |
| **기간** | 2-3일 |
| **스토리 포인트** | 8 |
| **작업자** | Full-stack + DevOps |
| **상태** | 🔴 Not Started |
| **Can Parallel** | NO (다른 P0 태스크 선결 조건) |
| **Blocks** | P2-02, P2-03, P2-04, P2-05, P2-06, P2-07 |
| **Blocked By** | 없음 |

---

## 개요

Phase 2의 모든 후속 task가 통과 여부를 자동으로 증명할 수 있도록, 핵심 end-to-end 흐름에 대한 browser-driven acceptance baseline과, backend/frontend green path를 매번 자동 실행하는 CI workflow를 구축한다.

`evidence` 규율은 유지하되, 사람 손으로 매번 명령을 돌리지 않아도 회귀 여부가 즉시 드러나는 상태를 만드는 것이 목표.

---

## 현재 진행 상태

- 메인 Task 상태: 🔴 Not Started
- 메모: Phase 1까지는 사람이 수동으로 `./gradlew build` / `yarn workspace ... build` / `... test`를 돌려 evidence를 수집했음. Phase 2부터는 자동화 필요.

| SubTask | 상태 | 메모 |
|---------|------|------|
| 1.1 | 🔴 Not Started | Playwright 또는 동등 browser harness 도입 결정 + 1개 smoke flow 작성 |
| 1.2 | 🔴 Not Started | 핵심 sign-up→login→browse→request 흐름의 acceptance skeleton |
| 1.3 | 🔴 Not Started | GitHub Actions backend workflow (`./gradlew build`) |
| 1.4 | 🔴 Not Started | GitHub Actions frontend workflow (4개 yarn build/test) |
| 1.5 | 🔴 Not Started | local infra (MariaDB/Mongo) compose 기동 step + seed 자동화 |
| 1.6 | 🔴 Not Started | PR 가드 룰 (필수 status check) 문서화 |

---

## SubTask 목록

### 🔴 SubTask 1.1: Browser harness 도입

**작업자:** Frontend
**예상 소요:** 0.5일

- [ ] Playwright (권장) 설치 및 `frontend/apps/main-site` 또는 별도 `frontend/e2e` 패키지에 셋업
- [ ] `yarn e2e` script 정의
- [ ] CI/local 양쪽에서 headless 실행 가능하도록 설정
- [ ] Vite dev server 자동 기동 후 종료 wrapper 작성

### 🔴 SubTask 1.2: 핵심 acceptance skeleton

**작업자:** Frontend
**예상 소요:** 1일

- [ ] Smoke flow #1: 공지 목록 → 상세 진입 (인증 불필요)
- [ ] Smoke flow #2: 공급자 탐색 → 상세 진입
- [ ] Smoke flow #3 (옵션): 요청자 회원가입 → 로그인 → 사업자 정보 → 의뢰 등록 (성공 경로)
- [ ] Seed 의존 fixture는 `backend/dev-seed/*`에 이미 있는 데이터를 사용

### 🔴 SubTask 1.3: Backend CI workflow

**작업자:** DevOps
**예상 소요:** 0.5일

- [ ] `.github/workflows/backend-ci.yml` 추가
- [ ] Java 21 (Temurin) setup
- [ ] MariaDB 11.4 + MongoDB 4.4 service container 또는 docker compose 기동
- [ ] `./gradlew build` 실행 (test 포함)
- [ ] `./gradlew :api-server:test :admin-server:test` 핵심 모듈 분리 실행 옵션

### 🔴 SubTask 1.4: Frontend CI workflow

**작업자:** DevOps
**예상 소요:** 0.5일

- [ ] `.github/workflows/frontend-ci.yml` 추가
- [ ] Node 20 + corepack + yarn install (cache)
- [ ] `yarn workspace @fsm/main-site test`, `yarn workspace @fsm/main-site build`
- [ ] `yarn workspace @fsm/admin-site test`, `yarn workspace @fsm/admin-site build`
- [ ] (선택) e2e job: backend service 기동 후 `yarn e2e` 실행

### 🔴 SubTask 1.5: Compose + seed 자동화

**작업자:** DevOps
**예상 소요:** 0.5일

- [ ] CI에서 `backend/scripts/local/init-mariadb.sh`, `seed-mariadb.sh`, `init-mongodb.sh`, `seed-mongodb.sh` 호출 가능하도록 권한/경로 검증
- [ ] Docker context 처리 (CI는 native docker, local은 colima 양쪽 호환)
- [ ] e2e job용 health-check (port 8080/8081 ready 대기)

### 🔴 SubTask 1.6: PR 가드 정책

**작업자:** DevOps
**예상 소요:** 0.25일

- [ ] `backend-ci`, `frontend-ci`를 main 브랜치 필수 status check로 등록 (문서화)
- [ ] CI 배지 README 추가
- [ ] e2e job은 1차에서는 advisory (실패해도 머지 가능)로 시작

---

## 인수 완료 조건 (Acceptance Criteria)

- [ ] PR 생성 시 backend/frontend CI workflow가 자동 실행되어 green/red 결과를 보여준다.
- [ ] `yarn e2e` 한 번으로 최소 2개의 핵심 smoke flow가 headless로 통과한다.
- [ ] CI 워크플로 한 번이 backend 빌드+테스트 + frontend 4개 워크스페이스 빌드+테스트를 커버한다.
- [ ] Evidence: `.sisyphus/evidence/phase2-task-01-e2e-and-ci-baseline.txt`에 CI run URL 또는 로컬 실행 출력 기록.

---

## 검증 명령

```bash
# Local 검증
cd frontend && yarn e2e
cd backend && ./gradlew build
cd frontend && yarn workspace @fsm/main-site build && yarn workspace @fsm/main-site test
cd frontend && yarn workspace @fsm/admin-site build && yarn workspace @fsm/admin-site test

# CI 검증
gh run list --workflow backend-ci.yml --limit 1
gh run list --workflow frontend-ci.yml --limit 1
```

---

## 의존성 매트릭스

| From | To | 관계 |
|------|-----|------|
| 1.5 Compose + seed | 1.3 Backend CI | CI에서 DB 기동 선결 |
| 1.5 Compose + seed | 1.2 E2E skeleton | seed 데이터 의존 |
| 1.3, 1.4 CI | 1.6 PR 가드 | 워크플로 존재 후 가드 정책화 |

---

## 리스크 및 완화 전략

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| Playwright + Vite + Spring 동시 기동의 flaky | High | health-check 대기 + retry, e2e job advisory로 시작 |
| CI에서 mongo 4.4 (amd64-only) image emulation 비용 | Medium | service container 또는 mongo:6 검토 |
| Gradle 데몬 cold start 시간 | Medium | `actions/cache` Gradle wrapper/dependencies 캐시 |
| MariaDB 헬스체크 race | Medium | compose healthcheck wait + retry loop |

---

## 산출물 (Artifacts)

### 코드/설정
- `.github/workflows/backend-ci.yml`
- `.github/workflows/frontend-ci.yml`
- `frontend/e2e/` 또는 `frontend/apps/main-site/e2e/` Playwright 설정
- `frontend/package.json` `e2e` script

### 문서/Evidence
- `.sisyphus/evidence/phase2-task-01-e2e-and-ci-baseline.txt`
- README CI 배지

---

## Commit

```
test(e2e): add Playwright smoke harness for public flows
ci: add backend and frontend build-test workflows
docs(phase2): mark task 01 complete with evidence
```

---

**이전 Task**: 없음 (Phase 2 첫 task)
**다음 Task**: [Task 02: Router and Doc Hygiene](./phase2-task-02-router-and-doc-hygiene.md)
