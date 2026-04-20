# Phase 2 Task 06 - 리뷰/평점 기반 신뢰 레이어

## 메인 Task 메타데이터

| 항목 | 값 |
|------|-----|
| **메인 Task ID** | P2-06 |
| **Wave** | 3 (Controlled Product Extension) |
| **우선순위** | P2 |
| **기간** | 4-5일 |
| **스토리 포인트** | 13 |
| **작업자** | Full-stack |
| **상태** | 🟢 Done (2026-04-20) |
| **Can Parallel** | NO (단독 vertical slice) |
| **Blocks** | 없음 |
| **Blocked By** | P2-01 (CI/e2e baseline), P2-04 (탐색 응답에 평균 평점 노출 필요 시) |

---

## 개요

Phase 2의 유일한 product-extension slice. **완료된 request/quote 관계**에 한해 요청자가 공급자에 대한 평점·짧은 리뷰를 남길 수 있게 하고, 공급자 탐색·상세에서 평균 평점·리뷰 수를 노출한다.

목적은 매칭 루프의 **신뢰(trust)** 와 **전환(conversion)** 을 끌어올리는 것. 새로운 도메인이 아니라 기존 흐름의 끝단에 닫힘 신호를 만든다.

---

## 정책 결정 기록 (2026-04-20 합의)

SubTask 6.2 이전 게이트로 합의된 4가지 정책. 변경 시 여기와 구현을 동시 수정.

### P1. 작성 자격

- **규칙**: request 상태가 `closed` + 해당 공급사의 quote 가 `selected` 상태일 때만 작성 가능.
- **제외**: contact-share 완료만 된 thread, quote `submitted`/`withdrawn`/`declined` 는 자격 없음.
- **근거**: `selected` 는 명시적 단일 선택 이벤트 → "실제 거래 근거" 가 명확. contact-share 는 양방향 동의 플로우로 edge case 다수. MVP 엄격히 닫고 필요 시 완화.

### P2. 수정 / 개수 제한

- **규칙**: 1 (request, supplier) 쌍당 리뷰 1개. 작성 후 **7일 내 1회 수정** 가능.
- **구현 힌트**: `Review.updatedAt > Review.createdAt` 이면 수정 이력 존재. 7일 체크는 `createdAt + 7d < now` 면 `PATCH` 거부 (도메인 exception).
- **근거**: 오작성 교정 여지 + 장기 평판 조작 방지의 절충.

### P3. 작성자 표시 (프라이버시)

- **규칙**: 회사명 "앞글자 + 마스킹" (예: `(주)달콤베이커리` → `(주)달*****`).
- **구현 힌트**: read view projection 시점에 마스킹 문자열 생성 후 `authorDisplayName` 필드로 저장 (raw 회사명은 노출 안 함). 관리자 상세 조회는 raw 허용.
- **근거**: 공급자는 거래 상대 추정 가능 (signal 보존), 외부인은 특정 불가 (privacy). 한국 B2B 플랫폼 관행.

### P4. 모더레이션 범위

- **규칙**:
  - 길이 제약 (text 0-500자, 별점 1-5 정수).
  - **단순 금칙어 리스트** — `shared-core/moderation/ProfanityList.kt` 에 상수로 고정 (욕설 10-20개로 시작).
  - admin hide 토글 API (admin-server) — hidden 리뷰는 `ratingAvg` 산출에서 제외 + 목록에서 숨김.
- **제외**: 외부 API (Perspective 등) 미도입.
- **근거**: 정책 간소화. 운영 중 금칙어가 부족하면 리스트에 append 로 대응.

---

## 현재 진행 상태

- 메인 Task 상태: 🔴 Not Started
- 메모: 도메인 신규. write/read 모델 모두 새로 추가됨. 어디에 닻을 내릴지(quote 또는 request 종료 이벤트)부터 결정 필요.

