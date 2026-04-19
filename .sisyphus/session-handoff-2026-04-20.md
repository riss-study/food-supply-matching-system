# Session Handoff — 2026-04-20

> 2026-04-19 세션에서 이어서 Phase 2 Task 02~05 마감 + 검증 중 발견된 CI red 복구까지 총 9 커밋.
> 이전 세션: `.sisyphus/session-handoff-2026-04-19.md`
> 미결 항목: `.sisyphus/open-items.md`
> Phase 2 subplan 상태: `.sisyphus/plans/phase2-subplans-index.ko.md`
> Task 03~07 재평가: `.sisyphus/plans/phase2-subplans-reassessment-2026-04-19.md`

---

## 0. 30초 요약

1. **Phase 2 Task 02 (PH-1)** — React Router v7 future flag opt-in (`BrowserRouter` + 전체 `MemoryRouter` 테스트) + frontend/main-site/admin-site README 3종 전면 재작성 + LOCAL-RUN-GUIDE cross-link.
2. **Phase 2 Task 05** — OpenAPI 글로벌 `bearerAuth` 버그 수정 (공개 endpoint 자물쇠 오표시) + 도메인 exception code 기반 에러 envelope 예제 7종 + AdminReview action 3종 annotation. api/admin version 0.1.0 → 0.2.0.
3. **Phase 2 Task 04 + BE-2** — `SupplierQueryService.listApproved` 를 `ReactiveMongoTemplate` + `Criteria` + `Sort` 로 이관. `supplier_search_view` 에 Mongo 인덱스 7종. main-site `SupplierSearchPage` 에 정렬 드롭다운 추가. 숫자 필드 한계는 BE-4 로 분리.
4. **Phase 2 Task 03 (축소판)** — audit write/read/UI 전부 이미 구현되어 있음을 재평가로 확인. end-to-end smoke (admin login → review hold → history 확인) 후 종결. 감사 검색 API 는 OP-4 로 분리.
5. **CI 복구** — 검증 중 frontend-ci / backend-ci 둘 다 실제로는 red 였음이 드러남 (Task 01 이후 지속). `packages/utils` env.d.ts 추가 + backend-ci 의 mariadb/mongosh 를 docker exec 방식으로 전환 + `gradle/actions/setup-gradle@v4` 로 bump. 둘 다 green.
6. **지침서 v1.7** — §8 사례 4~6 추가 (Mongo Criteria 이관 / OpenAPI global security / CI red under-the-radar).

**총 커밋**: 9 (PH-1 1 + Task 05 1 + Task 04 1 + Task 03 1 + CI 3 + open-items/guideline 2). 전부 `origin/main` push 완료.

**다음 세션 진입점**: 아래 §5 "다음 할 일 리스트" 순서대로.

---

## 1. 세션 타임라인

1. 사용자가 5개 항목 순차 실행 지시: session handoff, OP-1 Mongo 재시드, PH-1 (Task 02), OP-2 CI type-check, Task 03~07 재평가.
2. Task 02 (Router + README) — 양 앱 + 전 테스트 Memory Router 에 future flag, 3종 README 재작성. `022c887`.
3. Task 03~07 재평가 문서 작성. Task 05/04/03 만 당기고 06/07 은 보류로 결정. `cbdbaec`.
4. 재평가 순서에 따라 Task 05 (Swagger polish) → Task 04 (Supplier discovery) → Task 03 (Admin review) 순차 실행.
5. 검증 라운드에서 `yarn type-check` (root) 가 `packages/utils` 에서 TS2339 로 실패. gh run 확인 → frontend-ci 최근 3회 모두 red (Task 01 이후 지속). env.d.ts 추가. `462a43f`.
6. 이어서 backend-ci 도 red 확인. mariadb CLI 부재 → docker exec 전환 `5c3e03a`. Gradle 9.3.1 × setup-gradle@v3 cache-cleanup 호환 문제 → v4 bump `bc9f3d1`. 두 CI 모두 success.
7. 지침서 v1.7 사례 3건 추가 + session handoff 2026-04-20 작성.

---

## 2. 커밋 (origin/main, 본 세션 범위)

이전 세션 마지막: `39cbbe2 docs(phase2): update session handoff with backend refactor cycle`

이후 추가된 커밋 (시간순):

