# Task 08 - Quote Lifecycle and Comparison

## 메인 Task 메타데이터

| 항목 | 값 |
|------|-----|
| **메인 Task ID** | 8 |
| **병렬 그룹** | Group C |
| **기간** | 3-4일 |
| **스토리 포인트** | 13 |
| **작업자** | Full-stack |
| **우선순위** | P1 |
| **상태** | 🟢 Done |
| **Can Parallel** | YES |
| **Blocks** | Task 9, 11 |
| **Blocked By** | Task 1, 6, 7 |

---

## 개요

공급자가 의뢰에 견적을 제출하고, 요청자가 견적을 비교하여 선택 또는 거절하는 전체 라이프사이클을 구현한다. 중복 제출 방지, 수정/철회 규칙, 비교 뷰를 포함한다.

---

## 현재 진행 상태

- 메인 Task 상태: 🟢 Done
- 메모: 2026-03-24 기준으로 quote lifecycle acceptance, requester comparison modal UX, supplier submit/manage page tests를 다시 검증했고 optional 초기 메시지 생성은 Task 09 메시징 범위로 명시 분리했다.

| SubTask | 상태 | 메모 |
|---------|------|------|
| 8.1 | 🟢 Done | Quote aggregate, 상태 전이, versioning, duplicate guard 구현 완료 |
| 8.2 | 🟢 Done | submit/update quote API와 thread 생성 응답 구현 완료 |
| 8.3 | 🟢 Done | withdraw/select/decline API와 request close cascade 구현 완료 |
| 8.4 | 🟢 Done | request quote comparison list와 supplier quote list API 구현 완료 |
| 8.5 | 🟢 Done | thread 생성과 projection 연동 완료, 초기 메시지 자동 생성은 optional이며 Task 09 메시징 범위로 분리 |
| 8.6 | 🟢 Done | quote submit/manage UI에 제출 전 확인 단계까지 추가 완료 |
| 8.7 | 🟢 Done | 비교/선택/거절 흐름을 dialog 기반 detail/confirm UX와 페이지 테스트로 마감 |

---

## SubTask 목록

### 🟢 SubTask 8.1: 견적 도메인 모델

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] `Quote` aggregate
  - [x] Fields: requestId, supplierProfileId, unitPriceEstimate, moq, leadTime, sampleCost, note, state, version
  - [x] State machine: `submitted` -> (`selected` | `withdrawn` | `declined`)
  - [x] Versioning: 수정 시 버전 증가
- [x] Command handlers
  - [x] `SubmitQuote` - 중복 제출 guard
  - [x] `UpdateQuote` (submitted 상태에서만)
  - [x] `WithdrawQuote`
  - [x] `SelectQuote` - 의뢰 종료 포함
  - [x] `DeclineQuote`
- [x] Invariants
  - [x] 동일 (request, supplier)당 active quote는 1개만
  - [x] closed/cancelled 의뢰에는 제출 불가
  - [x] approved supplier만 제출 가능

### 🟢 SubTask 8.2: 견적 제출 및 수정 API

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] API: `POST /api/requests/{requestId}/quotes`
  - [x] Auth: role=supplier, verificationState=approved
  - [x] Validation: unitPriceEstimate, moq, leadTime (양수)
  - [x] Duplicate guard: 이미 active quote 있으면 409
  - [x] Effect: MessageThread 자동 생성
  - [x] Swagger: response에 quoteId, threadId 포함
- [x] API: `PATCH /api/quotes/{quoteId}`
  - [x] Auth: quote 제출자
  - [x] submitted 상태에서만 수정 가능
  - [x] Version increment
  - [x] Swagger: partial update 예시

### 🟢 SubTask 8.3: 견적 상태 변경 API

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] API: `POST /api/quotes/{quoteId}/withdraw`
  - [x] Auth: quote 제출자
  - [x] Effect: state -> `withdrawn`
- [x] API: `POST /api/quotes/{quoteId}/select`
  - [x] Auth: 의뢰 소유자
  - [x] Effect: state -> `selected`, request -> `closed`
  - [x] 다른 submitted quote들 자동 decline 처리
- [x] API: `POST /api/quotes/{quoteId}/decline`
  - [x] Auth: 의뢰 소유자
  - [x] Request: reason (선택)
  - [x] Effect: state -> `declined`

### 🟢 SubTask 8.4: 견적 목록 및 비교 API

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] API: `GET /api/requests/{requestId}/quotes`
  - [x] Auth: 의뢰 소유자
  - [x] Query: state 필터, pagination
  - [x] Response: quote list with supplier info
- [x] API: `GET /api/supplier/quotes`
  - [x] 내가 제출한 견적 목록 (supplier용)
  - [x] 관련 의뢰 정보 포함
- [x] Projection: `quote_comparison_view`
  - [x] 비교용 read model
  - [x] 단가, MOQ, 납기 기준 정렬 지원