| SubTask | 상태 | 메모 |
|---------|------|------|
| 6.1 | 🟢 Done | 정책 4종 합의 (2576d75) |
| 6.2 | 🟢 Done | 도메인 + exception + profanity (8be41f3) |
| 6.3 | 🟢 Done | api-server 4 endpoint (ad6687a) |
| 6.4 | 🟢 Done | ReviewProjectionService + supplier view rating 필드 (1c620a9) |
| 6.5 | 🟢 Done | supplier 응답 rating/recentReviews 노출 (520d8b2) |
| 6.6 | 🟢 Done | main-site reviews feature + QuoteComparison 진입점 (fade13e) |
| 6.7 | 🟢 Done | SupplierDetailPage 리뷰 섹션 (0e36772) |
| 6.8 | 🟢 Done | admin-server 모더레이션 + audit + recompute (8285ad0) |
| 6.9 | 🟢 Done | 13 도메인 테스트 + evidence (본 파일 계열) |

---

## SubTask 목록

### 🟢 SubTask 6.1: 작성 자격 정책 — 결정 완료 (2026-04-20)

**작업자:** Backend
**예상 소요:** 0.25일 (결정만, 구현은 6.2 에서)

- [x] 작성 가능 조건: request `closed` + 해당 supplier 의 quote `selected`. (정책 P1)
- [x] 1 (request, supplier) 쌍당 최대 1개 리뷰. (정책 P2)
- [x] 작성 후 7일 내 1회 수정 가능, 이후 불가. (정책 P2)
- [상단 "정책 결정 기록" 섹션 참조]

### 🔴 SubTask 6.2: 도메인 모델

**작업자:** Backend
**예상 소요:** 0.5일

- [ ] `Review` aggregate (id, requesterUserId, supplierProfileId, requestId, quoteId, rating(1-5), text(0-500), createdAt, updatedAt, hidden)
- [ ] `command-domain-review` 모듈 (또는 `command-domain-supplier`에 종속) — 모듈 신규 시 `settings.gradle.kts` 등록
- [ ] MariaDB 테이블 + R2DBC 매핑

### 🔴 SubTask 6.3: 리뷰 API

**작업자:** Backend
**예상 소요:** 0.75일

- [ ] `POST /api/reviews` (요청자)
- [ ] `PATCH /api/reviews/{id}` (작성자, 7일 내)
- [ ] `GET /api/suppliers/{supplierId}/reviews?page=&size=`
- [ ] `GET /api/reviews/eligibility?requestId=&supplierId=` (작성 가능 여부)
- [ ] Swagger 예제

### 🔴 SubTask 6.4: 평균 평점 projection

**작업자:** Backend
**예상 소요:** 0.5일

- [ ] `supplier_search_view`/`supplier_detail_view`에 `ratingAvg`, `ratingCount` 갱신 로직
- [ ] write side에서 review create/update 이벤트 발행 → projection 반영
- [ ] 초기 backfill 스크립트 (없으면 0/0)

### 🔴 SubTask 6.5: 탐색/상세 응답 확장

**작업자:** Backend
**예상 소요:** 0.25일

- [ ] `/api/suppliers` 응답 item에 `ratingAvg`, `ratingCount` 추가
- [ ] `/api/suppliers/{id}` 상세에 동일 필드 + 최근 리뷰 3건
- [ ] Swagger 갱신

### 🔴 SubTask 6.6: main-site 리뷰 작성 UI

**작업자:** Frontend
**예상 소요:** 0.75일

- [ ] 의뢰 종료 후 또는 요청 상세에서 작성 진입점
- [ ] 별점 컴포넌트 (1-5)
- [ ] 텍스트 영역 (0-500자, 카운터)
- [ ] 작성 가능 여부에 따른 CTA 비활성화

### 🔴 SubTask 6.7: 공급자 상세 리뷰 노출

**작업자:** Frontend
**예상 소요:** 0.5일

- [ ] 평균 평점·총 개수 헤더
- [ ] 최근 리뷰 목록 (페이지네이션)
- [ ] 작성자 표시: 앞글자 + 마스킹 (정책 P3 — read view projection 에서 `authorDisplayName` 생성)

### 🔴 SubTask 6.8: 모더레이션 가드

**작업자:** Backend
**예상 소요:** 0.25일

