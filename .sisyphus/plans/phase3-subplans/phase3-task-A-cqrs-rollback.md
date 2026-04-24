# Phase 3 Task A — CQRS 전면 롤백 (Mongo 제거)

## 메타데이터

| 항목 | 값 |
|------|-----|
| Task ID | P3-A |
| Wave | 1 (부채 청산) |
| 우선순위 | P0 |
| 기간 | 2~3 세션 예상 |
| 스토리 포인트 | 21 (대규모) |
| 상태 | 🟢 **Done** (Stage 1~9 전부 완료, 2026-04-24) |
| Blocks | Phase 3 신규 feature 전부 (불일치 우려 제거 선결) |
| Blocked By | 없음 |

## 배경 / 결정 근거

2026-04-21 세션에서 아래 확인:

1. **현재 CQRS 효용 0** — 모든 조회가 단순 CRUD + 약간의 join + 집계 수준. MariaDB + 인덱스로 충분.
2. **부채만 발생 중** — projection 누락 / 서로 다른 소스 (예: 카테고리 SSOT 부재) / hidden stale rating / 시드 재적용 규약 등.
3. **미래 도입 가능성 낮음** — FSM 은 전형적 B2B 트랜잭션 서비스. 대용량 검색 / 피드 / 실시간 스트림 / 대시보드 analytics 없음.
4. **특정 기능 필요 시 적합 도구** — 검색 고도화 시 Elasticsearch, 분석 시 OLAP DB. Mongo 가 "만능 Query DB" 는 아님.

결정: **MongoDB 완전 제거**. MariaDB + R2DBC 단일 저장소로 전환. 필요한 기능은 직접 SQL (join / @Query aggregate).

## 범위 (인벤토리)

### 제거 대상 모듈 (7)

```
backend/query-model-user            (UserMeDocument, RequesterBusinessProfileDocument 등)
backend/query-model-supplier        (SupplierSearchViewDocument, SupplierDetailViewDocument)
backend/query-model-request         (RequesterRequestSummaryDocument, SupplierRequestFeedDocument)
backend/query-model-quote           (QuoteComparisonDocument)
backend/query-model-thread          (ThreadSummaryDocument, ThreadDetailDocument)
backend/query-model-admin-review    (AdminReviewQueueItemDocument, AdminReviewDetailDocument)
backend/query-model-admin-stats     (PublicNoticeViewDocument, AdminNoticeViewDocument)
```

### 제거 대상 projection (`backend/projection/`)

```
QuoteProjectionService
UserAuthProjectionService
RequesterBusinessProfileProjectionService
SupplierVisibilityProjectionService
ReviewProjectionService                 (rating 집계 → @Query 로 대체. 이미 2026-04-20 작업으로 기반 마련)
RequestProjectionService
ThreadProjectionService
```

### 재작성 대상 api-server / admin-server

| 파일 | 현재 | 전환 후 |
|------|------|---------|
| `api/auth/AuthApplicationService` | Mongo UserMe 조회 | UserAccountRepository 직접 |
| `api/supplier/SupplierDiscoveryController` | Mongo search_view / detail_view | supplier_profile + cert + attachment join |
| `api/supplier/SupplierProfileApplicationService` | Mongo 검증 후 projection | supplier_profile 직접 |
| `api/requester/RequesterBusinessProfileApplicationService` | Mongo view | business_profile 직접 |
| `api/requester/RequesterApprovalGuard` | Mongo view | business_profile 직접 |
| `api/request/RequestQueryService` | Mongo feed/summary | request_record 직접 |
| `api/quote/QuoteQueryService` | Mongo comparison | quote + request + supplier join |
| `api/thread/ThreadApplicationService` | Mongo thread_* | message_thread + thread_message |
| `api/notice/PublicNoticeApplicationService` | Mongo public_notice | notice 테이블 (`WHERE state='published'`) |
| `api/supplier/SupplierRequestService` | Mongo feed | request_record + targeted_supplier_link join |
| `admin/notice/NoticeApplicationService` | Mongo admin_notice | notice 직접 |
| `admin/review/AdminReviewApplicationService` | Mongo admin_review_* | verification_submission + supplier_profile join |
| `admin/review/AdminReviewProjectionService` | Mongo 업데이트 | 제거 |

