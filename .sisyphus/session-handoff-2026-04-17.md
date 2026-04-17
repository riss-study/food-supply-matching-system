# Session Handoff — 2026-04-17

> 다음 Claude 세션이 이 문서만 읽고도 컨텍스트를 100% 복원할 수 있도록 작성.

---

## 0. 30초 요약

이번 세션에서 한 일은 크게 4가지:

1. **로컬 개발 인프라 구성** — Docker(Colima), Java 21, Node 20을 새로 설치하고 MariaDB/MongoDB 컨테이너 + backend 2개 + frontend 2개를 띄움.
2. **Phase 2 실행계획(Wave 0)** — `.sisyphus/plans/phase2-subplans/` 디렉토리에 7개 task subplan 작성.
3. **Phase 2 Task 01 — E2E + CI baseline** — Playwright + GitHub Actions 워크플로 추가, 로컬에서 그린.
4. **빡센 검증 라운드** — API 명세 audit + e2e 45개로 확장 + 5회 연속 안정성 검증 (총 369회 실행, flaky 0).

**다음 액션 후보 (우선순위 순):**

- (A) Phase 2 Task 01 closure — 커밋, 푸시, GitHub branch protection 룰 설정
- (B) Phase 2 Task 02 — Router future-flag warning 청소 + frontend README 보강
- (C) Phase 2 Task 03~07 중 하나 선택해 착수

사용자 마지막 발화: **"지금까지 한내용 인수인계 문서 작성해줘. 나 클로드 껐다킬거야."** — 즉 이 문서 작성 후 사용자는 Claude를 재시작합니다.

---

## 1. 사용자 / 환경

- macOS Darwin 23.4.0 (arm64, Apple Silicon)
- 작업 디렉토리: `/Users/kyounghwanlee/Desktop/riss/food-supply-matching-system`
- Git branch: `main`, user `riss-study`
- 사용자 이메일: glosoft2026@gmail.com
- 사용자 스타일: 한국어, 매우 terse, 거의 모든 답변을 "ㄱㄱ" / "해" 같은 짧은 신호로 줌. 길게 설명하면 싫어함. 작업이 길어져도 중간에 끊지 않고 끝까지 진행하길 원함 (`해 멈추지마` 발화).

---

## 2. 새로 설치한 도구 (이전 세션에는 없었음)

| 도구 | 위치 / 명령 | 비고 |
|---|---|---|
| Colima + docker CLI + docker-compose | `/opt/homebrew/bin/colima`, `/opt/homebrew/bin/docker` | brew로 설치. 첫 기동: `colima start --cpu 4 --memory 6 --disk 30` |
| Temurin JDK 21 | `~/Library/Java/JavaVirtualMachines/temurin-21.jdk/` | brew cask가 sudo 요구해 실패 → tarball 직접 다운로드해 사용자 디렉토리에 설치 |
| Node 20.20.2 (brew node@20) | `/opt/homebrew/opt/node@20/bin/node` | 시스템 기본 node는 18.16 (Playwright 1.59+ 요구사항 18.19 미달) — e2e 실행 시 PATH 앞에 끼워야 함 |
| Playwright + chromium | `frontend/apps/main-site/node_modules/@playwright/test`, headless shell at `~/Library/Caches/ms-playwright/` | `--with-deps` 없이 chromium만 설치 |

**환경 변수 정석:**
```bash
export JAVA_HOME=/Users/kyounghwanlee/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home
export PATH="$JAVA_HOME/bin:/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:$PATH"
```

**도커 compose plugin 설정:** `~/.docker/config.json`에 `"cliPluginsExtraDirs": ["/opt/homebrew/lib/docker/cli-plugins"]` 등록 완료. 다음 세션도 그대로 사용 가능.

---

## 3. 현재 인프라 상태 (사용자가 Claude 끄기 직전)

- **Colima VM: 실행 중** (`colima status`로 확인)
- **MariaDB 컨테이너: 실행 중** (`fsm-local-mariadb-mariadb-1`, 포트 13306)
- **MongoDB 컨테이너: 실행 중** (`fsm-local-mongodb-mongodb-1`, 포트 27018)
- **api-server: 실행 중** (백그라운드 task ID `b22byjiru`, 로그 `/tmp/fsm-logs/api-server.log`, 포트 8080)
- **admin-server: 실행 중** (백그라운드 task ID `bx5l9l47p`, 로그 `/tmp/fsm-logs/admin-server.log`, 포트 8081)
- Vite dev server들은 Playwright가 자동 기동/종료 (영구 실행 아님)

