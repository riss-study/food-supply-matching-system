# Phase 3 Task A — CQRS 전면 롤백 (Mongo 제거)

## 메타데이터

| 항목 | 값 |
|------|-----|
| Task ID | P3-A |
| Wave | 1 (부채 청산) |
| 우선순위 | P0 |
| 기간 | 2~3 세션 예상 |
| 스토리 포인트 | 21 (대규모) |
| 상태 | 🟡 In Progress (Stage 1/5/7 완료, 2/3/4/6/8/9 남음) |
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

### 🔴 Stage 2 — Supplier 도메인

- `SupplierQueryService` 를 api-server 내부로 이전하거나 신규 작성. R2dbcEntityTemplate + Criteria 로 검색/필터/정렬/페이지네이션 구현
- SupplierDetail: supplier_profile + certification_record + attachment_metadata join + review aggregate (`@Query` 이미 있음)
- categories / regions aggregate: MariaDB `GROUP BY`
- `SupplierVisibilityProjectionService` 제거 (SupplierProfile 저장 후 더 이상 Mongo 업데이트 안 함)
- 회귀: /api/suppliers, /api/suppliers/{id}, /api/suppliers/categories, /api/suppliers/regions, /api/suppliers/{id}/reviews
- Review 쪽 recentReviews 는 이미 R2DBC 기반

Exit: 전 endpoint 동일 shape 응답 + type-check/test green + live smoke.

### 🔴 Stage 3 — Request 도메인

- `RequestQueryService` 를 R2DBC 기반으로. requester_request_summary / supplier_request_feed 의 join 내용을 SQL 로
- `RequestProjectionService` 제거
- quoteCount 필드: subquery 또는 별도 aggregate
- 회귀: /api/requests (list + detail), /api/supplier/requests

Exit: 전 endpoint 동일.

### 🔴 Stage 4 — Quote / Thread 도메인

- QuoteComparison: quote + request + supplier_profile join
- Thread summary/detail: message_thread + thread_message join + read_state + attachment_metadata
- 회귀: /api/requests/{id}/quotes, /api/supplier/quotes, /api/threads, /api/threads/{id}

Exit: 전 endpoint 동일.

### ✅ Stage 5 — User / BusinessProfile — **완료 `c00206c` (2026-04-21)**

- `UserMeService` 신규 (api-server/auth) — UserAccountRepository + BusinessProfileRepository 직접 조회
- `AuthApplicationService`: signup 시 projection 호출 제거, me() 는 UserMeService
- `RequesterApprovalGuard`: UserMeService 로 전환
- `RequesterBusinessProfileApplicationService`: BusinessProfileRepository 직접 사용, 두 projection 호출 제거
- 테스트 재배선 (`RequesterApprovalGuardTest`)
- 스모크: /api/me (buyer/admin/신규가입), /api/requester/business-profile — 전부 통과
- **잔존**: `RequesterBusinessProfileQueryService` 는 Request/Thread projection 에서 아직 사용 중 → Stage 3/4 에서 제거

### 🔴 Stage 6 — Admin Review / Stats

- AdminReviewQueue: verification_submission + supplier_profile join
- AdminReviewDetail: 위 + attachment_metadata + audit_log
- AdminStats: COUNT/GROUP BY 쿼리
- AdminReviewProjection 제거
- 회귀: /api/admin/reviews, /api/admin/reviews/{id}, /api/admin/stats/summary

Exit: 관리자 플로우 정상.

### ✅ Stage 7 — Notice — **완료 `cc83e69` (2026-04-21)**

- `PublicNoticeApplicationService`: noticeRepository 직접, excerpt 는 body.take(200) 실시간, view save 제거
- admin `NoticeApplicationService`: adminNoticeView/publicNoticeView save 전부 제거
- 테스트 재배선
- 스모크: /api/notices (published 3 seed + 신규), /api/admin/notices (archived 포함), create published → public list 즉시 반영 확인

### 🔴 Stage 8 — 물리 제거 + 인프라 정리

- `query-model-*` 7개 모듈 삭제 (`settings.gradle.kts`, 각 `build.gradle.kts` implementation 제거)
- `projection/` 모듈 삭제
- Mongo compose / init / seed 스크립트 삭제
- Gradle 의존성 제거 (`spring-boot-starter-data-mongodb-reactive`)
- `application-local.yml`, `application.yml` Mongo 설정 제거
- `backend-ci.yml` Mongo 서비스 제거
- LOCAL-RUN-GUIDE, memory 갱신

Exit: Mongo 완전 사라짐. 전체 build + test green.

### 🔴 Stage 9 — 지침서 §8 사례 10 추가

- 사례 10: "CQRS 롤백 — 과잉 설계의 흔적 청산"
- 증상 → 원인 (조회 복잡도 대비 도구 과잉) → 조치 (MariaDB 단일화) → 교훈 (YAGNI, 필요 시 적합 도구 별도 도입)

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
| 2 Supplier | 🔴 | — | — |
| 3 Request | 🔴 | — | — |
| 4 Quote/Thread | 🔴 | — | — |
| 5 User | ✅ | `c00206c` | 2026-04-21 |
| 6 Admin | 🔴 | — | — |
| 7 Notice | ✅ | `cc83e69` | 2026-04-21 |
| 8 정리 | 🔴 | — | — |
| 9 지침서 | 🔴 | — | — |

**현재 HEAD**: `cc83e69` + 본 문서 갱신 커밋. `origin/main` 과 동기.

**중간 dual-state 윈도우**: Mongo 는 여전히 기동 중. User/Notice 관련 뷰 (user_me_view, requester_business_profile_view, public_notice_view, admin_notice_view) 는 **더 이상 갱신되지 않음** → 향후 조회 시 stale 가능성 있지만 해당 도메인은 이미 R2DBC 로 전환되어 Mongo 를 읽지 않으므로 실 영향 없음. Supplier/Request/Quote/Thread/AdminReview 관련 뷰는 아직 쓰기·읽기 활성 (projection 아직 살아 있음).