### 제거 대상 인프라

- `backend/compose.local.mongodb.yml`
- `backend/docker/mongodb/init/*` (01-init-read-store.js, 02-seed-read-models.js)
- `backend/scripts/local/seed-mongodb.sh`
- `backend/scripts/local/seed-all.sh` 에서 mongo 호출 제거
- `gradle/libs.versions.toml` 의 `spring-boot-starter-data-mongodb-reactive` 참조
- `application-local.yml` 의 `spring.data.mongodb.uri`
- `application.yml` 의 `spring.data.mongodb.uri` env var
- `.github/workflows/backend-ci.yml` 의 mongo service container 와 init 단계

### 문서 업데이트

- `LOCAL-RUN-GUIDE.ko.md` — 시드/기동 절차에서 Mongo 제거
- `.sisyphus/drafts/api-spec.md` — API shape 변경 없음 (검증 후 확인)
- `docs/REFACTORING-GUIDELINES.ko.md` — §8 사례 10 추가
- `.sisyphus/open-items.md` — BE-5 (recomputeFor 튜닝) 해결 표시 (이미 전환됨)
- memory `09-infrastructure-ops.md` — Mongo 컨테이너 / 시드 절차 제거

## 단계별 계획

### ✅ Stage 1 — subplan 문서화 + 인벤토리 (본 문서) — **완료 `f214879` (2026-04-21)**

### ✅ Stage 2 — Supplier 도메인 — **완료 (2026-04-22)**

- 신규 `api-server/.../supplier/SupplierQueryService` (R2DBC)
  - list: `DatabaseClient` 로 동적 WHERE + `FIND_IN_SET` (CSV 카테고리) + logo subquery + `LEFT JOIN` 으로 review rating aggregate.
    Mongo 버전과 같이 `minCapacity/maxMoq` 는 VARCHAR 한계로 post-filter 유지.
  - detail: `supplierProfileRepository` + `certificationRecordRepository` + `attachmentMetadataRepository` + `ReviewRepository.aggregateRatingBySupplier`
  - categories: `supplierProfileRepository.findAll()` 후 CSV 분해 in-memory group by (MVP 규모)
  - regions: `GROUP BY region` SQL
- `SupplierDiscoveryController` 를 새 서비스로 교체 (동일 DTO shape 유지)
- `SupplierVisibilityProjectionService` 호출 제거
  - `SupplierProfileApplicationService.create/update/submitVerification` 3 곳
  - `admin-server`/`AdminReviewApplicationService.applyDecision` 1 곳
  - 서비스 클래스 자체 + query-model-supplier 모듈은 Stage 8 에서 물리 제거
- 구 Mongo `SupplierQueryService` 는 `@Service` 만 제거 (bean 충돌 방지, 클래스는 Stage 8 삭제 시 함께)
- **데이터 드리프트 발견 + 수정**: seed 에서 `exposure_state='listed'` 로 넣고 있었는데 코드 canonical 은 `'visible'` (admin approve 플로우). 구 Mongo 쿼리는 exposure 필터가 없어 가려졌던 버그. R2DBC 로 전환하면서 `WHERE ... exposure_state='visible'` 로 정상화. `02-mock-data.sql` + live DB 업데이트.
- 스키마 인덱스 추가 (`01-schema.sql`): `idx_attachment_owner`, `idx_cert_supplier`, `idx_supplier_state`. 실 DB 에도 `CREATE INDEX IF NOT EXISTS` 적용
- 회귀 smoke (8건): list (3 seed approved+visible), detail (seed_01 full shape), categories (4 categories), regions (3), reviews (empty), keyword/category/oem/odm filter, sort asc, pagination size=2, hidden supplier (seed_08) 직접 detail 접근, 404

Exit 충족: ./gradlew test 전 모듈 green + DTO shape 동일 + 5 endpoint + edge case live 통과.

### ✅ Stage 3 — Request 도메인 — **완료 (2026-04-22)**

