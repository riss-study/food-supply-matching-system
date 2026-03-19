# Task 04 - Supplier Profile and Verification Submission

## 메인 Task 메타데이터

| 항목 | 값 |
|------|-----|
| **메인 Task ID** | 4 |
| **병렬 그룹** | Group B |
| **기간** | 3-4일 |
| **스토리 포인트** | 13 |
| **작업자** | Full-stack |
| **우선순위** | P1 |
| **상태** | 🟢 Done |
| **Can Parallel** | YES |
| **Blocks** | Task 5, 7, 10 |
| **Blocked By** | Task 1, 2 |

---

## 개요

공급자(supplier)가 프로필을 생성하고 검수 서류를 제출하는 기능을 구현한다. 공급자 프로필, 인증서 첨부, 검수 제출 상태 머신을 포함한다. 승인된 공급자만 검색에 노출되고 견적 제출이 가능하다.

---

## 현재 진행 상태

- 메인 Task 상태: 🟢 Done
- 메모: supplier profile/verification flow, frontend UI, approved-only visibility 규칙까지 구현 및 검증 완료.

| SubTask | 상태 | 메모 |
|---------|------|------|
| 4.1 | 🟢 Done | SupplierProfile / CertificationRecord / VerificationSubmission 모델 추가 |
| 4.2 | 🟢 Done | 공급자 프로필 CRUD API 구현 및 검증 완료 |
| 4.3 | 🟢 Done | local file storage adapter 및 multipart 업로드 구현 완료 |
| 4.4 | 🟢 Done | verification submission/latest API 구현 및 검증 완료 |
| 4.5 | 🟢 Done | approved => visible / draft => hidden search projection 검증 완료 |
| 4.6 | 🟢 Done | 공급자 프로필/검수 제출 UI 구현 및 자동 검증 완료 |
| 4.7 | 🟢 Done | 공급자 전용 route guard 및 상태 UI 구현 완료 |

---

## SubTask 목록

### 🟢 SubTask 4.1: 공급자 프로필 도메인 모델

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] `SupplierProfile` aggregate
  - [ ] Fields: supplierUserId, companyName, representativeName, region, categories[], equipmentSummary, monthlyCapacity, moq, oemAvailable, odmAvailable, rawMaterialSupport, packagingLabelingSupport, introduction, exposureState
  - [ ] State: `draft` -> `submitted` -> `under_review` -> (`approved` | `hold` | `rejected` | `suspended`)
- [ ] `CertificationRecord` entity
  - [ ] Fields: supplierProfileId, type, number, fileAttachmentId, status
- [ ] Command handlers
  - [ ] `CreateSupplierProfile`
  - [ ] `UpdateSupplierProfile` (draft/hold/rejected 상태에서만)

### 🟢 SubTask 4.2: 공급자 프로필 CRUD API

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] API: `POST /api/supplier/profile`
  - [ ] Auth: role=supplier
  - [ ] Validation: companyName (2-100자), categories (최소 1개), monthlyCapacity/moq (양수)
  - [ ] Initial state: `draft`, exposure: `hidden`
  - [ ] Swagger: request/response schema
- [ ] API: `GET /api/supplier/profile`
  - [ ] 내 공급자 프로필 조회 (certifications 포함)
- [ ] API: `PATCH /api/supplier/profile`
  - [ ] Partial update
  - [ ] approved 상태에서는 수정 불가 (403)

### 🟢 SubTask 4.3: 파일 첨부 시스템

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] `Attachment` 도메인 모델
  - [ ] Fields: ownerType, ownerId, fileName, contentType, fileSize, storageKey
- [ ] 파일 업로드 서비스
  - [ ] Storage adapter interface (local/S3 추상화)
  - [ ] 파일 유효성 검사 (형식: jpeg, png, pdf / 크기: 10MB)
- [ ] API: `POST /api/attachments` (multipart)
  - [ ] 파일 저장 및 metadata 반환
  - [ ] Swagger: multipart/form-data 명시

### 🟢 SubTask 4.4: 검수 제출 (Verification Submission)

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] `VerificationSubmission` aggregate
  - [ ] Fields: supplierProfileId, state, submittedAt, reviewedAt, reviewedBy, reviewNoteInternal, reviewNotePublic
  - [ ] State transitions per data-model.md
- [ ] API: `POST /api/supplier/verification-submissions`
  - [ ] multipart/form-data
  - [ ] Fields: businessRegistrationDoc (필수), certifications[] (선택), portfolioImages[] (선택)
  - [ ] Validation: 파일 형식/크기
  - [ ] State: `submitted`로 변경
- [ ] API: `GET /api/supplier/verification-submissions/latest`
  - [ ] 최신 제출 상태 조회
  - [ ] reviewNotePublic 포함 (사용자 표시용)