### 🟢 SubTask 8.5: 견적 자동 생성 및 연동

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] Quote 제출 시 자동 Thread 생성
  - [x] `MessageThread` 자동 생성 (quote submit 트리거)
  - [ ] 초기 메시지 자동 생성 (optional)
- [x] Quote 상태 변경 이벤트
  - [x] `QuoteSubmittedEvent` -> Thread 생성, Request quoteCount 증가
  - [x] `QuoteSelectedEvent` -> Request closed, 다른 quotes declined
  - [x] `QuoteWithdrawnEvent` -> quoteCount 감소

### 🟢 SubTask 8.6: 프론트엔드 견적 제출 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [x] 견적 제출 페이지/모달 (`main-site` - supplier)
  - [x] 단가, MOQ, 납기, 샘플 비용 입력
  - [x] 비고 (선택)
  - [x] 제출 전 확인
- [x] 내 견적 관리 페이지
  - [x] 제출한 견적 목록
  - [x] 상태별 표시 (submitted/selected/withdrawn/declined)
  - [x] 수정/철회 버튼 (submitted 상태에서만)

### 🟢 SubTask 8.7: 견적 비교 및 선택 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [x] 견적 비교 페이지 (`main-site` - requester)
  - [x] 테이블 형태 비교: 공급자, 단가, MOQ, 납기, 샘플비용
  - [x] 정렬: 각 컬럼 기준 정렬
  - [x] 선택/거절 버튼
- [x] 견적 상세 모달
  - [x] 공급자 정보 요약
  - [x] 견적 내용 상세
  - [x] "이 견적 선택" 버튼
- [x] 선택 확인 모달
  - [x] 선택 시 의뢰 종료됨 안내
  - [x] 최종 확인 버튼

---

## 인수 완료 조건 (Acceptance Criteria)

- [x] 승인된 공급자만 견적 제출 가능 (4037)
- [x] 동일 의뢰에 중복 견적 제출 불가 (4095)
- [x] closed/cancelled 의뢰에는 견적 제출 불가
- [x] submitted 상태에서만 견적 수정 가능
- [x] submitted 상태에서만 철회 가능
- [x] 견적 선택 시 해당 의뢰 자동 종료
- [x] 요청자는 자신 의뢰의 견적만 비교/선택 가능
- [x] 견적 제출 시 메시지 스레드 자동 생성
- [x] Swagger에서 모든 quote endpoints 문서화됨

---

## 병렬 작업 구조

```
Backend:  [8.1 Domain] -> [8.2 Submit/Update API] -> [8.3 State APIs]
                               -> [8.4 List API] + [8.5 Projection/Thread]

Frontend: [8.6 Submit UI] + [8.7 Compare/Select UI]
```

---

## 의존성 매트릭스

| From | To | 관계 |
|------|-----|------|
| Task 1 | Task 8 | Foundation 필요 |
| Task 6 | Task 8 | Approved supplier가 quote 제출 |
| Task 7 | Task 8 | Request 기준으로 quote 제출/비교 |
| Task 8 | Task 9 | Quote 제출 시 thread 생성 |
| Task 8 | Task 11 | Quote selection 후 contact share 가능 |

---

## 리스크 및 완화 전략

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| 중복 견적 제출 | High | DB unique constraint + application-level guard |
| 선택 시 동시성 | Medium | Transaction으로 request close + quote selected 원자 처리 |
| Thread 생성 실패 | Medium | Event-driven async 처리, 실패 시 retry |

---

## 산출물 (Artifacts)

### Backend
- `command-domain-quote`: Quote aggregate
- `query-model-quote`: Quote list/comparison views
- `query-model-request`: Request quote count projection
- `api-server`: Quote controller
- Projection: quote state change events, thread creation
- Evidence: `.sisyphus/evidence/task-8-quote-lifecycle.txt`

### Frontend
- `apps/main-site`: Quote submit page (supplier), Quote comparison page (requester)
- `packages/ui`: Quote card, comparison table, status badge

### 테스트 시나리오
- Happy path: submit quote -> compare -> select -> request closed
- Update path: submit -> update -> withdraw
- Denial: duplicate quote (4095), unapproved supplier (4037)
- Selection cascade: select one -> others auto-declined

---

## Commit

```
feat(plan): QUOTE-001 실행 계획 고정

- Quote aggregate with state machine and versioning
- Submit/Update/Withdraw/Select/Decline APIs
- Duplicate prevention and permission guards
- Quote comparison read model
- Automatic thread creation on submit
- Frontend quote submission and comparison UI
```

---

**이전 Task**: [Task 7: Request Lifecycle and Targeting](./phase1-task-07-request-lifecycle.md)
**다음 Task**: [Task 9: Message Threads, Attachments, Read State](./phase1-task-09-message-threads.md)
