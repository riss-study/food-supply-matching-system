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
| **상태** | 계획 중 |
| **Can Parallel** | YES |
| **Blocks** | Task 9, 11 |
| **Blocked By** | Task 1, 6, 7 |

---

## 개요

공급자가 의뢰에 견적을 제출하고, 요청자가 견적을 비교하여 선택 또는 거절하는 전체 라이프사이클을 구현한다. 중복 제출 방지, 수정/철회 규칙, 비교 뷰를 포함한다.

---

## SubTask 목록

### 8.1 견적 도메인 모델

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] `Quote` aggregate
  - [ ] Fields: requestId, supplierProfileId, unitPriceEstimate, moq, leadTime, sampleCost, note, state, version
  - [ ] State machine: `submitted` -> (`selected` | `withdrawn` | `declined`)
  - [ ] Versioning: 수정 시 버전 증가
- [ ] Command handlers
  - [ ] `SubmitQuote` - 중복 제출 guard
  - [ ] `UpdateQuote` (submitted 상태에서만)
  - [ ] `WithdrawQuote`
  - [ ] `SelectQuote` - 의뢰 종료 포함
  - [ ] `DeclineQuote`
- [ ] Invariants
  - [ ] 동일 (request, supplier)당 active quote는 1개만
  - [ ] closed/cancelled 의뢰에는 제출 불가
  - [ ] approved supplier만 제출 가능

### 8.2 견적 제출 및 수정 API

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] API: `POST /api/requests/{requestId}/quotes`
  - [ ] Auth: role=supplier, verificationState=approved
  - [ ] Validation: unitPriceEstimate, moq, leadTime (양수)
  - [ ] Duplicate guard: 이미 active quote 있으면 409
  - [ ] Effect: MessageThread 자동 생성
  - [ ] Swagger: response에 quoteId, threadId 포함
- [ ] API: `PATCH /api/quotes/{quoteId}`
  - [ ] Auth: quote 제출자
  - [ ] submitted 상태에서만 수정 가능
  - [ ] Version increment
  - [ ] Swagger: partial update 예시

### 8.3 견적 상태 변경 API

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] API: `POST /api/quotes/{quoteId}/withdraw`
  - [ ] Auth: quote 제출자
  - [ ] Effect: state -> `withdrawn`
- [ ] API: `POST /api/quotes/{quoteId}/select`
  - [ ] Auth: 의뢰 소유자
  - [ ] Effect: state -> `selected`, request -> `closed`
  - [ ] 다른 submitted quote들 자동 decline 처리
- [ ] API: `POST /api/quotes/{quoteId}/decline`
  - [ ] Auth: 의뢰 소유자
  - [ ] Request: reason (선택)
  - [ ] Effect: state -> `declined`

### 8.4 견적 목록 및 비교 API

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] API: `GET /api/requests/{requestId}/quotes`
  - [ ] Auth: 의뢰 소유자
  - [ ] Query: state 필터, pagination
  - [ ] Response: quote list with supplier info
- [ ] API: `GET /api/supplier/quotes`
  - [ ] 내가 제출한 견적 목록 (supplier용)
  - [ ] 관련 의뢰 정보 포함
- [ ] Projection: `quote_comparison_view`
  - [ ] 비교용 read model
  - [ ] 단가, MOQ, 납기 기준 정렬 지원

### 8.5 견적 자동 생성 및 연동

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] Quote 제출 시 자동 Thread 생성
  - [ ] `MessageThread` 자동 생성 (quote submit 트리거)
  - [ ] 초기 메시지 자동 생성 (optional)
- [ ] Quote 상태 변경 이벤트
  - [ ] `QuoteSubmittedEvent` -> Thread 생성, Request quoteCount 증가
  - [ ] `QuoteSelectedEvent` -> Request closed, 다른 quotes declined
  - [ ] `QuoteWithdrawnEvent` -> quoteCount 감소

### 8.6 프론트엔드 견적 제출 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [ ] 견적 제출 페이지/모달 (`main-site` - supplier)
  - [ ] 단가, MOQ, 납기, 샘플 비용 입력
  - [ ] 비고 (선택)
  - [ ] 제출 전 확인
- [ ] 내 견적 관리 페이지
  - [ ] 제출한 견적 목록
  - [ ] 상태별 표시 (submitted/selected/withdrawn/declined)
  - [ ] 수정/철회 버튼 (submitted 상태에서만)

### 8.7 견적 비교 및 선택 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [ ] 견적 비교 페이지 (`main-site` - requester)
  - [ ] 테이블 형태 비교: 공급자, 단가, MOQ, 납기, 샘플비용
  - [ ] 정렬: 각 컬럼 기준 정렬
  - [ ] 선택/거절 버튼
- [ ] 견적 상세 모달
  - [ ] 공급자 정보 요약
  - [ ] 견적 내용 상세
  - [ ] "이 견적 선택" 버튼
- [ ] 선택 확인 모달
  - [ ] 선택 시 의뢰 종료됨 안내
  - [ ] 최종 확인 버튼

---

## 인수 완료 조건 (Acceptance Criteria)

- [ ] 승인된 공급자만 견적 제출 가능 (4037)
- [ ] 동일 의뢰에 중복 견적 제출 불가 (4095)
- [ ] closed/cancelled 의뢰에는 견적 제출 불가
- [ ] submitted 상태에서만 견적 수정 가능
- [ ] submitted 상태에서만 철회 가능
- [ ] 견적 선택 시 해당 의뢰 자동 종료
- [ ] 요청자는 자신 의뢰의 견적만 비교/선택 가능
- [ ] 견적 제출 시 메시지 스레드 자동 생성
- [ ] Swagger에서 모든 quote endpoints 문서화됨

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
