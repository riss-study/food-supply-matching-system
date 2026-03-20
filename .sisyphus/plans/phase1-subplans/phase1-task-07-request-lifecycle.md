# Task 07 - Request Lifecycle and Targeting

## 메인 Task 메타데이터

| 항목 | 값 |
|------|-----|
| **메인 Task ID** | 7 |
| **병렬 그룹** | Group C |
| **기간** | 3-4일 |
| **스토리 포인트** | 13 |
| **작업자** | Full-stack |
| **우선순위** | P1 |
| **상태** | 🟢 Done |
| **Can Parallel** | YES |
| **Blocks** | Task 8, 9 |
| **Blocked By** | Task 1, 4, 5, 6 |

---

## 개요

요청자가 의뢰를 생성, 수정, 게시, 종료, 취소하는 전체 라이프사이클을 구현한다. 공개(public) 모드와 지정(targeted) 모드를 지원하며, 지정된 공급자만 의뢰에 접근할 수 있다.

---

## 현재 진행 상태

- 메인 Task 상태: 🟢 Done
- 메모: 백엔드/프론트 구현, 빌드, 테스트, 코드 리뷰까지 완료.

| SubTask | 상태 | 메모 |
|---------|------|------|
| 7.1 | 🟢 Done | Request aggregate, state machine, targeted link 구현 완료 |
| 7.2 | 🟢 Done | requester request CRUD API와 상세/목록 응답 계약 구현 완료 |
| 7.3 | 🟢 Done | publish/close/cancel/update 상태 변경 API 구현 완료 |
| 7.4 | 🟢 Done | requester summary / supplier feed read model 및 projection 반영 완료 |
| 7.5 | 🟢 Done | RequestAccessGuard 및 supplier feed 접근 제어 구현 완료 |
| 7.6 | 🟢 Done | main-site requester create/list/detail/edit UI 구현 완료 |
| 7.7 | 🟢 Done | main-site supplier request feed/detail UI 구현 완료 |

---

## SubTask 목록

### 🟢 SubTask 7.1: 의뢰 도메인 모델

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] `Request` aggregate
  - [ ] Fields: requesterUserId, mode (public/targeted), title, category, desiredVolume, targetPriceRange, certificationRequirement[], rawMaterialRule, packagingRequirement, deliveryRequirement, notes, state
  - [ ] State machine: `draft` -> `open` -> (`closed` | `cancelled`)
  - [ ] `draft` -> `cancelled`
- [ ] `TargetedSupplierLink` entity
  - [ ] Fields: requestId, supplierProfileId
  - [ ] 유니크 제약: (requestId, supplierProfileId)
- [ ] Command handlers
  - [ ] `CreateRequest`
  - [ ] `UpdateRequest` (draft/open 상태)
  - [ ] `PublishRequest` (draft -> open)
  - [ ] `CloseRequest` (open -> closed)
  - [ ] `CancelRequest` (draft/open -> cancelled)

### 🟢 SubTask 7.2: 의뢰 CRUD API

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] API: `POST /api/requests`
  - [ ] Auth: role=requester, approvalState=approved
  - [ ] Validation: title (5-200자), desiredVolume (양수), mode (public/targeted)
  - [ ] targeted 모드시 supplierIds[] 필수
  - [ ] Response: requestId, state=draft
  - [ ] Swagger: request/response 예시
- [ ] API: `GET /api/requests`
  - [ ] 내 의뢰 목록 조회
  - [ ] Query: state 필터, pagination
- [ ] API: `GET /api/requests/{requestId}`
  - [ ] 의뢰 상세 조회
  - [ ] 권한: 소유자 또는 지정 공급자 (targeted 모드)
  - [ ] targetSuppliers[] 포함 (targeted 모드)

### 🟢 SubTask 7.3: 의뢰 상태 변경 API

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] API: `PATCH /api/requests/{requestId}`
  - [ ] Partial update
  - [ ] draft/open 상태에서만 수정 가능
  - [ ] Validation: 허용된 필드만 수정 가능
- [ ] API: `POST /api/requests/{requestId}/close`
  - [ ] 의뢰 종료 (마감)
  - [ ] Effect: state -> `closed`
  - [ ] 자동으로 해당 의뢰의 quote 제출 불가
- [ ] API: `POST /api/requests/{requestId}/cancel`
  - [ ] 의뢰 취소
  - [ ] Request: reason (선택)
  - [ ] Effect: state -> `cancelled`

### 🟢 SubTask 7.4: 의뢰 프로젝션 및 피드

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] Projection: `requester_request_summary_view`
  - [ ] 요청자 대시보드용 요약 정보
  - [ ] quoteCount 포함
- [ ] Projection: `supplier_request_feed_view`
  - [ ] 공급자 피드용 목록
  - [ ] public 모드: 모든 open 의뢰
  - [ ] targeted 모드: 지정된 의뢰만
  - [ ] 이미 quote 제출한 의뢰 표시
- [ ] Event consumers
  - [ ] `RequestPublishedEvent`: supplier feed에 추가
  - [ ] `RequestClosedEvent`: feed에서 제거
  - [ ] `QuoteSubmittedEvent`: quoteCount 증가

