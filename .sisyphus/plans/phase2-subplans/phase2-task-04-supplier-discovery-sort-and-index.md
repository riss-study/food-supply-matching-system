# Phase 2 Task 04 - 공급자 탐색 정렬 및 인덱스

## 메인 Task 메타데이터

| 항목 | 값 |
|------|-----|
| **메인 Task ID** | P2-04 |
| **Wave** | 2 (MVP Completion Debt Closure) |
| **우선순위** | P1 |
| **기간** | 2-3일 |
| **스토리 포인트** | 8 |
| **작업자** | Full-stack |
| **상태** | 🟢 Done (2026-04-19) |
| **Can Parallel** | YES (P2-03, P2-05와 병렬 가능) |
| **Blocks** | 없음 |
| **Blocked By** | P2-01 (CI baseline) |

---

## 개요

공급자 탐색(`/api/suppliers`, `supplier_search_view`)의 backend 정렬·필터·인덱스를 정비하고, main-site UI에서도 정렬·필터 옵션을 노출한다. Phase 1에서는 in-memory에서 단순 필터를 거쳐 응답하던 부분이 있어, 데이터가 늘어나기 전에 DB/Mongo 인덱스 기반 페이지네이션으로 정리한다.

---

## 현재 진행 상태

- 메인 Task 상태: 🔴 Not Started
- 메모: read 모델은 Mongo `supplier_search_view`. Phase 1 seed 기준 3건만 있음. 정렬 키와 인덱스 스펙을 명확히 정의 필요.

| SubTask | 상태 | 메모 |
|---------|------|------|
| 4.1 | 🟢 Done | `SupplierQueryService.listApproved` 재감사: `findAll().collectList()` → in-memory filter/sort/paginate. 도메인 관점 확인. |
| 4.2 | 🟢 Done | 정렬 키: `updatedAt` (default desc), `companyName`, `monthlyCapacity`, `moq`. Order: `asc`/`desc`. |
| 4.3 | 🟢 Done | 필터: keyword (companyName regex), category (정확 매치 regex), region (regex), oemAvailable, odmAvailable. |
| 4.4 | 🟢 Done | `01-init-read-store.js` 에 index 7종 추가 (idempotent). `seed-mongodb.sh` 가 01+02 둘 다 실행. |
| 4.5 | 🟢 Done | `ReactiveMongoTemplate` + `Criteria` + `Sort` + `skip/limit` 로 이관. post-filter 는 숫자 파라미터만 (제약 문서화). |
| 4.6 | 🟢 Done | main-site `SupplierSearchPage` 에 정렬 드롭다운 + 방향 드롭다운 추가 + URL sync. 기존 필터 UI 유지. |
| 4.7 | 🟢 Done | Evidence: `.sisyphus/evidence/phase2-task-04-*.txt`. gradle test + vitest 통과. curl smoke 포함. |

---

## SubTask 목록

### 🔴 SubTask 4.1: 현황 재감사

**작업자:** Backend
**예상 소요:** 0.25일

- [ ] `SupplierSearchController` (또는 동일 역할) 코드 확인
- [ ] in-memory filter/sort 잔재 식별
- [ ] 현재 응답 필드 vs UI 요구 필드 비교

### 🔴 SubTask 4.2: 정렬 정책

**작업자:** Backend
**예상 소요:** 0.25일

- [ ] `sort` 파라미터 enum: `companyName`, `monthlyCapacity`, `recentlyApprovedAt`
- [ ] `order` 파라미터: `asc` | `desc`
- [ ] 기본값: `recentlyApprovedAt desc`

### 🔴 SubTask 4.3: 필터 정책

**작업자:** Backend
**예상 소요:** 0.25일

- [ ] `region` 단일값
- [ ] `categories` 다중값 (any-match)
- [ ] `oemAvailable`, `odmAvailable` boolean
- [ ] `moqMax` 정수 (이하)
- [ ] `monthlyCapacityMin` 정수 (이상)

### 🔴 SubTask 4.4: Mongo 인덱스

**작업자:** Backend
**예상 소요:** 0.5일

