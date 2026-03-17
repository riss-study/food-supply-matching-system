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
| **상태** | 계획 중 |
| **Can Parallel** | YES |
| **Blocks** | Task 7, 10 |
| **Blocked By** | Task 1, 3, 4 |

---

## 개요

관리자가 공급자 검수 제출 건을 검토하고 승인/보류/반려 결정을 내리는 기능을 구현한다. 검수 큐 조회, 상세 보기, 결정 액션, 감사 추적을 포함한다. 일반 backoffice 범위 확장은 금지한다.

---

## SubTask 목록

### 5.1 관리자 검수 도메인 모델

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] `AdminReview` aggregate
  - [ ] Fields: submissionId, supplierProfileId, state, reviewerId, reviewedAt, noteInternal, notePublic, reasonCode
  - [ ] State: `pending` -> `under_review` -> (`approved` | `hold` | `rejected` | `suspended`)
- [ ] Review decision commands
  - [ ] `StartReview` - 검수 시작
  - [ ] `ApproveReview` - 승인
  - [ ] `HoldReview` - 보류 (추가 서류 요청)
  - [ ] `RejectReview` - 반려
  - [ ] `SuspendReview` - 활동 정지 (approved 상태에서)
- [ ] Audit trail
  - [ ] 각 결정마다 actor, timestamp, reason 기록

### 5.2 관리자 검수 큐 API

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] API: `GET /api/admin/reviews`
  - [ ] Auth: role=admin
  - [ ] Query params: state, fromDate, toDate, page, size, sort
  - [ ] Response: review queue list with pendingDays
  - [ ] Swagger: admin-server endpoint
- [ ] API: `GET /api/admin/reviews/{reviewId}`
  - [ ] 상세 조회: supplier profile, submitted files, review history
  - [ ] noteInternal/notesPublic 포함
  - [ ] file download URLs 포함

### 5.3 검수 결정 액션 API

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] API: `POST /api/admin/reviews/{reviewId}/approve`
  - [ ] Request: noteInternal (optional), notePublic (optional)
  - [ ] Effects: supplier state -> `approved`, exposure -> `visible`
  - [ ] Event: `SupplierVerifiedEvent` 발행
- [ ] API: `POST /api/admin/reviews/{reviewId}/hold`
  - [ ] Request: noteInternal (optional), notePublic (required)
  - [ ] Effects: supplier state -> `hold`
  - [ ] notePublic 필수 (사용자 안내용)
- [ ] API: `POST /api/admin/reviews/{reviewId}/reject`
  - [ ] Request: noteInternal (optional), notePublic (required), reasonCode (optional)
  - [ ] Effects: supplier state -> `rejected`
  - [ ] notePublic 필수 (반려 사유 안내)
- [ ] All APIs: Swagger documentation with response examples

### 5.4 프로젝션 및 감사 로그

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] Projection: `admin_review_queue_view`
  - [ ] 검수 큐 표시용 read model
  - [ ] pendingDays 계산
- [ ] Projection: `admin_review_detail_view`
  - [ ] 검수 상세용 read model
  - [ ] supplier profile snapshot 포함
- [ ] AuditLog 기록
  - [ ] actor_user_id, action_type, target_type, target_id, payload_snapshot
  - [ ] 모든 검수 결정 액션 기록

### 5.5 관리자 사이트 검수 큐 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [ ] 검수 큐 목록 페이지 (`admin-site`)
  - [ ] 테이블: 회사명, 상태, 제출일, 대기일수
  - [ ] 필터: 상태별 필터링
  - [ ] 정렬: 제출일, 대기일수
  - [ ] Pagination
- [ ] 검수 상태별 색상 표시
  - [ ] submitted: yellow
  - [ ] under_review: blue
  - [ ] hold: orange
  - [ ] approved: green
  - [ ] rejected: red

### 5.6 검수 상세 및 결정 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [ ] 검수 상세 페이지
  - [ ] 공급자 프로필 정보 표시
  - [ ] 제출된 파일 목록 및 미리보기
  - [ ] 검수 이력 타임라인
- [ ] 결정 액션 버튼
  - [ ] 승인: 승인 모달 + 남기는 메모 (선택)
  - [ ] 보류: 보류 모달 + 사용자 안내 메모 (필수)
  - [ ] 반려: 반려 모달 + 사유 선택 + 안내 메모 (필수)
- [ ] 남기는 메모 입력 폼
  - [ ] 남기는 메모 (납품용) - 선택
  - [ ] 사용자 표시 메모 (필수 for hold/reject)

---

## 인수 완료 조건 (Acceptance Criteria)

- [ ] 관리자가 검수 큐에서 제출 건을 목록/상세 조회 가능
- [ ] 승인 시 공급자 상태가 `approved`로 변경되고 검색에 노출됨
- [ ] 보류/반려 시 사용자 표시 메모가 필수로 입력되어야 함
- [ ] 보류/반려 시 공급자 대시보드에 메모가 표시됨
- [ ] 모든 결정 액션이 감사 로그에 기록됨
- [ ] `admin-site`에서 검수 큐 UI로 전체 플로우 가능
- [ ] Swagger에서 admin endpoints가 별도로 문서화됨

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