### 🟢 SubTask 7.5: 공급자 의뢰 접근 권한

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] `RequestAccessGuard` 구현
  - [ ] public 모드: approved supplier 누구나 접근 가능
  - [ ] targeted 모드: 지정된 supplier만 접근 가능
  - [ ] Error: 403 for unauthorized access
- [ ] `GET /api/supplier/requests` (공급자용)
  - [ ] 내가 볼 수 있는 의뢰 목록 (피드)
  - [ ] public + targeted (내가 지정된) 필터링

### 🟢 SubTask 7.6: 프론트엔드 의뢰 관리 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [ ] 의뢰 생성 페이지 (`main-site`)
  - [ ] 모드 선택: public / targeted
  - [ ] targeted 모드: 공급자 선택 컴포넌트
  - [ ] 폼: 제목, 카테고리, 희망수량, 희망단가, 인증요구, 원재료규칙, 포장요구, 납기
- [ ] 의뢰 목록 페이지
  - [ ] 상태별 필터 탭 (draft/open/closed/cancelled)
  - [ ] 각 의뢰 카드: 제목, 상태, 견적수, 생성일
- [ ] 의뢰 상세/수정 페이지
  - [ ] 상태별 수정 가능 필드 표시
  - [ ] 게시/종료/취소 액션 버튼

### 🟢 SubTask 7.7: 공급자 의뢰 피드 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [ ] 의뢰 피드 페이지 (`main-site` - supplier view)
  - [ ] 공개 의뢰 목록
  - [ ] 지정 의뢰 목록 (나에게 온 의뢰)
  - [ ] 카테고리 필터
- [ ] 의뢰 상세 보기 (supplier)
  - [ ] 의뢰 내용 표시
  - [ ] "견적 제출하기" 버튼 (아직 제출 안 한 경우)
  - [ ] 내 견적 보기 (이미 제출한 경우)

---

## 인수 완료 조건 (Acceptance Criteria)

- [ ] 승인된 요청자만 의뢰 생성 가능 (4034)
- [ ] 의뢰 생성 시 draft 상태로 저장
- [ ] draft/open 상태에서만 수정 가능
- [ ] public 모드는 approved supplier 누구나 조회 가능
- [ ] targeted 모드는 지정된 supplier만 조회 가능
- [ ] closed/cancelled 의뢰에는 quote 제출 불가
- [ ] 요청자 대시보드에서 내 의뢰 목록 확인 가능
- [ ] 공급자 피드에서 볼 수 있는 의뢰 목록 확인 가능
- [ ] Swagger에서 모든 request endpoints 문서화됨

---

## 병렬 작업 구조

```
Backend:  [7.1 Domain] -> [7.2 CRUD API] -> [7.3 State APIs]
                               -> [7.4 Projection] -> [7.5 Access Guard]

Frontend: [7.6 Requester UI] + [7.7 Supplier Feed UI]
```

---

## 의존성 매트릭스

| From | To | 관계 |
|------|-----|------|
| Task 1 | Task 7 | Foundation 필요 |
| Task 4 | Task 7 | Approved requester가 의뢰 생성 |
| Task 5 | Task 7 | Approved supplier가 의뢰 조회 |
| Task 6 | Task 7 | Supplier discovery 후 targeted 지정 |
| Task 7 | Task 8 | Request 기준으로 quote 제출 |
| Task 7 | Task 9 | Request 기준으로 thread 생성 |

---

## 리스크 및 완화 전략

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| Targeted 모드 권한 | High | 명확한 access guard, request-supplier link 기반 검증 |
| 상태 전이 오류 | Medium | State machine validation, invalid transition 예외 |
| Quote count 동기화 | Low | Eventual consistency 허용, polling으로 보완 가능 |

---

## 산출물 (Artifacts)

### Backend
- `command-domain-request`: Request aggregate, TargetedSupplierLink
- `query-model-request`: Request summary/feed views
- `query-model-supplier`: Supplier request feed view
- `api-server`: Request controller, supplier request controller
- Projection: request state change events
- Evidence: `.sisyphus/evidence/task-7-request-lifecycle.txt`

### Frontend
- `apps/main-site`: Request create/list/detail pages (requester), Request feed (supplier)
- `packages/ui`: Request card, mode selector, supplier picker

### 테스트 시나리오
- Happy path: create -> publish -> receive quotes -> close
- Targeted mode: create with suppliers -> only selected see the request
- Denial: unapproved requester cannot create (4034)
- State guard: closed request cannot receive quotes

---

## Commit

```
feat(plan): REQUEST-001 실행 계획 고정

- Request aggregate with state machine
- TargetedSupplierLink for targeted mode
- Create/Update/Close/Cancel APIs
- Public vs Targeted access control
- Requester dashboard and supplier feed projections
- Frontend request management UI
```

---

**이전 Task**: [Task 6: Supplier Discovery and Read Models](./phase1-task-06-supplier-discovery.md)
**다음 Task**: [Task 8: Quote Lifecycle and Comparison](./phase1-task-08-quote-lifecycle.md)
