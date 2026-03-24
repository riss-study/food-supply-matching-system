# Task 05 - Admin Review Queue and Decision Actions

## 메인 Task 메타데이터

| 항목 | 값 |
|------|-----|
| **메인 Task ID** | 5 |
| **병렬 그룹** | Group B |
| **기간** | 2-3일 |
| **스토리 포인트** | 8 |
| **작업자** | Full-stack |
| **우선순위** | P1 |
| **상태** | 🟡 Partial |
| **Can Parallel** | YES |
| **Blocks** | Task 7, 10 |
| **Blocked By** | Task 1, 3, 4 |

---

## 개요

관리자가 공급자 검수 제출 건을 검토하고 승인/보류/반려 결정을 내리는 기능을 구현한다. 검수 큐 조회, 상세 보기, 결정 액션, 감사 추적을 포함한다. 일반 backoffice 범위 확장은 금지한다.

---

## 현재 진행 상태

- 메인 Task 상태: 🟡 Partial
- 메모: 2026-03-20 재감사 기준으로 hold 경로와 핵심 admin flow는 검증됐지만, 일부 queue/detail 필터/정렬/이력/UI 세부 항목은 근거 부족 또는 미구현으로 남겨둠.

| SubTask | 상태 | 메모 |
|---------|------|------|
| 5.1 | 🟡 Partial | approve/hold/reject와 audit는 확인됐지만 StartReview/SuspendReview 전용 구조는 확인되지 않음 |
| 5.2 | 🟡 Partial | queue date/sort filters와 reviewHistory는 구현됐지만 file download URL은 남음 |
| 5.3 | 🟡 Partial | approve/hold/reject API와 응답 예시는 보강됐지만 explicit event 발행 구조는 여전히 다름 |
| 5.4 | 🟢 Done | admin review projection과 audit log 구현 재검증 완료 |
| 5.5 | 🟢 Done | queue UI가 date/sort/pagination/status badge를 소비하도록 보강 완료 |
| 5.6 | 🟡 Partial | detail 화면에 review history는 추가됐지만 modal 기반 decision UX는 남음 |

---

## SubTask 목록

### 🟢 SubTask 5.1: 관리자 검수 도메인 모델

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] `AdminReview` aggregate
  - [ ] Fields: submissionId, supplierProfileId, state, reviewerId, reviewedAt, noteInternal, notePublic, reasonCode - 전용 aggregate 대신 submission/profile 조합으로 처리됨
  - [ ] State: `pending` -> `under_review` -> (`approved` | `hold` | `rejected` | `suspended`) - `under_review`/`suspended` 전용 흐름 미구현
- [x] Review decision commands
  - [ ] `StartReview` - 검수 시작
  - [x] `ApproveReview` - 승인
  - [x] `HoldReview` - 보류 (추가 서류 요청)
  - [x] `RejectReview` - 반려
  - [ ] `SuspendReview` - 활동 정지 (approved 상태에서)
- [x] Audit trail
  - [x] 각 결정마다 actor, timestamp, reason 기록

### 🟢 SubTask 5.2: 관리자 검수 큐 API

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] API: `GET /api/admin/reviews`
  - [x] Auth: role=admin
  - [x] Query params: state, fromDate, toDate, page, size, sort
  - [x] Response: review queue list with pendingDays
  - [x] Swagger: admin-server endpoint
- [x] API: `GET /api/admin/reviews/{reviewId}`
  - [x] 상세 조회: supplier profile, submitted files, review history
  - [x] noteInternal/notesPublic 포함
  - [ ] file download URLs 포함

### 🟢 SubTask 5.3: 검수 결정 액션 API

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] API: `POST /api/admin/reviews/{reviewId}/approve`
  - [x] Request: noteInternal (optional), notePublic (optional)
  - [x] Effects: supplier state -> `approved`, exposure -> `visible`
  - [ ] Event: `SupplierVerifiedEvent` 발행 - projection 직접 호출로 구현됨
- [x] API: `POST /api/admin/reviews/{reviewId}/hold`
  - [x] Request: noteInternal (optional), notePublic (required)
  - [x] Effects: supplier state -> `hold`
  - [x] notePublic 필수 (사용자 안내용)
- [x] API: `POST /api/admin/reviews/{reviewId}/reject`
  - [x] Request: noteInternal (optional), notePublic (required), reasonCode (optional)
  - [x] Effects: supplier state -> `rejected`
  - [x] notePublic 필수 (반려 사유 안내)
- [x] All APIs: Swagger documentation with response examples

### 🟢 SubTask 5.4: 프로젝션 및 감사 로그

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] Projection: `admin_review_queue_view`
  - [x] 검수 큐 표시용 read model
  - [x] pendingDays 계산
