# Task 03 - Requester Business Approval Gate

## 메인 Task 메타데이터

| 항목 | 값 |
|------|-----|
| **메인 Task ID** | 3 |
| **병렬 그룹** | Group B |
| **기간** | 2-3일 |
| **스토리 포인트** | 8 |
| **작업자** | Full-stack |
| **우선순위** | P1 |
| **상태** | 🟢 Done |
| **Can Parallel** | YES |
| **Blocks** | Task 6, 7 |
| **Blocked By** | Task 1, 2 |

---

## 개요

요청자(requester)가 의뢰를 등록하기 위한 사업자 승인 게이트를 구현한다. 요청자는 사업자 정보를 제출하고, 관리자 승인을 받아야만 의뢰 생성 권한을 획득한다. 상태 머신과 승인/반려 플로우를 포함한다.

---

## 현재 진행 상태

- 메인 Task 상태: 🟢 Done
- 메모: 구현, 자동/수동 검증, approval gate `4034` 확인까지 완료.

| SubTask | 상태 | 메모 |
|---------|------|------|
| 3.1 | 🟢 Done | BusinessProfile aggregate 확장 및 상태 모델 보강 완료 |
| 3.2 | 🟢 Done | 제출 API와 duplicate/role guard 구현 및 검증 완료 |
| 3.3 | 🟢 Done | 조회/수정 API와 상태별 수정 제약 구현 및 검증 완료 |
| 3.4 | 🟢 Done | RequesterApprovalGuard와 실제 `POST /api/requests` 4034 enforcement 확인 완료 |
| 3.5 | 🟢 Done | 사업자 정보 등록/관리 UI와 상태 표시 구현 및 브라우저 검증 완료 |
| 3.6 | 🟢 Done | `/requests/new` 접근 시 미승인 requester redirect gate 구현 완료 |

---

## SubTask 목록

### 🟢 SubTask 3.1: 사업자 프로필 도메인 모델

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] `BusinessProfile` aggregate
  - [x] Fields: userAccountId, businessName, businessRegistrationNumber, contactName, contactPhone, contactEmail, verificationScope, approvalState
  - [x] State machine: `not_submitted` -> `submitted` -> (`approved` | `rejected`)
- [x] Command handlers
  - [x] `SubmitBusinessProfile`
  - [x] `UpdateBusinessProfile` (submitted/rejected 상태에서만)
- [x] Invariants
  - [x] 사업자등록번호 형식 검증
  - [x] 이미 승인된 프로필은 수정 불가

### 🟢 SubTask 3.2: 사업자 정보 제출 API

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] API: `POST /api/requester/business-profile`
  - [x] Auth: role=requester
  - [x] Validation: businessName (2-100자), businessRegistrationNumber (형식), contact fields
  - [x] Swagger annotation with error codes
- [x] Duplicate submission guard
  - [x] 하나의 계정당 하나의 active business profile
  - [x] 이미 submitted/approved 상태면 reject

### 🟢 SubTask 3.3: 사업자 정보 조회/수정 API

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] API: `GET /api/requester/business-profile`
  - [x] 내 사업자 정보 조회
  - [x] 상태 및 승인/반려 이력 포함
- [x] API: `PATCH /api/requester/business-profile`
  - [x] submitted/rejected 상태에서만 수정 가능
  - [x] Partial update 지원
  - [x] Swagger: 상태별 수정 가능 필드 명시

### 🟢 SubTask 3.4: 승인 게이트 강제

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] `RequesterApprovalGuard` 구현
  - [x] `approved` 상태가 아니면 의뢰 생성 API 호출 거부
  - [x] Error code: `4034` (Business approval required)
- [x] `GET /api/me` 응답에 `businessApprovalState` 포함
- [x] Projection: business profile 상태 변경 이벤트 발행/갱신 경로 구현

### 🟢 SubTask 3.5: 프론트엔드 사업자 등록 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [x] 사업자 정보 등록 페이지
  - [x] 입력 폼: 상호명, 사업자등록번호, 담당자 정보
  - [x] 검증: 사업자등록번호 형식 실시간 체크
