# Task 06 - Supplier Discovery and Read Models

## 메인 Task 메타데이터

| 항목 | 값 |
|------|-----|
| **메인 Task ID** | 6 |
| **병렬 그룹** | Group C |
| **기간** | 3-4일 |
| **스토리 포인트** | 13 |
| **작업자** | Full-stack |
| **우선순위** | P1 |
| **상태** | 🟡 Partial |
| **Can Parallel** | YES |
| **Blocks** | Task 7, 8 |
| **Blocked By** | Task 1, 2 |

---

## 개요

승인된 공급자만 검색 결과에 노출되는 공급자 탐색 기능을 구현한다. 검색, 필터, 상세 조회 read model과 projection을 포함한다. ranking/review/map 확장은 금지한다.

---

## 현재 진행 상태

- 메인 Task 상태: 🟡 Partial
- 메모: 2026-03-20 보강 작업으로 search sort/order, OEM/ODM/용량 필터, reset 버튼, 로고/targeted CTA가 추가됐지만 event consumer 명시와 optional text-index 항목은 여전히 남아 있음.

| SubTask | 상태 | 메모 |
|---------|------|------|
| 6.1 | 🟢 Done | read model과 핵심 Mongo index 선언 재검증 완료 |
| 6.2 | 🟡 Partial | projection은 확인됐지만 event consumer 명시는 확인되지 않음 |
| 6.3 | 🟢 Done | 검색/상세 API에 sort/order 포함해 재검증 완료 |
| 6.4 | 🟢 Done | 카테고리/지역 목록 API 구현 완료 |
| 6.5 | 🟢 Done | OEM/ODM/생산량/MOQ 필터와 reset 버튼까지 구현 완료 |
| 6.6 | 🟢 Done | main-site 공급자 상세 UI 핵심 플로우 재검증 완료 |
| 6.7 | 🟡 Partial | companyName text index와 핵심 indexes는 추가됐지만 equipmentSummary text index는 남음 |

---

## SubTask 목록

### 🟢 SubTask 6.1: 공급자 검색 Read Model

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] `supplier_search_view` (MongoDB collection)
  - [x] Fields: profileId, companyName, region, categories[], monthlyCapacity, moq, oemAvailable, odmAvailable, logoUrl, verificationState
  - [x] Only `approved` suppliers included
  - [x] Indexed fields: region, categories, oemAvailable, odmAvailable
- [x] `supplier_detail_view` (MongoDB collection)
  - [x] Full supplier profile data
  - [x] Certifications, portfolio images included
  - [x] Visible to all users

### 🟢 SubTask 6.2: 공급자 프로젝션

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] Projection handlers
  - [x] `OnSupplierApproved`: search_view와 detail_view에 추가
  - [x] `OnSupplierSuspended`: search_view와 detail_view에서 숨김
  - [x] `OnSupplierProfileUpdated`: detail_view 업데이트
  - [x] `OnCertificationAdded`: detail_view 업데이트
- [ ] Event consumers
  - [ ] `SupplierVerifiedEvent`
  - [ ] `SupplierSuspendedEvent`
  - [ ] `SupplierProfileUpdatedEvent`
  - [ ] `CertificationAddedEvent`

### 🟢 SubTask 6.3: 공급자 검색 API

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] API: `GET /api/suppliers`
  - [x] Auth: 선택적 (인증 시 추가 정보 가능)
  - [x] Query params:
    - [x] keyword (회사명 키워드)
    - [x] category (카테고리 필터)
    - [x] region (지역 필터)
    - [x] oem, odm (boolean 필터)
    - [x] minCapacity, maxMoq (capacity 필터)
    - [x] page, size, sort, order (pagination)
  - [x] Swagger: 모든 파라미터와 응답 예시 문서화
- [x] API: `GET /api/suppliers/{supplierId}`
  - [x] 상세 조회: supplier_detail_view 기준
  - [x] 인증 여부와 관계없이 공개 정보 반환
  - [x] 404: 승인되지 않은 공급자 조회 시

### 🟢 SubTask 6.4: 카테고리 및 지역 목록 API

**작업자:** Backend  
**예상 소요:** 0.25일

- [x] API: `GET /api/suppliers/categories`
  - [x] 사용 중인 카테고리 코드 목록
  - [x] 각 카테고리별 공급자 수
- [x] API: `GET /api/suppliers/regions`
  - [x] 사용 중인 지역 목록
  - [x] 각 지역별 공급자 수
- [x] Swagger: 간단한 목록 응답 문서화