- [ ] `supplier_search_view` 인덱스: `{exposureState:1, recentlyApprovedAt:-1}`, `{categories:1}`, `{region:1}`
- [ ] `docker/mongodb/init/01-init-read-store.js`에 `createIndex` 추가
- [ ] 기존 환경에 적용 가능한 idempotent 마이그레이션 스니펫

### 🔴 SubTask 4.5: Backend API 일치화

**작업자:** Backend
**예상 소요:** 0.5일

- [ ] 모든 정렬/필터를 Mongo query로 위임
- [ ] 페이지네이션 meta 응답 envelope 일관 유지
- [ ] Swagger schema/example 갱신

### 🔴 SubTask 4.6: main-site 탐색 UI

**작업자:** Frontend
**예상 소요:** 0.75일

- [ ] 정렬 드롭다운 (companyName/monthlyCapacity/recentlyApprovedAt)
- [ ] 필터 패널: region/category/oem/odm/moqMax/monthlyCapacityMin
- [ ] URL query string ↔ UI state 동기화
- [ ] 빈 결과 empty-state 디자인

### 🔴 SubTask 4.7: 테스트/evidence

**작업자:** Full-stack
**예상 소요:** 0.5일

- [ ] backend repository test: 정렬/필터 조합
- [ ] frontend hook test: useSupplierSearch URL sync
- [ ] e2e smoke (탐색 → 정렬 변경 → 결과 변화)

---

## 인수 완료 조건 (Acceptance Criteria)

- [ ] `/api/suppliers`가 sort/order/필터 파라미터 5종 이상을 안정적으로 처리한다.
- [ ] 정렬·필터는 Mongo 인덱스를 통해 DB 레벨에서 처리된다 (in-memory filter 잔재 없음).
- [ ] main-site 탐색 화면에서 사용자가 정렬·필터를 바꾸면 URL이 갱신되고 결과가 즉시 반영된다.
- [ ] Evidence: `.sisyphus/evidence/phase2-task-04-supplier-discovery-sort-and-index.txt`

---

## 검증 명령

```bash
cd backend
./gradlew :api-server:test :query-model-supplier:test

cd frontend
yarn workspace @fsm/main-site test
yarn workspace @fsm/main-site build

# 수동 실행 검증
curl -s 'http://localhost:8080/api/suppliers?sort=monthlyCapacity&order=desc&categories=bakery&moqMax=1000' | jq .
```

---

## 의존성 매트릭스

| From | To | 관계 |
|------|-----|------|
| 4.1 재감사 | 4.2~4.5 | 현재 코드 파악 후 변경 범위 확정 |
| 4.4 인덱스 | 4.5 API | 인덱스 정의 후 query 작성 |
| 4.5 API | 4.6 UI | API 계약 확정 후 UI 연동 |

---

## 리스크 및 완화 전략

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| 인덱스 변경이 기존 dev DB에 미반영 | Medium | init 스크립트 idempotent + 재seed 가이드 |
| 필터 조합 폭증으로 Swagger 예제 관리 부담 | Low | 대표 시나리오 3개만 예제 |
| 기존 UI URL을 깨뜨리는 query 변경 | Medium | 이전 파라미터는 deprecated alias로 일정 기간 호환 |

---

## 산출물 (Artifacts)

### 코드
- `backend/api-server/.../supplier/SupplierSearchController.kt`
- `backend/query-model-supplier/.../SupplierSearchRepository.kt`
- `backend/docker/mongodb/init/01-init-read-store.js` 인덱스 추가
- `frontend/apps/main-site/src/features/supplier-discovery/...`

### 문서
- Swagger 예제
- `.sisyphus/evidence/phase2-task-04-supplier-discovery-sort-and-index.txt`

---

## Commit

```
perf(supplier-search): push sort/filter into Mongo with indexes
feat(api): expand supplier search filters and sort options
feat(main-site): expose supplier search sort/filter UI synced with URL
docs(phase2): record task 04 evidence
```

---

**이전 Task**: [Task 03: Admin Review History and Audit](./phase2-task-03-admin-review-history-and-audit.md)
**다음 Task**: [Task 05: Swagger and Contract Polish](./phase2-task-05-swagger-and-contract-polish.md)