- [ ] 단순 금칙어 리스트 + 길이 제약
- [ ] 관리자 hide 토글 API (admin-server)
- [ ] hidden 리뷰는 ratingAvg에서 제외

### 🔴 SubTask 6.9: 테스트/evidence

**작업자:** Full-stack
**예상 소요:** 0.5일

- [ ] domain test: 자격 검증, 1:1 제약, 평균 재계산
- [ ] api test: eligibility, create, list
- [ ] frontend test: 별점, 작성 폼 제약
- [ ] e2e: 의뢰 종료 → 리뷰 작성 → 공급자 상세에 반영

---

## 인수 완료 조건 (Acceptance Criteria)

- [ ] 적격 요청자가 별점+짧은 리뷰를 남길 수 있고, 같은 (request, supplier) 조합으로는 1회만 가능하다.
- [ ] 공급자 탐색/상세 응답에 평균 평점·리뷰 수가 노출된다.
- [ ] hidden 처리된 리뷰는 평균과 목록에서 제외된다.
- [ ] Evidence: `.sisyphus/evidence/phase2-task-06-reviews-and-ratings-foundation.txt`

---

## 검증 명령

```bash
cd backend
./gradlew :api-server:test :admin-server:test :command-domain-supplier:test
# 새 모듈을 만든 경우
./gradlew :command-domain-review:test :query-model-supplier:test

cd frontend
yarn workspace @fsm/main-site test
yarn workspace @fsm/main-site build
yarn e2e --grep "review"
```

---

## 의존성 매트릭스

| From | To | 관계 |
|------|-----|------|
| 6.1 자격 정책 | 6.2 모델 | 상태 의존성 명세화 |
| 6.2 모델 | 6.3 API | 도메인 확정 후 컨트롤러 |
| 6.3 API | 6.6, 6.7 UI | API 계약 확정 후 화면 |
| 6.4 projection | 6.5 응답 | projection 안정화 후 search 응답 변경 |

---

## 리스크 및 완화 전략

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| 자격 정책이 비즈니스 측과 충돌 | High | 6.1을 PRD/PO와 합의 후 진행 (6.2 이전 게이트) |
| 평균 갱신 race condition | Medium | projection을 transactional하게 단일 컨슈머로 처리 |
| 작성자 노출 프라이버시 이슈 | Medium | 회사명 마스킹 정책 6.7에서 결정 후 일관 적용 |
| 모더레이션 미흡으로 운영 부담 | Medium | 6.8에 admin hide API 우선 확보, 신고 흐름은 차후 |

---

## 산출물 (Artifacts)

### 코드
- `backend/command-domain-review/...` 또는 supplier 모듈 확장
- `backend/api-server/.../review/ReviewController.kt`
- `backend/admin-server/.../review/AdminReviewModerationController.kt`
- `backend/projection/.../ReviewToSupplierProjection.kt`
- `backend/query-model-supplier/...` 평점 필드
- `frontend/apps/main-site/src/features/review/...`
- `frontend/apps/main-site/src/features/supplier-discovery/...` 평점 노출

### DB
- 신규 테이블 `review`
- `supplier_search_view`/`supplier_detail_view` 필드 추가

### 문서
- Swagger 예제
- `.sisyphus/evidence/phase2-task-06-reviews-and-ratings-foundation.txt`
- 짧은 decision note: 자격·모더레이션 정책

---

## Commit

```
feat(review): add review aggregate, eligibility, command handlers
feat(api): expose review create/list/eligibility endpoints
feat(projection): aggregate supplier rating into search/detail views
feat(api): include ratingAvg/ratingCount in supplier search/detail
feat(main-site): add review writing flow for completed requests
feat(main-site): show ratings and recent reviews on supplier detail
feat(admin): add review hide endpoint for moderation
docs(phase2): record task 06 evidence and policy notes
```

---

**이전 Task**: [Task 05: Swagger and Contract Polish](./phase2-task-05-swagger-and-contract-polish.md)
**다음 Task**: [Task 07: Hot Query Hardening](./phase2-task-07-hot-query-hardening.md)