- `api/request/RequestQueryService` R2DBC 재작성
  - list: `DatabaseClient` + COALESCE 서브쿼리로 quote_count 산출 (state != 'withdrawn')
  - detail: `RequestAccessGuard` 통과 후 `BusinessProfileRepository.findByUserAccountId` 로 requester 조회 (구 RequesterBusinessProfileQueryService 의존 제거). targeted 경우 `targetedSupplierLinkRepository` + `supplierProfileRepository` join
  - `RequesterRequestSummaryRepository` / `RequesterBusinessProfileQueryService` 의존 제거
- `api/request/SupplierRequestService` R2DBC 재작성
  - feed: `DatabaseClient` SQL — `WHERE state='open' AND (mode='public' OR EXISTS ... targeted_supplier_link)` + category 필터
  - 각 item 별 `BusinessProfileRepository` + `QuoteRepository.existsByRequestIdAndSupplierProfileIdAndStateIn` 로 requesterBusinessName + hasQuoted 해석 (구 Mongo 버전과 동일한 per-item 패턴 유지)
  - detail: 같은 requester/hasQuoted 해석 패턴
- `RequestProjectionService` 호출 제거 (6 곳):
  - `RequestApplicationService.create/update/publish/close/cancel` 5 곳
  - `QuoteApplicationService.select` 1 곳
- 스키마 인덱스 추가 (`01-schema.sql`): `idx_targeted_supplier`, `idx_request_state_mode`, `idx_request_requester`, `idx_quote_request`. live DB 에 `CREATE INDEX IF NOT EXISTS` 적용
- 테스트 재배선: `QuoteApplicationServiceTest` 에서 `requestProjectionService` mock 제거
- 드리프트 없음: request.mode (public/targeted) / state (draft/open/closed/cancelled) seed 와 코드 일치 확인

회귀 smoke (9건):
- /api/requests 로그인 buyer01 기준 5건 (seed + 세션에서 만든 draft 2건 포함), quoteCount 정확 (seed_01=2, seed_02=1)
- /api/requests?state=closed → 1 (seed_06)
- /api/requests/seed_01 owner 조회 → 전체 shape
- /api/requests/seed_04 비오너 → 403
- /api/requests/does_not_exist → 404
- /api/supplier/requests supplier1 (sprof_seed_01, targeted on seed_04) → 5 (4 public + seed_04)
- /api/supplier/requests supplier2 → 4 public only (targeted 불포함)
- /api/supplier/requests?category=snack → 1
- /api/supplier/requests/seed_01 detail → requesterBusinessName + hasQuoted OK

Exit 충족.

### ✅ Stage 4 — Quote / Thread 도메인 — **완료 (2026-04-22)**

- `api/quote/QuoteQueryService` R2DBC 재작성
  - listForRequest: DatabaseClient JOIN quote × supplier_profile + message_thread subquery(thread_id). 정렬: unitPrice/moq/leadTime/createdAt
  - listForSupplier: DatabaseClient JOIN quote × request_record + message_thread subquery
  - 구 `QuoteComparisonRepository` 의존 제거
- `api/thread/ThreadApplicationService` R2DBC 재작성
  - list: `messageThreadRepository.findAllByRequesterUserId`/`findAllBySupplierProfileId` + 각 item 별 request/requester/supplier 이름 + unreadCount + lastMessage 해석 (N+1 per thread, MVP 규모 적정)
  - detail: `loadAccessibleThread` (R2DBC) + 병렬 zip 으로 request title/requester name/supplier name/messages + `sharedContact` (mutually_approved 시만)
  - `unreadCountFor`: `readStateRepository.findByThreadIdAndUserId` + `messageRepository.countByThreadIdAndSenderUserIdNotAndCreatedAtAfter` 조합
  - 구 `threadQueryService` / `requesterBusinessProfileQueryService` / `threadProjectionService` 의존 전부 제거 (RequesterBusinessProfileQueryService 는 Stage 5 잔존분 마지막 사용처였음 → 이제 완전 dormant)
- Projection 호출 제거 (11 곳)
  - `QuoteApplicationService`: submit의 threadProjection+quoteProjection / update / withdraw / select (state + syncRequestQuotes) / decline — 5 call chains
  - `ThreadApplicationService`: createThread / sendMessage / markThreadAsRead / mutateContactShare — 4 call sites
  - `QuoteProjectionService`, `ThreadProjectionService`, `RequesterBusinessProfileQueryService`, `RequestProjectionService` 모두 dormant → Stage 8 에서 모듈과 함께 삭제