### 🟢 SubTask 4.5: 공급자 상태 노출 규칙

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] 노출 상태 관리
  - [x] `approved`일 때만 `exposureState = visible`
  - [x] 나머지 상태는 `hidden`
- [x] 상태 변경 이벤트 발행/갱신 경로
  - [x] approved/hidden visibility 반영 projection
  - [x] draft supplier 비노출 확인
- [x] Projection: supplier_search_view 갱신

### 🟢 SubTask 4.6: 프론트엔드 공급자 프로필 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [ ] 공급자 프로필 생성/수정 페이지
  - [ ] 카테고리 다중 선택 컴포넌트
  - [ ] OEM/ODM 체크박스
  - [ ] 지역 선택 (드롭다운)
- [ ] 파일 업로드 컴포넌트
  - [ ] 드래그 앤 드롭 지원
  - [ ] 업로드 진행률 표시
  - [ ] 파일 미리보기 (이미지)
- [ ] 검수 제출 화면
  - [ ] 사업자등록증 필수 업로드
  - [ ] 인증서 추가 업로드
  - [ ] 제출 전 확인 모달

### 🟢 SubTask 4.7: 공급자 대시보드 상태 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [ ] 검수 상태 표시
  - [ ] Status badge: draft, submitted, under_review, hold, approved, rejected
  - [ ] reviewNotePublic 표시 (hold/rejected 시)
- [ ] 상태별 CTA 버튼
  - [ ] draft: "검수 제출하기"
  - [ ] hold/rejected: "다시 제출하기"
  - [ ] approved: "프로필 보기"
- [ ] 프로필 완성도 게이지

---

## 인수 완료 조건 (Acceptance Criteria)

- [ ] 공급자가 프로필을 생성하면 `draft` 상태로 저장
- [ ] `draft/hold/rejected` 상태에서만 프로필 수정 가능
- [ ] 검수 제출 시 `submitted` 상태로 변경되고 파일 저장됨
- [x] `approved` 상태가 아니면 검색에 노출되지 않음
- [ ] 검수 상태에 따라 supplier dashboard에 다른 UI 노출
- [ ] 파일 업로드는 10MB 제한, jpeg/png/pdf만 허용
- [ ] Swagger에서 multipart upload 문서화됨

---

## 병렬 작업 구조

```
Backend:  [4.1 Domain] -> [4.2 CRUD API] -> [4.3 Attachment]
                               -> [4.4 Submission] -> [4.5 Exposure Rules]

Frontend: [4.6 Profile UI] + [4.7 Dashboard UI]
```

---

## 의존성 매트릭스

| From | To | 관계 |
|------|-----|------|
| Task 1 | Task 4 | Foundation 필요 |
| Task 2 | Task 4 | Auth context 필요 |
| Task 4 | Task 5 | Admin review에 submitted profile 필요 |
| Task 4 | Task 7 | Request lifecycle에 approved supplier 필요 |
| Task 4 | Task 10 | Contact share에 approved supplier 필요 |

---

## 리스크 및 완화 전략

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| 파일 저장소 선택 | Medium | Storage adapter 패턴으로 local/S3 추상화 |
| 대용량 파일 업로드 | Medium | 10MB 제한, chunked upload는 Phase 2로 연기 |
| 상태 머신 복잡성 | Medium | State enum으로 명시적 관리, invalid transition 예외 처리 |
| 인증서 유효성 검증 | Low | 현재는 파일 존재만 확인, 내용 검증은 관리자 몫 |

---

## 산출물 (Artifacts)

### Backend
- `command-domain-supplier`: SupplierProfile, CertificationRecord, VerificationSubmission aggregates
- `query-model-supplier`: Supplier profile read model
- `api-server`: Supplier profile controller, file upload controller
- Storage adapter interface + local implementation
- Projection: supplier verification state events
- Evidence: `.sisyphus/evidence/task-4-supplier-verification.txt`

### Frontend
- `apps/main-site`: Supplier profile pages, verification submission page
- `packages/ui`: File upload component, status badge, category multi-select

### 테스트 시나리오
- Happy path: create profile -> submit verification -> approved -> visible
- Denial path: submit -> hold -> resubmit -> approved
- Guard test: draft profile cannot quote (supplier not approved)

---

## Commit

```
feat(plan): SUPPLIER-VERIFICATION-001 실행 계획 고정

- SupplierProfile aggregate with full state machine
- CertificationRecord and file attachment system
- Verification submission with multipart upload
- Exposure state management (approved = visible)
- Frontend supplier profile and submission UI
- Status-based dashboard with review notes
```

---

**이전 Task**: [Task 3: Requester Business Approval Gate](./phase1-task-03-requester-approval-gate.md)
**다음 Task**: [Task 5: Admin Review Queue and Decision Actions](./phase1-task-05-admin-review-queue.md)
