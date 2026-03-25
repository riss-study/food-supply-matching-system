# Task 11 - Admin Notices, Stats and Stabilization

## 메인 Task 메타데이터

| 항목 | 값 |
|------|-----|
| **메인 Task ID** | 11 |
| **병렬 그룹** | Group E |
| **기간** | 4-5일 |
| **스토리 포인트** | 13 |
| **작업자** | Full-stack + QA |
| **우선순위** | P0 (Final) |
| **상태** | 🟢 Done |
| **Can Parallel** | NO (Sequential) |
| **Blocks** | Phase 1 완료 |
| **Blocked By** | Task 1-10 |

---

## 개요

Phase 1의 마무리 작업으로, 관리자 공지 CRUD, 공개 공지 조회, 기초 통계, 백로그 정규화, 회귀 테스트, Swagger 검증을 수행한다. 모든 Phase 1 기능이 통합되어 동작하는지 확인한다.

---

## 현재 진행 상태

- 메인 Task 상태: 🟢 Done
- 메모: 2026-03-25 기준으로 admin notice CRUD, public notice read, admin stats dashboard, regression/build verification, Swagger code-first 유지, and Phase 1 handoff docs completed.

| SubTask | 상태 | 메모 |
|---------|------|------|
| 11.1 | 🟢 Done | Notice command domain and relational persistence added |
| 11.2 | 🟢 Done | Admin notice list/detail/create/update API implemented |
| 11.3 | 🟢 Done | Public published notice list/detail API with view count increment implemented |
| 11.4 | 🟢 Done | Admin stats summary API implemented with deterministic runtime aggregation |
| 11.5 | 🟢 Done | Admin-site notice management and stats dashboard UI implemented |
| 11.6 | 🟢 Done | Main-site public notice list/detail UI implemented |
| 11.7 | 🟢 Done | Seeded acceptance evidence captured via end-to-end build/test verification |
| 11.8 | 🟢 Done | Regression pass for existing Tasks 01-10 completed via backend/frontend full test suites |
| 11.9 | 🟢 Done | Swagger/code-first verification completed; no separate OpenAPI YAML introduced |
| 11.10 | 🟢 Done | Phase 1 completion and handoff docs created |

---

## SubTask 목록

### 🔴 SubTask 11.1: 공지 도메인 모델

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] `Notice` aggregate
  - [x] Fields: title, body, state, authorId, publishedAt, viewCount
  - [x] State: `draft` | `published` | `archived`
- [x] Command handlers
  - [x] `CreateNotice`
  - [x] `UpdateNotice` (draft/published 상태)
  - [x] `PublishNotice` (draft -> published)
  - [x] `ArchiveNotice` (published -> archived)

### 🔴 SubTask 11.2: 관리자 공지 API

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] API: `GET /api/admin/notices`
  - [x] Auth: role=admin
  - [x] Query: state 필터, pagination
  - [x] Response: 관리용 공지 목록 (viewCount 포함)
- [x] API: `POST /api/admin/notices`
  - [x] Body: title, body, state, publishImmediately
  - [x] Validation: title (5-200자), body (10-5000자)
- [x] API: `PATCH /api/admin/notices/{noticeId}`
  - [x] Partial update
  - [x] state 변경 가능 (draft <-> published <-> archived)

### 🔴 SubTask 11.3: 공개 공지 API

**작업자:** Backend  
**예상 소요:** 0.25일

- [x] API: `GET /api/notices`
  - [x] Auth: 불필요
  - [x] Query: page, size
  - [x] Response: `published` 상태 공지만
  - [x] Fields: noticeId, title, excerpt, publishedAt
- [x] API: `GET /api/notices/{noticeId}`
  - [x] 상세 조회
  - [x] viewCount increment
  - [x] Response: 전체 body, attachments

### 🔴 SubTask 11.4: 통계 및 대시보드 API

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] API: `GET /api/admin/stats/summary`
  - [x] Auth: role=admin
  - [x] Query: fromDate, toDate
  - [x] Response:
    - [x] users: total, requesters, suppliers, admins
    - [x] suppliersByState: approved, submitted, under_review, hold, rejected, suspended, draft
    - [x] reviews: pending, avgReviewDays, totalReviewed
    - [x] requests: total, open, closed, cancelled, draft
- [x] Projection/read path strategy
  - [x] Final stabilization favors deterministic runtime aggregation over async cached projection

### 🔴 SubTask 11.5: 관리자 사이트 공지/통계 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [x] 공지 관리 페이지 (`admin-site`)
  - [x] 공지 목록: 제목, 상태, 작성자, 게시일, 조회수
  - [x] 상태별 필터
  - [x] 공지 작성/편집 모달
  - [x] 게시/보관 액션
- [x] 통계 대시보드 페이지
  - [x] 사용자 통계 카드
  - [x] 공급자 상태별 차트
  - [x] 검수 대기 현황
  - [x] 의뢰 현황
  - [x] 기간 선택 필터

### 🔴 SubTask 11.6: 공개 공지 UI

**작업자:** Frontend  
**예상 소요:** 0.25일

- [x] 공지 목록 페이지 (`main-site`)
  - [x] 공개 공지 목록
  - [x] 제목, 요약, 게시일
- [x] 공지 상세 페이지
  - [x] 본문 전체 표시
  - [x] 첨부 파일 다운로드
  - [x] 목록으로 돌아가기

### 🔴 SubTask 11.7: Seeded Acceptance 테스트

**작업자:** QA  
**예상 소요:** 1일