- 구 Mongo `ThreadQueryService` 에서 `@Service` 제거 (bean 충돌 방지)
- 스키마 인덱스 추가 (`01-schema.sql`): idx_quote_supplier, idx_thread_message_quote, idx_thread_message_thread(thread_id, created_at), idx_thread_requester, idx_thread_supplier. live DB 에 적용
- 테스트 재배선: `QuoteApplicationServiceTest` / `ThreadApplicationServiceTest` 생성자/mock 업데이트, 삭제된 projection verify 제거
- 드리프트 없음: quote state (submitted/selected/withdrawn/declined), contact_share_state (not_requested/one_side_approved/mutually_approved) seed 와 코드 일치

회귀 smoke (9건):
- `/api/requests/seed_01/quotes` buyer01 (owner) → 2 quotes, companyName, threadId, 가격정렬
- `/api/requests/seed_04/quotes` buyer01 (비owner) → 403
- `/api/supplier/quotes` supplier1 → 2 quotes, requestTitle/category, version
- `/api/threads` buyer01 → 5 threads (의 그 thread_0를 포함), lastMessage + unreadCount + updatedAt 내림차순
- `/api/threads` supplier1 → 1 thread
- `/api/threads/{id}` buyer owner detail → 전체 shape (otherParty, messages, meta)
- 숨김 상태 (not_requested) thread → sharedContact=null
- mutually_approved thread (seed_04) → sharedContact 노출 (requester contactName + supplier representativeName)
- `/api/threads/does_not_exist` → 404

Exit 충족.

### ✅ Stage 5 — User / BusinessProfile — **완료 `c00206c` (2026-04-21)**

- `UserMeService` 신규 (api-server/auth) — UserAccountRepository + BusinessProfileRepository 직접 조회
- `AuthApplicationService`: signup 시 projection 호출 제거, me() 는 UserMeService
- `RequesterApprovalGuard`: UserMeService 로 전환
- `RequesterBusinessProfileApplicationService`: BusinessProfileRepository 직접 사용, 두 projection 호출 제거
- 테스트 재배선 (`RequesterApprovalGuardTest`)
- 스모크: /api/me (buyer/admin/신규가입), /api/requester/business-profile — 전부 통과
- **잔존**: `RequesterBusinessProfileQueryService` 는 Request/Thread projection 에서 아직 사용 중 → Stage 3/4 에서 제거

### ✅ Stage 6 — Admin Review / Stats — **완료 (2026-04-24)**

- `admin-server/.../AdminReviewQueryService` (신규, R2DBC)
  - queue: `DatabaseClient` JOIN verification_submission × supplier_profile. state/date 필터, 정렬 (submittedAt / pendingDays / state / companyName). pendingDays 는 now - submitted_at 실시간 계산
  - detail: JOIN + certification_record 별도 쿼리로 `files` 구성
  - `AdminReviewQuery` / `AdminReviewQueueItemView` / `AdminReviewDetailView` / `AdminReviewFileView` 전부 admin-server 로컬 패키지 정의
- `AdminStatsApplicationService` 는 이미 R2DBC (supplier_profile/user_account/verification_submission/request_record 직접 사용) — 터치 불필요
- `AdminReviewApplicationService`: `AdminReviewProjectionService` 주입/호출 제거. 결정 (approve/hold/reject) 은 R2DBC 저장 + audit_log 쓰기만. query service 로 새 R2DBC 것 주입
- `api-server SupplierProfileApplicationService`: `projectAdminReviewViews()` + `adminReviewQueueViewRepository` / `adminReviewDetailViewRepository` 주입 전체 제거. Stage 2 에서 남겨둔 마지막 Mongo AdminReview 쓰기 경로 종결
- 구 Mongo `AdminReviewQueryService` 에서 `@Service` 제거 (bean 충돌 방지)
- `AdminReviewProjectionService` 는 클래스 정의만 남음 — 호출자 없음, Stage 8 에서 물리 제거
- 드리프트 없음: verification_submission.state (submitted/approved/hold/rejected) 코드와 seed 일치. under_review 는 코드에 있지만 실 흐름에서는 미사용 (무시 가능)