- [x] Projection: `admin_review_detail_view`
  - [x] 검수 상세용 read model
  - [x] supplier profile snapshot 포함
- [x] AuditLog 기록
  - [x] actor_user_id, action_type, target_type, target_id, payload_snapshot
  - [x] 모든 검수 결정 액션 기록

### 🟢 SubTask 5.5: 관리자 사이트 검수 큐 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [x] 검수 큐 목록 페이지 (`admin-site`)
  - [x] 테이블: 회사명, 상태, 제출일, 대기일수
  - [x] 필터: 상태별 필터링
  - [x] 정렬: 제출일, 대기일수
  - [x] Pagination
- [x] 검수 상태별 색상 표시
  - [x] submitted: yellow
  - [x] under_review: blue
  - [x] hold: orange
  - [x] approved: green
  - [x] rejected: red

### 🟢 SubTask 5.6: 검수 상세 및 결정 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [x] 검수 상세 페이지
  - [x] 공급자 프로필 정보 표시
  - [x] 제출된 파일 목록 및 미리보기
  - [x] 검수 이력 타임라인
- [x] 결정 액션 버튼
  - [ ] 승인: 승인 모달 + 남기는 메모 (선택)
  - [ ] 보류: 보류 모달 + 사용자 안내 메모 (필수)
  - [ ] 반려: 반려 모달 + 사유 선택 + 안내 메모 (필수)
- [x] 남기는 메모 입력 폼
  - [x] 남기는 메모 (납품용) - 선택
  - [x] 사용자 표시 메모 (필수 for hold/reject)

---

## 인수 완료 조건 (Acceptance Criteria)

- [x] 관리자가 검수 큐에서 제출 건을 목록/상세 조회 가능
- [ ] 승인 시 공급자 상태가 `approved`로 변경되고 검색에 노출됨 - approve 경로는 구현됐지만 이번 재감사에서 수동 E2E를 다시 실행하지 않음
- [x] 보류/반려 시 사용자 표시 메모가 필수로 입력되어야 함
- [x] 보류/반려 시 공급자 대시보드에 메모가 표시됨
- [x] 모든 결정 액션이 감사 로그에 기록됨
- [x] `admin-site`에서 검수 큐 UI로 전체 플로우 가능
- [x] Swagger에서 admin endpoints가 별도로 문서화됨

---

## 병렬 작업 구조

```
Backend:  [5.1 Domain] -> [5.2 Queue API] -> [5.3 Decision APIs]
                               -> [5.4 Projection/Audit]

Frontend: [5.5 Queue UI] -> [5.6 Detail/Decision UI]
```

---

## 의존성 매트릭스

| From | To | 관계 |
|------|-----|------|
| Task 1 | Task 5 | Foundation 필요 |
| Task 3 | Task 5 | Requester profile 확인 필요 |
| Task 4 | Task 5 | Supplier verification submission 필요 |
| Task 5 | Task 7 | Approved supplier가 request 참여 가능 |
| Task 5 | Task 10 | Approved supplier가 contact share 가능 |

---

## 리스크 및 완화 전략

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| 동시 검수 처리 | Medium | optimistic locking 또는 상태 체크로 중복 결정 방지 |
| 파일 미리보기 | Low | 이미지는 직접 표시, PDF는 다운로드 링크 제공 |
| 검수 권한 | Medium | admin role 체크, 본인이 한 결정은 본인만 수정 가능 (선택) |

---

## 산출물 (Artifacts)

### Backend
- `command-domain-supplier`: AdminReview aggregate
- `query-model-admin-review`: Review queue/detail read models
- `admin-server`: Review controller (admin endpoints)
- Projection: review queue/detail views
- AuditLog: review decision records
- Evidence: `.sisyphus/evidence/task-5-admin-review-queue.txt`

### Frontend
- `apps/admin-site`: Review queue page, review detail page
- `packages/ui`: Review status badge, file preview component

### 테스트 시나리오
- Happy path: pending -> under_review -> approved
- Hold path: pending -> under_review -> hold -> resubmit -> approved
- Reject path: pending -> under_review -> rejected -> resubmit -> approved
- Audit: all decisions recorded with timestamp and actor

---

## Commit

```
feat(plan): ADMIN-REVIEW-001 실행 계획 고정

- AdminReview aggregate with decision commands
- Review queue list/detail APIs
- Approve/Hold/Reject action endpoints
- Projection for admin review queue/detail views
- Admin-site review queue and decision UI
- Audit logging for all review decisions
```

---

**이전 Task**: [Task 4: Supplier Profile and Verification Submission](./phase1-task-04-supplier-verification.md)
**다음 Task**: [Task 6: Supplier Discovery and Read Models](./phase1-task-06-supplier-discovery.md)