> **주의:** Claude 재시작 시 백그라운드 task들은 모두 종료됨. 다음 세션에서 확인하려면 `lsof -nP -iTCP:8080 -iTCP:8081 -sTCP:LISTEN` 후 죽어있으면 다시 띄워야 함. DB 컨테이너는 OS 재시작 전까지 살아있음. Colima는 `colima status`.

**전부 새로 띄우는 명령** (LOCAL-RUN-GUIDE.ko.md 기준):
```bash
# 0. (필요 시) Colima 시작
/opt/homebrew/opt/colima/bin/colima start

# 1. DB
cd /Users/kyounghwanlee/Desktop/riss/food-supply-matching-system/backend
docker compose -f compose.local.mariadb.yml up -d
docker compose -f compose.local.mongodb.yml up -d

# 2. (최초 한 번 이미 완료) 스키마 + seed
./scripts/local/init-mariadb.sh && ./scripts/local/seed-mariadb.sh
./scripts/local/init-mongodb.sh && ./scripts/local/seed-mongodb.sh

# 3. backend 두 개 (각각 다른 터미널)
JAVA_HOME=~/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home \
  ./gradlew :api-server:bootRun --args='--spring.profiles.active=local'
JAVA_HOME=~/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home \
  ./gradlew :admin-server:bootRun --args='--spring.profiles.active=local'

# 4. frontend (필요 시)
cd ../frontend
yarn dev:main-site   # 5173
yarn dev:admin-site  # 5174
```

**전부 끄는 명령:**
```bash
# 백엔드는 프로세스 kill (Claude 백그라운드 task로 띄웠다면 task 종료 후에도 자식 프로세스가 남을 수 있음)
pkill -f "ApiServerApplicationKt|AdminServerApplicationKt|GradleDaemon|gradle.*bootRun"
pkill -f "vite|yarn dev"

# DB 컨테이너
cd backend
docker compose -f compose.local.mariadb.yml down
docker compose -f compose.local.mongodb.yml down

# Colima VM
/opt/homebrew/opt/colima/bin/colima stop
```

---

## 4. 시드 데이터 / 테스트 계정

**모든 시드 계정 비밀번호:** `Test1234!` (BCrypt hash는 `02-mock-data.sql:39`)

| 역할 | 이메일 |
|---|---|
| ADMIN | `admin@test.com`, `admin2@test.com` |
| REQUESTER | `buyer@test.com`, `buyer2@test.com` ~ `buyer5@test.com` |
| SUPPLIER | `supplier@test.com`, `supplier2@test.com` ~ `supplier8@test.com` |

DB row 카운트 (현재 시드 기준):
- user_account: 15, business_profile: 다수, supplier_profile: 8
- notice: 5, request_record: 8, quote: 6
- Mongo `fsm_read` view 9개 (notices, supplier_search_view, supplier_detail_view, requester_business_profile_view, supplier_request_feed_view, requester_request_summary_view, admin_review_queue_view, admin_review_detail_view, admin_notice_view)

DB 볼륨은 external named volume (`backend_mariadb-data`, `backend_mongodb-data`) — `compose down` 으로 컨테이너만 지워도 데이터는 보존됨.

---

## 5. 작성/수정된 파일 (커밋되지 않은 변경)

> **모두 커밋 안 됨.** 사용자가 commit/push 지시한 적 없음. 다음 세션이 커밋할 때 어떤 그룹으로 묶을지 판단 필요.

### A. Phase 2 Wave 0 — 실행계획 (7개)

```
.sisyphus/plans/phase2-subplans/phase2-task-01-e2e-and-ci-baseline.md
.sisyphus/plans/phase2-subplans/phase2-task-02-router-and-doc-hygiene.md
.sisyphus/plans/phase2-subplans/phase2-task-03-admin-review-history-and-audit.md
.sisyphus/plans/phase2-subplans/phase2-task-04-supplier-discovery-sort-and-index.md
.sisyphus/plans/phase2-subplans/phase2-task-05-swagger-and-contract-polish.md
.sisyphus/plans/phase2-subplans/phase2-task-06-reviews-and-ratings-foundation.md
.sisyphus/plans/phase2-subplans/phase2-task-07-hot-query-hardening.md
```

`.sisyphus/plans/phase2-subplans-index.{md,ko.md}`는 이미 이 경로를 가리키고 있어 수정 불필요.