### 🟢 SubTask 6.5: 프론트엔드 공급자 검색 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [x] 공급자 검색 페이지 (`main-site`)
  - [x] 키워드 검색 입력
  - [x] 필터 패널: 카테고리, 지역, OEM/ODM, 생산능력
  - [x] 검색 결과 목록: 카드 형태
  - [x] Pagination
- [x] 검색 결과 카드 컴포넌트
  - [x] 회사명, 지역, 카테고리 태그
  - [x] 생산능력, MOQ 표시
  - [x] OEM/ODM 가능 여부 배지
  - [x] 로고 이미지 (있는 경우)
- [x] 필터 상태 관리
  - [x] URL query string 동기화
  - [x] 필터 초기화 버튼

### 🟢 SubTask 6.6: 공급자 상세 페이지 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [x] 공급자 상세 페이지 (`main-site`)
  - [x] 회사 기본 정보: 상호, 대표자, 지역
  - [x] 카테고리 및 가능 서비스
  - [x] 생산 능력 및 MOQ
  - [x] OEM/ODM 가능 여부
  - [x] 회사 소개
  - [x] 인증서 목록
  - [x] 포트폴리오 이미지 갤러리
- [x] CTA 버튼
  - [x] 인증된 요청자: "의뢰하기" 버튼 (targeted request로 연결)
  - [x] 미인증 사용자: "로그인 후 이용하기" 안내

### 🟢 SubTask 6.7: 검색 최적화

**작업자:** Backend  
**예상 소요:** 0.25일

- [x] MongoDB indexes
  - [x] Compound index: categories + region
  - [x] Single indexes: oemAvailable, odmAvailable, monthlyCapacity
- [ ] Text index for keyword search
  - [x] companyName text index
  - [ ] equipmentSummary text index (선택)

---

## 인수 완료 조건 (Acceptance Criteria)

- [x] `approved` 상태 공급자만 검색 결과에 노출됨
- [x] 키워드, 카테고리, 지역, OEM/ODM, 생산능력 필터링 가능
- [x] 검색 결과 pagination 동작
- [x] 공급자 상세 페이지에서 모든 공개 정보 표시
- [x] 승인되지 않은 공급자는 상세 조회 시 404 반환
- [x] Projection이 write side 변경 시 read model 동기화
- [x] Swagger에서 search API 문서화됨

---

## 병렬 작업 구조

```
Backend:  [6.1 Read Model] -> [6.2 Projection] -> [6.3 Search API] + [6.4 Lists]
                                                    -> [6.7 Indexing]

Frontend: [6.5 Search UI] -> [6.6 Detail UI]
```

---

## 의존성 매트릭스

| From | To | 관계 |
|------|-----|------|
| Task 1 | Task 6 | Foundation 필요 |
| Task 2 | Task 6 | Auth context (선택적) |
| Task 6 | Task 7 | Approved supplier discovery 후 request 참여 |
| Task 6 | Task 8 | Supplier detail에서 quote 제작 |

---

## 리스크 및 완화 전략

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| Projection 지연 | Medium | eventual consistency 허용, UI는 현재 상태 표시 |
| 검색 성능 | Medium | MongoDB index 최적화, 초기에는 simple query로 시작 |
| 카테고리/지역 데이터 | Low | seed data로 초기값 제공, 동적 aggregation으로 집계 |

---

## 산출물 (Artifacts)

### Backend
- `query-model-supplier`: supplier_search_view, supplier_detail_view
- `projection`: Supplier projection handlers
- `api-server`: Supplier search/list/detail controllers
- MongoDB indexes for search optimization
- Evidence: `.sisyphus/evidence/task-6-supplier-discovery.txt`

### Frontend
- `apps/main-site`: Supplier search page, supplier detail page
- `packages/ui`: Supplier card component, filter panel

### 테스트 시나리오
- Happy path: search -> filter -> view detail
- Denial: unapproved supplier not in search results
- Projection: after approval, supplier appears in search within X seconds

---

## Commit

```
feat(plan): DISCOVERY-001 실행 계획 고정

- Supplier search and detail read models (MongoDB)
- Projection handlers for supplier visibility
- Search API with filters and pagination
- Category/region list APIs
- Frontend supplier search and detail pages
- MongoDB index optimization for search
```

---

**이전 Task**: [Task 5: Admin Review Queue and Decision Actions](./phase1-task-05-admin-review-queue.md)
**다음 Task**: [Task 7: Request Lifecycle and Targeting](./phase1-task-07-request-lifecycle.md)