회귀 smoke (7건):
- `/api/admin/reviews` → 6 submissions (seed), pendingDays 정확 (7/11/19/59/69/79), state + verificationState 값
- `/api/admin/reviews?state=submitted` → 1 (vsub_seed_04)
- `/api/admin/reviews?sort=companyName&order=asc` → 가나다순
- `/api/admin/reviews/vsub_seed_04` detail → companyName, categories (CSV split), files(2건) + reviewHistory(0건)
- `/api/admin/reviews/does_not_exist` → 404
- `/api/admin/stats/summary` → users/suppliersByState/reviews(avgReviewDays=4.5)/requests 모두 정상

Exit 충족.

### ✅ Stage 7 — Notice — **완료 `cc83e69` (2026-04-21)**

- `PublicNoticeApplicationService`: noticeRepository 직접, excerpt 는 body.take(200) 실시간, view save 제거
- admin `NoticeApplicationService`: adminNoticeView/publicNoticeView save 전부 제거
- 테스트 재배선
- 스모크: /api/notices (published 3 seed + 신규), /api/admin/notices (archived 포함), create published → public list 즉시 반영 확인

### ✅ Stage 8 — 물리 제거 + 인프라 정리 — **완료 (2026-04-24)**

- 잔존 projection 호출 제거
  - api-server `ReviewApplicationService`: `reviewProjectionService.recomputeFor` 2곳 제거 + 주입 제거
  - admin-server `SupplierReviewModerationApplicationService`: 동일 호출 제거
  - admin-server `AdminReviewDtos`: 불필요한 `AdminReviewFileItem` import 정리
- 파일 삭제
  - `admin-server/.../review/AdminReviewProjectionService.kt`
  - 모듈 디렉토리 8개: `projection/`, `query-model-user`, `query-model-supplier`, `query-model-request`, `query-model-quote`, `query-model-thread`, `query-model-admin-review`, `query-model-admin-stats`
  - `compose.local.mongodb.yml`, `docker/mongodb/` 전체, `scripts/local/init-mongodb.sh`, `scripts/local/seed-mongodb.sh`
- Gradle 정리
  - `settings.gradle.kts`: 8개 모듈 include 제거
  - `api-server/build.gradle.kts` / `admin-server/build.gradle.kts`: 모든 `:query-model-*`, `:projection` 의존성 + `spring.boot.starter.data.mongodb.reactive` 제거
- 앱 부트스트랩 정리
  - `ApiServerApplication` / `AdminServerApplication`: `@EnableReactiveMongoRepositories` + 관련 import 제거
- 설정 정리
  - `application.yml` (api/admin): `spring.mongodb` 블록 제거
  - `application-local.yml` (api/admin): `spring.mongodb.uri` + `management.health.mongo` 제거
  - 테스트 `application.yml`: Mongo autoconfigure exclude + `management.health.mongo.enabled` 제거 (더 이상 classpath 에 없음)
- CI (`.github/workflows/backend-ci.yml`): `mongodb` service container + Mongo init/seed step 제거
- `scripts/local/seed-all.sh`: Mongo seed 단계 제거 (MariaDB 만 시드)
- `LOCAL-RUN-GUIDE.ko.md`: "DB 2개" → "DB 1개 (MariaDB 만)", MongoDB 관련 설명/섹션 전면 정리
- Mongo container `docker stop`/`docker rm` (live DB 제거)

검증:
- `./gradlew test` 전 모듈 green (Mongo 의존 없이)
- 양 서버 재기동: `/actuator/health` 에 `mongo` 컴포넌트 사라지고 `r2dbc` (MariaDB) 만 UP
- end-to-end sweep (19 endpoint):
  api: /api/me, /api/suppliers (list/detail/categories/regions/reviews),
       /api/requests (list/detail), /api/supplier/requests, 
       /api/requests/{id}/quotes, /api/supplier/quotes,
       /api/threads (list/detail), /api/notices
  admin: /api/admin/reviews (list/detail), /api/admin/stats/summary,
         /api/admin/notices, /api/admin/supplier-reviews
  → 모두 HTTP 200

Exit 충족. **MongoDB 완전 소거.**

### ✅ Stage 9 — 지침서 §8 사례 10 추가 — **완료 (2026-04-24)**