### B. Phase 2 Task 01 — CI workflows + Playwright

```
.github/workflows/backend-ci.yml          (신규)
.github/workflows/frontend-ci.yml         (신규)

frontend/package.json                     (e2e, e2e:install 스크립트 추가)
frontend/apps/main-site/package.json      (@playwright/test devDep + e2e 스크립트)
frontend/apps/main-site/playwright.config.ts (신규, 두 프로젝트 main-site/admin-site, 두 webServer)
frontend/apps/main-site/vitest.config.ts  (test.exclude에 e2e/** 추가)

frontend/apps/main-site/e2e/public-smoke.spec.ts       (신규, 2 tests)
frontend/apps/main-site/e2e/auth-smoke.spec.ts         (신규, 4 tests)
frontend/apps/main-site/e2e/nav-smoke.spec.ts          (신규, 3 tests)
frontend/apps/main-site/e2e/authed-nav-smoke.spec.ts   (신규, 5 tests)
frontend/apps/main-site/e2e/admin-smoke.spec.ts        (신규, 4 tests, admin-site project)
frontend/apps/main-site/e2e/ux-checks.spec.ts          (신규, 16 tests)
frontend/apps/main-site/e2e/ux-authed-audit.spec.ts    (신규, 11 tests)
```

- 총 e2e: 7 spec 파일, **45개 테스트** (main-site 41 + admin-site 4)
- 5회 연속 실행 모두 그린, flaky 0
- Vitest는 e2e 디렉토리 제외 설정됨 — 단위 테스트는 영향 없음

### C. API 명세 보강

```
.sisyphus/drafts/api-spec.md  (v1.4, 7개 endpoint 신규 + logoUrl 필드 명시)
```

문서가 누락한 endpoint:
- `GET /api/suppliers/categories`, `/api/suppliers/regions`
- `POST /api/requests/{id}/publish`
- `GET /api/supplier/requests`, `/api/supplier/requests/{id}`
- `GET /api/supplier/quotes`
- `POST /api/attachments` (신규 섹션 3.10)

### D. Evidence 파일 (2건)

```
.sisyphus/evidence/phase2-task-01-e2e-and-ci-baseline.txt
.sisyphus/evidence/phase2-rigorous-verification-2026-04-17.txt
```

---

## 6. Phase 2 전체 로드맵 위치

| Wave | Task | 상태 |
|---|---|---|
| 0 | Subplan 작성 | ✅ 완료 (이번 세션) |
| 1 | **Task 01** E2E + CI baseline | 🟡 로컬 그린, 커밋/푸시/브랜치 보호 미완 |
| 1 | Task 02 Router & doc hygiene | 🔴 미시작 |
| 2 | Task 03 Admin review history & audit | 🔴 미시작 |
| 2 | Task 04 Supplier discovery sort & index | 🔴 미시작 |
| 2 | Task 05 Swagger & contract polish | 🔴 미시작 (다만 명세 doc은 부분 보강됨) |
| 3 | Task 06 Reviews & ratings foundation | 🔴 미시작 |
| 4 | Task 07 Hot query hardening | 🔴 미시작 |

세부 의존성: Task 01이 모든 후속의 prerequisite (CI/e2e baseline). Wave 2 (03/04/05)는 병렬 가능. Task 07은 Wave 3 결과 데이터 기반.

---

## 7. 검증된 사실 (다음 세션이 그대로 신뢰해도 되는 것)

1. `yarn e2e` (frontend 디렉토리에서, **Node 20 PATH 필요**) → 45 tests 모두 통과, ~14초.
2. Backend `./gradlew build`는 이번 세션에서 명시적으로 실행 안 함. 단 `:api-server:bootRun`, `:admin-server:bootRun`은 정상 부팅 (4초대).
3. OpenAPI dump 정상:
   - `curl -s http://localhost:8080/v3/api-docs | jq '.paths | length'` → 41
   - `curl -s http://localhost:8081/v3/api-docs | jq '.paths | length'` → 14 (둘 다 swagger-ui.html, bootstrap/health 포함)
4. `/api/notices`, `/api/suppliers` 둘 다 시드 데이터 정상 응답.
5. 인증 로그인 흐름 (buyer/supplier/admin 각 1회 이상) 정상.
6. 401 시 axios interceptor가 `window.location.href = "/login"` 으로 강제 리로드 — 의도된 동작.

---

## 8. 알려진 미해결 이슈 / 의도적 보류

