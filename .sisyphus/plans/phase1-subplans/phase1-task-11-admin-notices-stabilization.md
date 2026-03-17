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
| **상태** | 계획 중 |
| **Can Parallel** | NO (Sequential) |
| **Blocks** | Phase 1 완료 |
| **Blocked By** | Task 1-10 |

---

## 개요

Phase 1의 마무리 작업으로, 관리자 공지 CRUD, 공개 공지 조회, 기초 통계, 백로그 정규화, 회귀 테스트, Swagger 검증을 수행한다. 모든 Phase 1 기능이 통합되어 동작하는지 확인한다.

---

## SubTask 목록

### 11.1 공지 도메인 모델

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] `Notice` aggregate
  - [ ] Fields: title, body, state, authorId, publishedAt, viewCount
  - [ ] State: `draft` | `published` | `archived`
- [ ] Command handlers
  - [ ] `CreateNotice`
  - [ ] `UpdateNotice` (draft/published 상태)
  - [ ] `PublishNotice` (draft -> published)
  - [ ] `ArchiveNotice` (published -> archived)

### 11.2 관리자 공지 API

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] API: `GET /api/admin/notices`
  - [ ] Auth: role=admin
  - [ ] Query: state 필터, pagination
  - [ ] Response: 관리용 공지 목록 (viewCount 포함)
- [ ] API: `POST /api/admin/notices`
  - [ ] Body: title, body, state, publishImmediately
  - [ ] Validation: title (5-200자), body (10-5000자)
- [ ] API: `PATCH /api/admin/notices/{noticeId}`
  - [ ] Partial update
  - [ ] state 변경 가능 (draft <-> published <-> archived)

### 11.3 공개 공지 API

**작업자:** Backend  
**예상 소요:** 0.25일

- [ ] API: `GET /api/notices`
  - [ ] Auth: 불필요
  - [ ] Query: page, size
  - [ ] Response: `published` 상태 공지만
  - [ ] Fields: noticeId, title, excerpt, publishedAt
- [ ] API: `GET /api/notices/{noticeId}`
  - [ ] 상세 조회
  - [ ] viewCount increment
  - [ ] Response: 전체 body, attachments

### 11.4 통계 및 대시보드 API

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] API: `GET /api/admin/stats/summary`
  - [ ] Auth: role=admin
  - [ ] Query: fromDate, toDate
  - [ ] Response:
    - [ ] users: total, requesters, suppliers
    - [ ] suppliersByState: approved, submitted, under_review, hold, rejected, suspended
    - [ ] reviews: pending, avgReviewDays
    - [ ] requests: open, closed
- [ ] Projection: `stats_summary_view`
  - [ ] 기초 통계 집계용
  - [ ] 주기적 업데이트 또는 실시간 계산

### 11.5 관리자 사이트 공지/통계 UI

**작업자:** Frontend  
**예상 소요:** 0.5일

- [ ] 공지 관리 페이지 (`admin-site`)
  - [ ] 공지 목록: 제목, 상태, 작성자, 게시일, 조회수
  - [ ] 상태별 필터
  - [ ] 공지 작성/편집 모달
  - [ ] 게시/보관 액션
- [ ] 통계 대시보드 페이지
  - [ ] 사용자 통계 카드
  - [ ] 공급자 상태별 차트
  - [ ] 검수 대기 현황
  - [ ] 의뢰 현황
  - [ ] 기간 선택 필터

### 11.6 공개 공지 UI

**작업자:** Frontend  
**예상 소요:** 0.25일

- [ ] 공지 목록 페이지 (`main-site`)
  - [ ] 공개 공지 목록
  - [ ] 제목, 요약, 게시일
- [ ] 공지 상세 페이지
  - [ ] 본문 전체 표시
  - [ ] 첨부 파일 다운로드
  - [ ] 목록으로 돌아가기

### 11.7 Seeded Acceptance 테스트

**작업자:** QA  
**예상 소요:** 1일

- [ ] Seed data 검증
  - [ ] Test 계정 로그인
  - [ ] Test 데이터 조회
- [ ] Happy path 시나리오
  - [ ] 요청자: 가입 -> 사업자등록 -> 의뢰생성 -> 견적수신 -> 선택
  - [ ] 공급자: 가입 -> 프로필등록 -> 검수제출 -> 승인 -> 견적제출
  - [ ] 관리자: 검수 -> 승인/반려, 공지작성
- [ ] Denial path 시나리오
  - [ ] 미승인 요청자 의뢰 생성 시도 (4034)
  - [ ] 미승인 공급자 견적 제출 시도 (4037)
  - [ ] 타인 의뢰 조회 시도 (403)

### 11.8 회귀 테스트 및 버그 수정

**작업자:** QA + Full-stack  
**예상 소요:** 1일

- [ ] Role/State 기반 접근 제어 검증
  - [ ] 각 역할별 권한 매트릭스 검증
  - [ ] 상태 전이 guard 검증
- [ ] API 계약 검증
  - [ ] Request/Response schema 검증
  - [ ] Error code 검증
- [ ] Cross-cutting 기능 검증
  - [ ] JWT 인증/만료
  - [ ] Pagination
  - [ ] File upload
- [ ] 버그 수정 및 재검증

### 11.9 Swagger 검증 및 문서화

**작업자:** Backend  
**예상 소요:** 0.5일

- [ ] Swagger UI 검증
  - [ ] 모든 endpoints가 Swagger에 표시됨
  - [ ] Auth 버튼으로 JWT 토큰 설정 가능
  - [ ] Request/Response 예시가 정확함
- [ ] API 문서 정리
  - [ ] Tag별 그룹화
  - [ ] Description 보강
  - [ ] Deprecated marking (있는 경우)
- [ ] Code-first 원칙 검증
  - [ ] 별도 OpenAPI YAML 파일 없음 확인
  - [ ] Annotation 기반 문서화만 사용

### 11.10 백로그 정규화 및 Handoff

**작업자:** Full-stack  
**예상 소요:** 0.5일

- [ ] 백로그 정리
  - [ ] 완료된 작업 마킹
  - [ ] 미완료 작업 Phase 2로 이동
  - [ ] Technical debt 문서화
- [ ] 문서 동기화
  - [ ] active 7문서와 구현 일치 확인
  - [ ] 불일치 사항 업데이트
- [ ] Handoff 문서 작성
  - [ ] Phase 1 기능 목록
  - [ ] 아키텍처 결정 사항 요약
  - [ ] 알려진 이슈 및 제약사항

---

## 인수 완료 조건 (Acceptance Criteria)

- [ ] 관리자가 공지를 CRUD 가능
- [ ] 공개 사용자가 공지 목록/상세 조회 가능
- [ ] 관리자가 기초 통계 확인 가능
- [ ] Seeded acceptance 시나리오가 정상 동작
- [ ] 모든 Phase 1 기능이 회귀 테스트 통과
- [ ] Swagger UI에서 모든 API 확인 및 테스트 가능
- [ ] active 7문서와 구현이 일치
- [ ] Phase 1 완료 보고서 작성

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