- `docs/REFACTORING-GUIDELINES.ko.md` §8 사례 10 추가: "CQRS 롤백 — 과잉 설계의 흔적 청산"
- 증상 (정합성 리스크 / 드리프트 / dual-write 부담) → 원인 (YAGNI 위반, "CQRS 중립" 착각, 적합 도구 오인식) → 조치 (8 stage 롤백 전 과정) → 효과 (2099 lines 삭제, 단일 저장소)
- 교훈 5건: YAGNI 는 아키텍처에도 / stage 단위 완결 / 단일화 시 드리프트 드러남 / 적합 도구는 필요할 때 별도 / DTO shape 보존은 rollback 안전선
- §10 Document History 에 v1.9 항목 추가

## 원칙

- **단계별 commit**. 각 stage 끝나면 app end-to-end 동작.
- **응답 shape 불변**. API 계약 유지. 기존 DTO 그대로 사용.
- **테스트 green 항상**. red 상태로 다음 stage 진입 금지.
- **Mongo 와 R2DBC 병행 없음**. 각 stage 에서 해당 projection 즉시 제거. 병행 유지는 정합성 risk 그대로.
- **시드 MariaDB 에 충분한 데이터 이미 있음** 확인. 기존 `02-mock-data.sql` 로 충분.

## 리스크

| 리스크 | 완화 |
|--------|------|
| 기존 응답 shape 에 의존한 FE 코드 | DTO 변환 시 필드명 보존. vitest 로 회귀 방지 |
| 성능 역행 (supplier 상세 join 4회) | 인덱스 확인. 필요 시 추가. N+1 발생 시 `findAllByIdIn` 패턴 |
| 트랜잭션 범위 변경 | @Transactional 전부 application layer (지침서 §3.7 그대로) |
| stage 중간 중단 시 broken state | 각 stage 자체 완결. 중단은 stage 경계에서만 |
| seed 재적용 필요 | Mongo 는 단지 사라지므로 MariaDB 시드만 유지. 재시드 간단 |

## Exit Criteria (Task A 전체)

- [ ] Mongo 컨테이너 없이 `./gradlew test` 전 모듈 green
- [ ] 기존 endpoint 전수 수동 검증 (URL + shape 동일)
- [ ] frontend type-check / test / build clean
- [ ] E2E Playwright 45+ 테스트 pass
- [ ] LOCAL-RUN-GUIDE 로 새로 기동 가능
- [ ] 지침서 §8 사례 10 추가

## 참고

- `memory/04-project-fsm-overview.md` 의 "CQRS 분리" 섹션 — 이후 갱신 대상
- `.sisyphus/session-handoff-2026-04-20-evening.md` §5 우선순위 리스트
- 이전 관련 사례: §8 사례 3 (Mongo seed 누락), 사례 4 (Supplier Mongo Criteria 이관)

## 진행도 로그

| Stage | 상태 | Commit | 날짜 |
|-------|------|--------|------|
| 1 subplan | ✅ | `f214879` | 2026-04-21 |
| 2 Supplier | ✅ | `1224130` | 2026-04-22 |
| 3 Request | ✅ | `955957f` | 2026-04-22 |
| 4 Quote/Thread | ✅ | `3902577` | 2026-04-22 |
| 5 User | ✅ | `c00206c` | 2026-04-21 |
| 6 Admin | ✅ | `47dfb57` | 2026-04-24 |
| 7 Notice | ✅ | `cc83e69` | 2026-04-21 |
| 8 정리 | ✅ | `da14966` | 2026-04-24 |
| 9 지침서 | ✅ | `239c193` | 2026-04-24 |

**현재 HEAD**: `239c193`. `origin/main` 과 동기화 전.

**Phase 3 Task A 종료**: MongoDB 완전 제거, 모든 read 경로 R2DBC 통합, 지침서 사례 추가. Phase 3 의 다음 task 는 별도 계획으로 진입.

**Note (Stage 2 드리프트 수정)**: `supplier_profile.exposure_state` 에 대해 seed 는 `'listed'`, 코드는 `'visible'` 로 분기하던 드리프트를 해소했음. MariaDB seed + live DB 모두 `'visible'` 로 정규화. 향후 코드 읽기/쓰기 양쪽 모두 `'visible'` 만 사용.
