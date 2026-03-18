# Task 09 - Message Threads, Attachments, Read State

## 메인 Task 메타데이터

| 항목 | 값 |
|------|-----|
| **메인 Task ID** | 9 |
| **병렬 그룹** | Group D |
| **기간** | 3-4일 |
| **스토리 포인트** | 13 |
| **작업자** | Full-stack |
| **우선순위** | P1 |
| **상태** | 🔴 Not Started |
| **Can Parallel** | YES |
| **Blocks** | Task 10, 11 |
| **Blocked By** | Task 1, 7, 8 |

---

## 개요

의뢰와 견적 기반으로 메시지 스레드가 생성되고, 참여자 간 메시지 교환, 파일 첨부, 읽음 상태를 구현한다. real-time transport는 전제하지 않는다.

---

## 현재 진행 상태

- 메인 Task 상태: 🔴 Not Started
- 메모: 선행 task 완료 후 시작 예정.

| SubTask | 상태 | 메모 |
|---------|------|------|
| 9.1 | 🔴 Not Started | 미착수 |
| 9.2 | 🔴 Not Started | 미착수 |
| 9.3 | 🔴 Not Started | 미착수 |
| 9.4 | 🔴 Not Started | 미착수 |
| 9.5 | 🔴 Not Started | 미착수 |
| 9.6 | 🔴 Not Started | 미착수 |
| 9.7 | 🔴 Not Started | 미착수 |

---

## SubTask 목록

### 🔴 SubTask 9.1: 메시지 스레드 도메인 모델

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] `MessageThread` aggregate
  - [ ] Fields: requestId, requesterUserId, supplierProfileId, contactShareState
  - [ ] 유니크 제약: (requestId, requesterUserId, supplierProfileId)
  - [ ] Creation triggers: quote submit, requester manual create
- [ ] `Message` entity
  - [ ] Fields: threadId, senderUserId, body, readAt, createdAt
  - [ ] Soft delete 미지원 (Phase 1)
- [ ] Command handlers
  - [ ] `CreateThread` (quote submit 시 자동, 또는 수동)
  - [ ] `SendMessage`
  - [ ] `MarkThreadAsRead`
- [ ] Participant validation
  - [ ] thread 참여자만 메시지 전송 가능
  - [ ] 관리자는 감사 목적으로 읽기만 가능

### 🔴 SubTask 9.2: 스레드 생성 규칙

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] Quote 제출 시 자동 스레드 생성
  - [ ] Quote submit handler에서 thread 생성 호출
  - [ ] 이미 존재하는 스레드면 기존 것 반환 (4094)
- [ ] 요청자 수동 스레드 생성
  - [ ] API: `POST /api/requests/{requestId}/threads`
  - [ ] Body: supplierId
  - [ ] 유효성: approved supplier 대상만
- [ ] Thread uniqueness guard
  - [ ] 동일 (request, requester, supplier) 조합 1개만
  - [ ] Duplicate 시 기존 threadId 반환

### 🔴 SubTask 9.3: 메시지 API

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] API: `GET /api/threads`
  - [ ] 내가 참여 중인 스레드 목록
  - [ ] Query: unreadOnly, pagination
  - [ ] Response: thread summary with lastMessage, unreadCount
- [ ] API: `GET /api/threads/{threadId}`
  - [ ] 스레드 상세 및 메시지 목록
  - [ ] Auth: thread 참여자만
  - [ ] Pagination: messages (desc order)
  - [ ] Response: messages[], contactShareState, sharedContact (if mutually approved)
- [ ] API: `POST /api/threads/{threadId}/messages`
  - [ ] 메시지 전송
  - [ ] Body: body, attachmentIds[]
  - [ ] Validation: body 또는 attachmentIds 중 하나는 필수
  - [ ] Swagger: request/response 예시

### 🔴 SubTask 9.4: 파일 첨부 및 읽음 처리

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] API: `POST /api/threads/{threadId}/attachments`
  - [ ] multipart/form-data
  - [ ] 파일 제약: 10MB, image/jpeg, image/png, image/gif, application/pdf
  - [ ] Response: attachmentId, url
- [ ] API: `POST /api/threads/{threadId}/read`
  - [ ] 스레드 읽음 처리
  - [ ] Effect: 해당 thread의 unread messages -> readAt 설정
  - [ ] Response: unreadCount = 0
- [ ] Attachment 연동
  - [ ] Message에 attachmentIds 포함
  - [ ] Attachment 메타데이터 반환

### 🔴 SubTask 9.5: 스레드 및 메시지 프로젝션

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] Projection: `thread_summary_view`
  - [ ] 목록용 read model
  - [ ] lastMessage, unreadCount 포함
  - [ ] otherParty 정보 포함