```
b92dc79  docs(ops): document Mongo seed re-run contract (OP-1)
022c887  fix(router): opt into react-router v7 future flags + rewrite frontend READMEs (PH-1)
cbdbaec  docs(phase2): reassess Task 03~07 against post-refactor state
90654fe  docs(api): polish OpenAPI — remove global security bug, add examples, error envelope (Task 05)
c66ac4a  perf(supplier-search): push sort/filter/pagination into Mongo with indexes (Task 04, BE-2)
9a306be  docs(phase2): Task 03 close — audit history already implemented, E2E verified (축소판)
462a43f  fix(utils): add Vite ImportMetaEnv type declaration (frontend-ci 복구)
5c3e03a  fix(ci): use docker exec into service containers for schema/seed (backend-ci)
bc9f3d1  fix(ci): bump gradle/actions/setup-gradle to v4 (Gradle 9 compat)
eaf4c9d  docs(ops): note CI recovery chain in open-items (OP-2 보정)
```

10 commits (OP-1 포함 — 이전 세션 말미에 이미 39cbbe2 이후 이지만 같은 흐름이라 여기 묶음).

---

## 3. Phase 2 subplan 최종 상태

| Task | 상태 | 비고 |
|------|------|------|
| 01 | 🟢 Done | E2E + CI baseline |
| 02 | 🟢 Done | Router + README (`022c887`) |
| 03 | 🟢 Done | Admin review history 축소판 (`9a306be`). OP-4 로 분리된 감사 검색 API 는 잔존 |
| 04 | 🟢 Done | Supplier sort/index + BE-2 흡수 (`c66ac4a`). BE-4 로 분리된 숫자 필드 정규화 잔존 |
| 05 | 🟢 Done | Swagger polish (`90654fe`). snapshot test (SubTask 5.6) 는 선택 skip |
| 06 | ⚪ Deferred | Reviews & Ratings — policy-blocked |
| 07 | ⚪ Deferred | Hot query hardening — measurement-blocked |

Wave 1~2 (Task 01~05) 전부 완료. Wave 3~4 (Task 06~07) 는 트리거 조건 충족 시 재개.

---

## 4. 인프라 / 환경 상태 (다른 PC 에서 이어받을 때)

### 로컬 체크리스트

```bash
# 1. Colima / Docker 확인
docker ps  # fsm-local-mariadb-mariadb-1, fsm-local-mongodb-mongodb-1 떠 있어야 함

# 2. Java 21 / Gradle 9.3.1
cd backend && ./gradlew --version  # JVM 21, Gradle 9.3.1

# 3. Node 20 (e2e 에 필요)
/opt/homebrew/opt/node@20/bin/node --version  # v20.x
# nvm default 는 18 이므로 e2e 시 PATH 조정 필요:
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

# 4. Yarn 4.5
corepack enable && corepack prepare yarn@4.5.0 --activate
```

### 기동 순서

```bash
# DB (한 번만)
cd backend
bash scripts/local/seed-mariadb.sh
bash scripts/local/seed-mongodb.sh   # ← init + seed 둘 다 실행. 인덱스 자동 생성.

# 백엔드 (각 터미널)
./gradlew :api-server:bootRun --args='--spring.profiles.active=local'   # 8080
./gradlew :admin-server:bootRun --args='--spring.profiles.active=local' # 8081

# 프론트 (각 터미널)
cd ../frontend
yarn install
yarn dev:main-site   # 5173
yarn dev:admin-site  # 5174
```

자세한 가이드: `LOCAL-RUN-GUIDE.ko.md` (시드 재시드 규약 §6 포함).

### 시드 계정 (모두 비밀번호 `Test1234!`)

- Admin: `admin@test.com`, `admin2@test.com`
- Buyer (requester): `buyer@test.com` ~ `buyer5@test.com`
- Supplier: `supplier@test.com` ~ `supplier8@test.com`

### CI 상태

- frontend-ci: green (`462a43f` 이후)
- backend-ci: green (`bc9f3d1` 이후)
- main branch protection 미설정 (OP-3)

---

## 5. 다음 할 일 리스트 (우선순위 순)

다른 PC 에서 이어받으면 이 순서를 기본 후보로 삼을 것. 각 항목은 **규모 / 블로커 / 착수 단위** 를 적어둠.

### 🥇 우선 - 다음 세션 첫 후보

#### Next-1. Phase 2 Task 06 — Reviews & Ratings Foundation (신규 기능)

- **규모**: XL (13 SP, 4-5일)
- **블로커**: 비즈니스 정책 선결 (자격 / 1:1 제약 / 모더레이션 / 프라이버시)
- **착수 전 결정 필요**:
  1. 리뷰 작성 자격: request 상태가 `closed` 이상 + quote 가 `accepted` 또는 contact-share 완료? (subplan §6.1 기본안)
  2. 1 (request, supplier) 쌍당 리뷰 1개 / 7일 내 1회 수정?
  3. 회사명 마스킹 정책: 이니셜 표시? 풀네임 노출?
  4. 금칙어 + 관리자 hide 필터링 범위
