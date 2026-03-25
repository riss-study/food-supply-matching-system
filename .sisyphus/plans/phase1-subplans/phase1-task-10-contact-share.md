# Task 10 - Contact-Share Consent

## 메인 Task 메타데이터

| 항목 | 값 |
|------|-----|
| **메인 Task ID** | 10 |
| **병렬 그룹** | Group D |
| **기간** | 2-3일 |
| **스토리 포인트** | 8 |
| **작업자** | Full-stack |
| **우선순위** | P1 |
| **상태** | 🟢 Done |
| **Can Parallel** | YES |
| **Blocks** | Task 11 |
| **Blocked By** | Task 1, 4, 9 |

---

## 개요

메시지 스레드 내에서 연락처 공유 동의를 요청, 승인, 철회하는 기능을 구현한다. 양측 동의 완료 시에만 연락처가 공개되며, 승인 후에는 철회 불가하다.

---

## 현재 진행 상태

- 메인 Task 상태: 🟢 Done
- 메모: 2026-03-24 기준으로 contact-share state machine, request/approve/revoke API, mutually-approved gated contact reveal, supplier contact 입력 경로, thread detail UI, 테스트/빌드 검증까지 완료.

| SubTask | 상태 | 메모 |
|---------|------|------|
| 10.1 | 🟢 Done | MessageThread embedded consent metadata와 state machine 구현 |
| 10.2 | 🟢 Done | request/approve/revoke contact-share API 및 전용 error contract 구현 |
| 10.3 | 🟢 Done | thread detail 응답에서 mutually_approved 시에만 sharedContact 공개 |
| 10.4 | 🟢 Done | thread projection state 동기화 및 read-time sharedContact 조합 구현 |
| 10.5 | 🟢 Done | thread detail contact-share 요청/승인/철회 UI 구현 |
| 10.6 | 🟢 Done | mutually_approved 시 연락처 공개 card 및 메시지 헤더 상태 UI 구현 |

---

## SubTask 목록

### 🔴 SubTask 10.1: 연락처 공유 도메인 모델

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] `ContactShareConsent` aggregate 또는 MessageThread의 embedded
  - [x] Fields: threadId, state, requestedBy, approvedByRequesterAt, approvedBySupplierAt, revokedBy, revokedAt
  - [x] State machine:
    ```
    not_requested -> requested -> one_side_approved -> mutually_approved
                              -> revoked
    one_side_approved -> revoked
    revoked -> requested (new cycle)
    ```
- [x] Command handlers
  - [x] `RequestContactShare`
  - [x] `ApproveContactShare`
  - [x] `RevokeContactShare`
- [x] Rules
  - [x] mutually_approved 이후 철회 불가
  - [x] bilateral reveal: 양측 모두 승인 시에만 공개
  - [x] revoke는 승인 전에만 가능

### 🔴 SubTask 10.2: 연락처 공유 API

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] API: `POST /api/threads/{threadId}/contact-share/request`
  - [x] Auth: thread 참여자
  - [x] Effect: state -> `requested`, requestedBy 설정
  - [x] Error: 이미 요청됨/승인됨 (4096)
- [x] API: `POST /api/threads/{threadId}/contact-share/approve`
  - [x] Auth: thread 참여자, 이번 cycle에서 아직 승인하지 않은 쪽
  - [x] Effect:
    - [x] 첫 승인: state -> `one_side_approved`, approvedByXAt 설정
    - [x] 양측 승인: state -> `mutually_approved`, 양측 연락처 공개
  - [x] Response: mutually_approved 시 sharedContact 포함
- [x] API: `POST /api/threads/{threadId}/contact-share/revoke`
  - [x] Auth: 요청자 (requestedBy)
  - [x] Effect: state -> `revoked`
  - [x] Error: mutually_approved 상태에서는 철회 불가 (4099 conflict)

### 🔴 SubTask 10.3: 연락처 공개 규칙

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] `GET /api/threads/{threadId}` 응답 규칙
  - [x] `not_requested`: 연락처 미포함
  - [x] `requested`: 연락처 미포함
  - [x] `one_side_approved`: 연락처 미포함
  - [x] `mutually_approved`: 양측 연락처 포함
  - [x] `revoked`: 연락처 미포함
- [x] 연락처 정보 구성
  - [x] requester: name, phone, email (BusinessProfile 기준)
  - [x] supplier: name, phone, email (SupplierProfile 기준)

### 🔴 SubTask 10.4: 연락처 공유 프로젝션

