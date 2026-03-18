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
| **상태** | 🔴 Not Started |
| **Can Parallel** | YES |
| **Blocks** | Task 11 |
| **Blocked By** | Task 1, 4, 9 |

---

## 개요

메시지 스레드 내에서 연락처 공유 동의를 요청, 승인, 철회하는 기능을 구현한다. 양측 동의 완료 시에만 연락처가 공개되며, 승인 후에는 철회 불가하다.

---

## 현재 진행 상태

- 메인 Task 상태: 🔴 Not Started
- 메모: 선행 task 완료 후 시작 예정.

| SubTask | 상태 | 메모 |
|---------|------|------|
| 10.1 | 🔴 Not Started | 미착수 |
| 10.2 | 🔴 Not Started | 미착수 |
| 10.3 | 🔴 Not Started | 미착수 |
| 10.4 | 🔴 Not Started | 미착수 |
| 10.5 | 🔴 Not Started | 미착수 |
| 10.6 | 🔴 Not Started | 미착수 |

---

## SubTask 목록

### 🔴 SubTask 10.1: 연락처 공유 도메인 모델

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] `ContactShareConsent` aggregate 또는 MessageThread의 embedded
  - [ ] Fields: threadId, state, requestedBy, approvedByRequesterAt, approvedBySupplierAt, revokedBy, revokedAt
  - [ ] State machine:
    ```
    not_requested -> requested -> one_side_approved -> mutually_approved
                              -> revoked
    one_side_approved -> revoked
    revoked -> requested (new cycle)
    ```
- [ ] Command handlers
  - [ ] `RequestContactShare`
  - [ ] `ApproveContactShare`
  - [ ] `RevokeContactShare`
- [ ] Rules
  - [ ] mutually_approved 이후 철회 불가
  - [ ] bilateral reveal: 양측 모두 승인 시에만 공개
  - [ ] revoke는 승인 전에만 가능

### 🔴 SubTask 10.2: 연락처 공유 API

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] API: `POST /api/threads/{threadId}/contact-share/request`
  - [ ] Auth: thread 참여자
  - [ ] Effect: state -> `requested`, requestedBy 설정
  - [ ] Error: 이미 요청됨/승인됨 (4096)
- [ ] API: `POST /api/threads/{threadId}/contact-share/approve`
  - [ ] Auth: thread 참여자, 요청자가 아닌 쪽
  - [ ] Effect:
    - [ ] 첫 승인: state -> `one_side_approved`, approvedByXAt 설정
    - [ ] 양측 승인: state -> `mutually_approved`, 양측 연락처 공개
  - [ ] Response: mutually_approved 시 sharedContact 포함
- [ ] API: `POST /api/threads/{threadId}/contact-share/revoke`
  - [ ] Auth: 요청자 (requestedBy)
  - [ ] Effect: state -> `revoked`
  - [ ] Error: mutually_approved 상태에서는 철회 불가 (4039)

### 🔴 SubTask 10.3: 연락처 공개 규칙

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] `GET /api/threads/{threadId}` 응답 규칙
  - [ ] `not_requested`: 연락처 미포함
  - [ ] `requested`: 연락처 미포함
  - [ ] `one_side_approved`: 연락처 미포함
  - [ ] `mutually_approved`: 양측 연락처 포함
  - [ ] `revoked`: 연락처 미포함
- [ ] 연락처 정보 구성
  - [ ] requester: name, phone, email (BusinessProfile 기준)
  - [ ] supplier: name, phone, email (SupplierProfile 기준)

### 🔴 SubTask 10.4: 연락처 공유 프로젝션

**작업자:** Backend  
**예상 소요:** 0.25일

- [ ] Projection: thread_detail_view 업데이트
  - [ ] contactShareState 포함
  - [ ] mutually_approved 시 sharedContact 포함
- [ ] Event consumers
  - [ ] `ContactShareRequestedEvent`
  - [ ] `ContactShareApprovedEvent`
  - [ ] `ContactShareRevokedEvent`

### 🔴 SubTask 10.5: 연락처 공유 요청 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [ ] 연락처 공유 요청 버튼
  - [ ] `not_requested` 상태에서만 표시
  - [ ] 클릭 시 확인 모달
- [ ] 요청 대기 상태 표시
  - [ ] `requested` 상태: "연락처 공유 요청 중" 표시
  - [ ] 내가 요청한 경우: 철회 버튼
  - [ ] 상대가 요청한 경우: 승인 버튼
- [ ] 일방 승인 상태
  - [ ] `one_side_approved`: "상대방 승인 대기 중" 또는 "승인 완료, 상대방 대기 중"

### 🔴 SubTask 10.6: 연락처 공개 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [ ] 연락처 공개 화면
  - [ ] `mutually_approved` 시 연락처 정보 표시 영역 노출
  - [ ] 요청자 연락처: 이름, 전화번호, 이메일
  - [ ] 공급자 연락처: 이름, 전화번호, 이메일
  - [ ] "철회 불가" 안내 (mutually_approved는 철회 불가)
- [ ] 메시지 UI 통합
  - [ ] 연락처 공유 상태가 메시지 헤더에 표시
  - [ ] 상호 승인 시 연락처가 메시지 상단에 표시

---

## 인수 완료 조건 (Acceptance Criteria)

- [ ] 스레드 참여자가 연락처 공유 요청 가능
- [ ] 요청 받은 쪽이 승인하면 `one_side_approved` 상태
- [ ] 양측 모두 승인하면 `mutually_approved` 상태 및 연락처 공개
- [ ] `mutually_approved` 이전에는 요청자가 철회 가능
- [ ] `mutually_approved` 이후에는 철회 불가 (4039)
- [ ] 연락처는 상호 승인 시에만 API 응답에 포함됨
- [ ] Frontend에서 상태별로 적절한 UI 노출/숨김
- [ ] Swagger에서 contact-share endpoints 문서화됨

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
- Denial: revoke after mutual approval (4039)
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