- **React Router future-flag warning** 잔존 → Phase 2 Task 02에서 청소 예정.
- Mongo 4.4 (local compose) vs Mongo 6 (CI workflow) 버전 불일치. 의도적 — Mongo 4.4는 amd64 only, GHA에서 emulation 비용 회피. Phase 2 Task 04 또는 07에서 재검토.
- e2e job은 CI workflow에 포함 안 됨 (advisory). PR 가드 정책은 미설정 (브랜치 보호는 GitHub UI 작업 필요).
- 멀티 액터 비즈니스 흐름 (signup → request → quote → thread → contact share) e2e는 미작성. 현재는 각 페이지 reachability와 인증 가드까지만.
- admin-site UI는 로그인까지만 e2e 커버. 검수 큐 상호작용, 공지 발행 흐름 등은 추후.

---

## 9. 사용자 발화 히스토리 (시간순 요약)

1. "로컬에 도커 띄워서 해당 프로젝트 다 띄워봐. 필요 인프라 설치필요하면 도커로 설치하고. 목업 데이터도 기존에 있는 sql 파일을 이용해서 넣고."
2. "해 멈추지마 FE BE 인프라 정상 동작전까지" (Docker/Java 설치 권한 확인 후)
3. "백엔드 부팅 상태 확인 및 정상 동작 검증까지 진행"
4. (ultrareview 호출, clean 결과)
5. "일단 프론트 백엔드 다 꺼" → "내려" (DB까지 종료)
6. "이제 다음 단계 진행하자" → "문서 찾아봐 지금까지 한 작업과 그 다음 작업들이 있을거 아냐"
7. "ㅓ실행계획없으면 실행계획부터 세워야지" → Wave 0 subplan 7개 작성
8. "ㄱㄱ" → Task 01 착수
9. (Task 01 로컬 그린 보고 후) "이제 전체적으로 API 명세서에 업데이트 안된게 있으면 업데이트하고, 엔드투엔드 테스트를 하면서 전체적으로 다시 검증 빡세게 해봐. 여러번 검증해. 사용자 입장에서 UX 적인 부분도 체크하고. 지금 하던 작업은 이거 이후에 마저 하자"
10. (검증 라운드 완료 후) **"지금까지 한내용 인수인계 문서 작성해줘. 나 클로드 껐다킬거야."** ← 현재

---

## 10. 다음 세션 시작 시 권장 행동

1. 이 문서를 읽는다 (또는 `MEMORY.md` 자동 로드 + 이 파일 fetch).
2. `git status`로 위 5번에서 정리한 변경 파일들이 모두 그대로 있는지 확인.
3. 사용자에게 다음 중 무엇을 할지 묻는다:
   - (A) Task 01 closure: 커밋 + push + branch protection
   - (B) Task 02: router warning + README 정리
   - (C) 다른 task
4. 인프라가 죽어있다면 5번의 "전부 새로 띄우는 명령" 그대로 실행.

**커밋 그룹 제안 (사용자 승인 필요):**
- commit 1: `docs(phase2): freeze roadmap, assumptions, and wave priorities` — 7개 subplan
- commit 2: `test(e2e): add Playwright smoke harness for public flows` — public-smoke + nav-smoke + auth-smoke + authed-nav-smoke + admin-smoke + ux-checks + ux-authed-audit + playwright config + vitest exclude + package.json scripts
- commit 3: `ci: add backend and frontend build-test workflows` — .github/workflows/*
- commit 4: `docs(api): close 7 endpoint gaps and document logoUrl` — api-spec.md v1.4
- commit 5: `docs(phase2): record task 01 + verification evidence` — evidence 2개 + 이 handoff 문서

(Phase 2 plan §14 "Atomic Commit Strategy" 참고.)

---

## 11. 참고 파일 빠른 링크

- Phase 2 실행계획: `.sisyphus/plans/phase2-execution-plan.ko.md` (한글), `.md` (영문)
- Phase 2 subplan index: `.sisyphus/plans/phase2-subplans-index.ko.md`
- 로컬 실행 가이드: `LOCAL-RUN-GUIDE.ko.md` (사용자가 만든 한글 가이드)
- API 명세: `.sisyphus/drafts/api-spec.md` (v1.4)
- Phase 1 종료 보고서: `.sisyphus/phase1-completion-report.md`, `.sisyphus/phase1-handoff.md`
- 이번 검증 라운드 evidence: `.sisyphus/evidence/phase2-rigorous-verification-2026-04-17.txt`