**작업자:** Backend  
**예상 소요:** 0.25일

- [x] Projection: thread_detail_view 업데이트
  - [x] contactShareState 포함
  - [x] read-time sharedContact composition을 위한 상태 동기화 유지
- [x] Projection update path
  - [x] request/approve/revoke 후 thread projection refresh 수행

### 🔴 SubTask 10.5: 연락처 공유 요청 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [x] 연락처 공유 요청 버튼
  - [x] `not_requested` 상태에서만 표시
  - [x] 클릭 시 확인 prompt
- [x] 요청 대기 상태 표시
  - [x] `requested` 상태: "연락처 공유 요청 중" 표시
  - [x] 내가 요청한 경우: 철회 버튼
  - [x] 상대가 요청한 경우: 승인 버튼
- [x] 일방 승인 상태
  - [x] `one_side_approved`: 역할별 대기 문구 표시

### 🔴 SubTask 10.6: 연락처 공개 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [x] 연락처 공개 화면
  - [x] `mutually_approved` 시 연락처 정보 표시 영역 노출
  - [x] 요청자 연락처: 이름, 전화번호, 이메일
  - [x] 공급자 연락처: 이름, 전화번호, 이메일
  - [x] "철회 불가" 안내 (mutually_approved는 철회 불가)
- [x] 메시지 UI 통합
  - [x] 연락처 공유 상태가 메시지 헤더에 표시
  - [x] 상호 승인 시 연락처가 메시지 상단에 표시

---

## 인수 완료 조건 (Acceptance Criteria)

- [x] 스레드 참여자가 연락처 공유 요청 가능
- [x] 요청 받은 쪽이 승인하면 `one_side_approved` 상태
- [x] 양측 모두 승인하면 `mutually_approved` 상태 및 연락처 공개
- [x] `mutually_approved` 이전에는 요청자가 철회 가능
- [x] `mutually_approved` 이후에는 철회 불가 (4099 conflict)
- [x] 연락처는 상호 승인 시에만 API 응답에 포함됨
- [x] Frontend에서 상태별로 적절한 UI 노출/숨김
- [x] Swagger에서 contact-share endpoints 문서화됨

---

## 병렬 작업 구조

```
Backend:  [10.1 Domain] -> [10.2 API] -> [10.3 Exposure Rules] -> [10.4 Projection]

Frontend: [10.5 Request UI] -> [10.6 Display UI]
```

---

## 의존성 매트릭스

| From | To | 관계 |
|------|-----|------|
| Task 1 | Task 10 | Foundation 필요 |
| Task 4 | Task 10 | Supplier profile에 연락처 정보 필요 |
| Task 9 | Task 10 | Thread 기준으로 contact share |
| Task 10 | Task 11 | Contact share 완료 후 stabilization |

---

## 리스크 및 완화 전략

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| 동시 승인 | Low | Timestamp 기록, 먼저 도달한 승인이 먼저 처리 |
| 연락처 정보 동기화 | Medium | Profile 변경 시 이미 공개된 연락처는 과거 버전 유지 또는 함께 업데이트 (정책 결정) |
| 철회 후 재요청 | Low | 새로운 ContactShareConsent 레코드 생성 (cycle 개념) |

---

## 산출물 (Artifacts)

### Backend
- `command-domain-thread`: ContactShareConsent (or part of MessageThread)
- `query-model-thread`: Thread detail with contact share state
- `api-server`: Contact share controller
- Projection: contact share state events

### Frontend
- `apps/main-site`: Contact share request/approve/revoke UI in thread
- `packages/ui`: Contact share status indicator, contact display card

### 테스트 시나리오
- Happy path: request -> approve -> approve -> mutually approved -> contacts visible
- Revoke path: request -> revoke -> new request -> approve -> approve
- Denial: revoke after mutual approval (4099)
- Exposure: contacts only visible in mutually_approved state

---

## Commit

```
feat(plan): CONTACT-SHARE-001 실행 계획 고정

- ContactShareConsent state machine
- Request/Approve/Revoke APIs
- Bilateral reveal rule (mutually_approved only)
- Post-approval non-revocation enforcement
- Frontend contact share request and display UI
```

---

**이전 Task**: [Task 9: Message Threads, Attachments, Read State](./phase1-task-09-message-threads.md)
**다음 Task**: [Task 11: Admin Notices, Stats and Stabilization](./phase1-task-11-admin-notices-stabilization.md)