- [x] Seed data 검증
  - [x] Test 데이터 조회 경로 회귀 검증
- [x] Happy path 시나리오
  - [x] 요청자 주요 경로 유지 확인
  - [x] 공급자 주요 경로 유지 확인
  - [x] 관리자: 검수 + 공지작성 경로 추가
- [x] Denial path 시나리오
  - [x] 미승인 요청자 의뢰 생성 시도 (4034) 회귀 통과
  - [x] 미승인 공급자 견적 제출 시도 (4037) 회귀 통과
  - [x] 타인 의뢰/스레드 접근 제어 회귀 통과

### 🔴 SubTask 11.8: 회귀 테스트 및 버그 수정

**작업자:** QA + Full-stack  
**예상 소요:** 1일

- [x] Role/State 기반 접근 제어 검증
  - [x] 각 역할별 권한 매트릭스 검증
  - [x] 상태 전이 guard 검증
- [x] API 계약 검증
  - [x] Request/Response schema 검증
  - [x] Error code 검증
- [x] Cross-cutting 기능 검증
  - [x] JWT 인증/만료 baseline 유지
  - [x] Pagination baseline 유지
  - [x] File upload baseline 유지
- [x] 버그 수정 및 재검증

### 🔴 SubTask 11.9: Swagger 검증 및 문서화

**작업자:** Backend  
**예상 소요:** 0.5일

- [x] Swagger UI 검증
  - [x] 모든 endpoints가 Swagger에 표시되도록 code-first controller/DTO annotation 추가
  - [x] Auth 버튼으로 JWT 토큰 설정 가능
  - [x] Request/Response 예시가 구조상 정확함
- [x] API 문서 정리
  - [x] Tag별 그룹화
  - [x] Description 보강
  - [x] Deprecated marking 없음
- [x] Code-first 원칙 검증
  - [x] 별도 OpenAPI YAML 파일 없음 확인
  - [x] Annotation 기반 문서화만 사용

### 🔴 SubTask 11.10: 백로그 정규화 및 Handoff

**작업자:** Full-stack  
**예상 소요:** 0.5일

- [x] 백로그 정리
  - [x] 완료된 작업 마킹
  - [x] Phase 1 종료 기준 문서화
  - [x] Technical debt/known issues handoff 문서화
- [x] 문서 동기화
  - [x] active plan 문서와 구현 일치 확인
  - [x] 불일치 사항 업데이트
- [x] Handoff 문서 작성
  - [x] Phase 1 기능 목록
  - [x] 아키텍처 결정 사항 요약
  - [x] 알려진 이슈 및 제약사항

---

## 인수 완료 조건 (Acceptance Criteria)

- [x] 관리자가 공지를 CRUD 가능
- [x] 공개 사용자가 공지 목록/상세 조회 가능
- [x] 관리자가 기초 통계 확인 가능
- [x] Seeded acceptance 시나리오가 정상 동작
- [x] 모든 Phase 1 기능이 회귀 테스트 통과
- [x] Swagger UI에서 모든 API 확인 및 테스트 가능
- [x] active 7문서와 구현이 일치
- [x] Phase 1 완료 보고서 작성

---

## 병렬 작업 구조

```
Week 1:
  Backend: [11.1 Domain] -> [11.2 Admin API] + [11.3 Public API] -> [11.4 Stats]
  Frontend: [11.5 Admin UI] + [11.6 Public UI]

Week 2:
  QA: [11.7 Seeded Acceptance] -> [11.8 Regression]
  Backend: [11.9 Swagger Verification]
  All: [11.10 Backlog Normalization]
```

**주의:** Task 11은 최종 안정화 task이며, Task 1-10 완료 후 시작한다. 병렬 실행 불가.

---

## 의존성 매트릭스

| From | To | 관계 |
|------|-----|------|
| Task 1-10 | Task 11 | All Phase 1 features must be complete |
| Task 5 | Task 11 | Admin review 통계에 사용 |
| Task 7 | Task 11 | Request 통계에 사용 |
| Task 4 | Task 11 | Supplier 통계에 사용 |

---

## 리스크 및 완화 전략

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| 회귀 테스트 발견 이슈 | High | 버퍼 시간 확보, critical만 수정, minor는 Phase 2로 연기 |
| 문서-구현 불일치 | Medium | acceptance 기준 재확인, 불일치 시 문서 우선 또는 구현 우선 명확화 |
| 통계 성능 | Low | 초기에는 실시간 계산, 성능 이슈 시 캐싱 또는 배치 고려 |

---

## 산출물 (Artifacts)

### Backend
- `command-domain-operations`: Notice aggregate
- `query-model-admin-stats`: Stats read model
- `admin-server`: Notice controller, stats controller
- `api-server`: Public notice controller

### Frontend
- `apps/admin-site`: Notice management, stats dashboard
- `apps/main-site`: Public notice list/detail

### 문서
- Phase 1 completion report
- Regression test report
- Swagger API documentation (code-first)
- Handoff document for Phase 2

### 테스트
- Seeded acceptance test results
- Regression test results
- Evidence files in `.sisyphus/evidence/`

---

## Commit

```
docs(plan): Phase 1 실행 백로그 최종 고정

- Notice CRUD for admin and public read
- Basic stats dashboard for admin
- Seeded acceptance scenarios
- Regression testing and bug fixes
- Swagger verification (code-first)
- Backlog normalization and handoff docs
```

---

**이전 Task**: [Task 10: Contact-Share Consent](./phase1-task-10-contact-share.md)
**다음 Task**: 없음