- **시작점**: `.sisyphus/plans/phase2-subplans/phase2-task-06-reviews-and-ratings-foundation.md` §6.1 읽고, 결정된 정책을 subplan 서문에 기록한 뒤 SubTask 6.2 (도메인 모델) 부터.
- **왜 다음**: Phase 2 에서 유일한 신규 product slice. Wave 1~2 마감한 지금이 자연스러운 진입 시점. 다른 모든 open-item 보다 비즈니스 임팩트 큼.

---

### 🥈 중간 - 여유 있을 때 소거

#### Next-2. BE-4 `supplier_search_view` 숫자 필드 정규화

- **규모**: S + S + S (projection 수정 / seed 재생산 / 인덱스)
- **블로커**: 없음. 기술적으로 바로 착수 가능
- **내용**: `monthlyCapacity` / `moq` 가 자유 텍스트 ("1,000kg") 이므로 Task 04 에서 `minCapacity` / `maxMoq` 는 페이지 내 post-filter 로만 동작. projection 시점에 숫자 컬럼 (`monthlyCapacityNumeric: Int?`, `moqNumeric: Int?`) 추가 → DB-side 필터링 가능.
- **착수 전 결정**: 파싱 규칙 ("1,000kg" → 1000, "무제한" → null?). 단위 변환 (t/kg/L) 처리 방침.
- **시작점**: `backend/projection/.../SupplierVisibilityProjectionService` 의 `SupplierSearchViewDocument` 생성 경로 + `SupplierQueryService.buildSort` / `listApproved` 의 post-filter 주석.
- **왜 지금 아닌가**: 현 데이터 볼륨 (supplier 3~8건) 에서 UX 문제 없음. 실제 요구 (50건+ 또는 "페이지 내에 걸리는 항목만" 혼란) 가 나올 때 착수.

#### Next-3. BE-1 Application layer `ResponseStatusException` 일관화

- **규모**: M (api-server/admin-server 여러 파일)
- **블로커**: 없음
- **내용**: `command-domain-*` 은 `6b536a5` 에서 도메인 sealed exception 으로 전환 완료. 그러나 `api-server`/`admin-server` application layer (RequestAccessGuard, PublicNoticeApplicationService, NoticeApplicationService, LocalFileStorageService 등) 는 여전히 `ResponseStatusException` 사용.
- **왜 지금 안 하는가**: application layer 는 HTTP 경계에 가까워 지침서 §3.4 위반 아님. 장점 (에러 code 일관성) 대비 비용 (파일/테스트 다수 수정) 이 큼.
- **착수 조건**: 프론트/외부 consumer 가 도메인 code 기반 에러 분기를 실제로 쓸 때.

#### Next-4. BE-3 Domain unit test 커버리지 확장 (Boy Scout)

- **규모**: S (feature 당)
- **블로커**: 없음
- **내용**: `command-domain-request`, `command-domain-notice` 에 happy-path 테스트 자리 있음. edge case (복잡한 상태 전이 / concurrency / 잘못된 데이터 조합) 부족.
- **전략**: 전수 보강 말고 **Boy Scout** — 도메인 버그 발견 시 회귀 테스트로 추가. 또는 Task 06 착수 시 `command-domain-review` 신규 모듈 테스트부터 충실히.

#### Next-5. FE-1 / FE-2 AsyncBoundary 확장 (Boy Scout)

- **규모**: 페이지당 S
- **블로커**: 없음
- **내용**:
  - FE-1: admin-site 에 `AsyncBoundary` 미적용. main-site 에서 가져올지 `packages/ui` 로 승격 후 공유할지 결정 필요.
  - FE-2: main-site 도 `ThreadListPage`, `ThreadDetailPage`, `SupplierQuoteListPage`, `SupplierRequestFeedPage`, `NoticeListPage`, `SupplierSearchPage`, `QuoteComparisonPage` 는 아직 `if (isLoading) ... if (error) ...` 조기 반환.
- **전략**: Task 06 에서 새 페이지 만들 때 AsyncBoundary 바로 적용. 기존 페이지는 터치할 때 같이 정리.

---

### 🥉 나중 - 트리거 조건 대기

#### Later-1. Phase 2 Task 07 — Hot Query Hardening

- **트리거**: `/api/suppliers` p95 > 300ms, 또는 supplier view 1000+ 건, 또는 admin stats 분 단위 timeout
- **지금 안 하는 이유**: 측정 선행 원칙. 현 데이터 볼륨에선 hot path 없음.

#### Later-2. OP-3 GitHub branch protection