- [ ] Projection: `thread_detail_view`
  - [ ] 상세용 read model
  - [ ] messages[], contactShareState 포함
- [ ] Event consumers
  - [ ] `MessageSentEvent`: thread_summary_view 업데이트
  - [ ] `ThreadMarkedAsReadEvent`: unreadCount 갱신

### 🔴 SubTask 9.6: 메시지 목록 및 상세 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [ ] 메시지 목록 페이지 (`main-site`)
  - [ ] 스레드 목록: 의뢰 제목, 상대방, 마지막 메시지, 읽지 않은 개수
  - [ ] 읽지 않은 스레드 강조 표시
  - [ ] 정렬: 마지막 메시지 시간
- [ ] 메시지 상세/대화 페이지
  - [ ] 대화 내용 표시 (시간순)
  - [ ] 상대방/본인 메시지 구분 (bubble style)
  - [ ] 첨부 파일 표시 (이미지 미리보기, 파일 다운로드)
  - [ ] 입력 폼: 텍스트 + 파일 첨부

### 🔴 SubTask 9.7: 파일 업로드 및 미리보기

**작업자:** Frontend  
**예상 소요:** 0.5일

- [ ] 파일 첨부 컴포넌트
  - [ ] 드래그 앤 드롭
  - [ ] 파일 선택 버튼
  - [ ] 업로드 중 인디케이터
  - [ ] 첨부 목록 표시
- [ ] 이미지 미리보기
  - [ ] 대화 내 이미지 썸네일
  - [ ] 클릭 시 확대 보기 (lightbox)
- [ ] 파일 다운로드
  - [ ] PDF 등 비이미지 파일 다운로드 버튼

---

## 인수 완료 조건 (Acceptance Criteria)

- [ ] Quote 제출 시 자동으로 메시지 스레드 생성됨
- [ ] 요청자가 수동으로 특정 공급자와 스레드 생성 가능
- [ ] 스레드 참여자만 메시지 전송/조회 가능 (403)
- [ ] 메시지는 텍스트 또는 첨부 파일 포함 가능
- [ ] 파일 첨부는 10MB 제한, 지정된 형식만 허용
- [ ] 읽음 처리 시 해당 스레드의 unreadCount가 0이 됨
- [ ] 스레드 목록에서 마지막 메시지와 읽지 않은 개수 확인 가능
- [ ] 연락처는 상호 동의 전까지 메시지 UI에 표시되지 않음
- [ ] Swagger에서 thread/message endpoints 문서화됨

---

## 병렬 작업 구조

```
Backend:  [9.1 Domain] -> [9.2 Creation Rules] -> [9.3 Message API] + [9.4 Attachments]
                               -> [9.5 Projection]

Frontend: [9.6 Thread/Message UI] + [9.7 File Upload/Preview]
```

---

## 의존성 매트릭스

| From | To | 관계 |
|------|-----|------|
| Task 1 | Task 9 | Foundation 필요 |
| Task 7 | Task 9 | Request 기준으로 thread 생성 |
| Task 8 | Task 9 | Quote submit 시 thread 자동 생성 |
| Task 9 | Task 10 | Thread 기준으로 contact share |
| Task 9 | Task 11 | Messaging 완료 후 stabilization |

---

## 리스크 및 완화 전략

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| Thread 생성 중복 | Medium | unique constraint, existing thread 반환 |
| 파일 저장소 비용 | Medium | 10MB 제한, local storage는 개발용, S3는 프로덕션 |
| 메시지 순서 | Low | createdAt 기준 정렬, pagination cursor 사용 |
| 동시 읽음 처리 | Low | optimistic locking 없이 last readAt 업데이트 |

---

## 산출물 (Artifacts)

### Backend
- `command-domain-thread`: MessageThread, Message aggregates
- `query-model-thread`: Thread summary/detail views
- `api-server`: Thread controller, message controller
- File upload service with storage adapter
- Projection: thread/message events

### Frontend
- `apps/main-site`: Thread list page, thread detail/conversation page
- `packages/ui`: Message bubble, file attachment, thread list item

### 테스트 시나리오
- Happy path: quote submit -> auto thread created -> exchange messages
- Manual thread: requester creates thread with supplier -> messages
- Denial: non-participant cannot send message (403)
- Attachment: upload file -> send message with attachment -> preview

---

## Commit

```
feat(plan): THREAD-001 실행 계획 고정

- MessageThread and Message aggregates
- Automatic thread creation on quote submit
- Manual thread creation by requester
- Send message with text/attachments
- Thread read state management
- File upload with size/type validation
- Frontend thread list and conversation UI
```

---

**이전 Task**: [Task 8: Quote Lifecycle and Comparison](./phase1-task-08-quote-lifecycle.md)
**다음 Task**: [Task 10: Contact-Share Consent](./phase1-task-10-contact-share.md)