- [x] 사업자 정보 관리 페이지
  - [x] 현재 상태 표시 (submitted/approved/rejected)
  - [x] 수정 가능한 상태에서만 수정 버튼 활성화
- [x] 승인 대기 상태 UI
  - [x] "승인 대기 중" 안내 메시지
  - [x] 승인 완료 시 알림/리다이렉트

### 🟢 SubTask 3.6: 상태별 화면 제어

**작업자:** Frontend  
**예상 소요:** 0.5일

- [x] 승인되지 않은 요청자 화면 제한
  - [x] 의뢰 생성 버튼 숨김 또는 비활성화
  - [x] "사업자 승인 필요" CTA 노출
- [x] Route guard
  - [x] `/requests/new` 접근 시 승인 상태 체크
  - [x] 미승인 시 사업자 등록 페이지로 리다이렉트

---

## 인수 완료 조건 (Acceptance Criteria)

- [x] 요청자가 사업자 정보를 제출하면 `submitted` 상태로 저장
- [x] `submitted` 또는 `rejected` 상태에서만 정보 수정 가능
- [x] `approved` 상태가 아니면 의뢰 생성 API 호출 시 `4034` 에러 반환
- [x] Frontend에서 승인 상태에 따라 의뢰 생성 버튼이 활성화/비활성화됨
- [x] `GET /api/me`에서 현재 사업자 승인 상태 확인 가능
- [x] Swagger에서 상태별 API 접근 제어 문서화됨

---

## 병렬 작업 구조

```
Backend:  [3.1 Domain] -> [3.2 Submit API] -> [3.3 Read/Update API]
                                      -> [3.4 Approval Guard]

Frontend: [3.5 UI Component] -> [3.6 Route Guard]
```

**통합:** API 완료 후 Frontend 연동

---

## 의존성 매트릭스

| From | To | 관계 |
|------|-----|------|
| Task 1 | Task 3 | Foundation 완료 필요 |
| Task 2 | Task 3 | Auth context 필요 |
| Task 3 | Task 6 | Request lifecycle에 approval gate 필요 |
| Task 3 | Task 7 | Quote 비교에 approved requester 필요 |
| Task 3 | Task 5 | Admin review에 제출된 profile 필요 |

---

## 리스크 및 완화 전략

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| 사업자등록번호 검증 | Medium | Regex 패턴 적용, 향후 API 연계 가능하도록 확장 포인트预留 |
| 승인 상태 동기화 | Medium | Projection으로 read model 동기화, eventual consistency 허용 |
| 반려 사유 전달 | Low | reject 시 notePublic 필드로 사용자 안내 메시지 전달 |

---

## 산출물 (Artifacts)

### Backend
- `command-domain-user`: BusinessProfile aggregate
- `query-model-user`: BusinessProfile read model
- `api-server`: Business profile controller, approval guard
- Projection: business profile state change events
- Evidence: `.sisyphus/evidence/task-3-requester-approval-gate.txt`

### Frontend
- `apps/main-site`: Business profile registration/management pages
- `packages/ui`: Status badge component (submitted/approved/rejected)

### 테스트 시나리오
- Happy path: submit -> approve -> create request
- Denial path: submit -> reject -> resubmit
- Guard test: unapproved requester cannot create request (4034)

---

## Commit

```
feat(plan): REQUESTER-APPROVAL-001 실행 계획 고정

- BusinessProfile aggregate with state machine
- Submit/Update/Read business profile APIs
- Approval gate enforcement (4034 error)
- Frontend business profile registration UI
- State-based UI controls for unapproved requesters
```

---

**이전 Task**: [Task 2: Auth and Role Skeleton](./phase1-task-02-auth-role-skeleton.md)
**다음 Task**: [Task 4: Supplier Profile and Verification Submission](./phase1-task-04-supplier-verification.md)