- **트리거**: GitHub Pro 결제 또는 repo 공개 전환
- **지금 안 하는 이유**: 무료 플랜 + private repo 에선 API 403.

#### Later-3. OP-4 관리자 감사 검색 API

- **트리거**: cross-target audit 조회 요구 발생 (규제/감사)
- **지금 안 하는 이유**: 검수 상세 UI 에서 타임라인 노출로 대부분 요구 충족.

#### Later-4. FE-3 `packages/ui` 승격

- **트리거**: 공유 React 컴포넌트 5개 이상 또는 admin-site/main-site 중복 패턴 누적
- **지금 안 하는 이유**: React peer dep 추가 비용 대비 공유 가치 낮음.

---

## 6. 주의사항 / 함정

1. **yarn type-check 는 root 에서 반드시 통과해야 한다** — 개별 앱만 체크하면 `packages/*` 에서 실패가 안 보임. `.github/workflows/frontend-ci.yml` 의 `yarn type-check` step 결과를 PR 머지 전 확인.
2. **Mongo seed 수정 시 재시드 필수** — `backend/docker/mongodb/init/02-seed-read-models.js` 또는 `01-init-read-store.js` 를 바꾸면 `bash scripts/local/seed-mongodb.sh` 실행. Docker volume 이 persisted 라 자동 재실행 없음. 지침서 §8 사례 3 참고.
3. **backend-ci 는 docker exec 기반** — mariadb/mongosh 를 runner 에 설치하지 않고 service container 에 `docker exec -i` 로 SQL/JS 주입. service container 이름은 `docker ps --filter "ancestor=..." --format "{{.ID}}"` 로 찾음.
4. **Node 20 필요 (e2e)** — nvm default 18 이면 Playwright `requires Node.js 18.19+` 에러. `export PATH="/opt/homebrew/opt/node@20/bin:$PATH"` 선행.
5. **도메인 exception 추가 시 양쪽 다 수정** — 새 도메인 rule 만들 때 (1) sealed exception 파일 `shared-core/error/*.kt` (2) `GlobalApiExceptionHandler` 매핑 (3) OpenAPI `ApiErrorResponse` examples (필요 시).
6. **Task 06 착수 전 정책 결정** — 위 Next-1 의 4가지 질문을 개발자 혼자 정하지 말고 비즈니스와 합의. 지금 코드만 봐도 알 수 없음.

---

## 7. 열린 대화 / 판단 남은 지점

- **Task 06 (Reviews & Ratings) 비즈니스 정책** — 위 §5 Next-1 의 4가지.
- **BE-1 이관 타이밍** — 프론트에서 `ApiErrorResponse.code` 분기를 실제로 쓰기 시작하면 그때 일괄.
- **FE-3 `packages/ui` 승격** — Task 06 의 리뷰 UI 에서 재사용성 높은 컴포넌트가 나오면 그때 기준선.
- **지침서 §8 사례 누적 구조** — v1.7 기준 6사례. 8~10사례 넘어가면 사례별로 파일을 쪼갤지 요약 + 링크로 갈지 결정 (DOC-1 open-item).

---

## 8. 참고 문서 인덱스

- `.sisyphus/session-handoff-2026-04-19.md` — 직전 세션 (프론트+백엔드 리팩토링 대장정)
- `.sisyphus/session-handoff-2026-04-17.md` — 그 이전 (Phase 2 Task 01 시작)
- `.sisyphus/open-items.md` — 10 항목 미결 목록 (BE / FE / OP / PH / DOC 분류)
- `.sisyphus/plans/phase2-subplans-index.ko.md` — Phase 2 전체 진행 상태
- `.sisyphus/plans/phase2-subplans-reassessment-2026-04-19.md` — Task 03~07 재평가
- `.sisyphus/plans/phase2-subplans/phase2-task-0{1..7}-*.md` — 각 task subplan
- `.sisyphus/evidence/phase2-task-0{2..5}-*.{txt,json}` — 본 세션 evidence
- `docs/REFACTORING-GUIDELINES.ko.md` — 리팩토링 원칙 + §8 사례 6건 (v1.7)
- `docs/backend-refactor-2026-04-19.md` — 백엔드 리팩토링 상세 (2026-04-19 세션)
- `LOCAL-RUN-GUIDE.ko.md` — 로컬 기동 + 재시드 규약 (§6)
- `frontend/README.md` / `frontend/apps/*/README.md` — 프론트 워크스페이스 가이드
- `api-spec.md` — API 계약 SSOT

---

## 9. 현재 HEAD

```
eaf4c9d docs(ops): note CI recovery chain in open-items (OP-2 보정)
```

`origin/main` 과 동기화. 작업 트리 clean.
