# Phase 2 Task 03 - 관리자 검수 이력 및 감사 로그

## 메인 Task 메타데이터

| 항목 | 값 |
|------|-----|
| **메인 Task ID** | P2-03 |
| **Wave** | 2 (MVP Completion Debt Closure) |
| **우선순위** | P1 |
| **기간** | 2-3일 |
| **스토리 포인트** | 8 |
| **작업자** | Full-stack |
| **상태** | 🟢 Done (2026-04-19, 축소판) |
| **Can Parallel** | YES (P2-04, P2-05와 병렬 가능) |
| **Blocks** | 없음 |
| **Blocked By** | P2-01 (CI/e2e baseline) |

---

## 개요

Phase 1에서 만든 관리자 검수 큐(Task 05)는 **현재 상태**만 보여주고, 과거 어떤 관리자가 어떤 결정을 내렸는지 UI에서 추적하기 어렵다. 본 task는 검수 이력과 audit log를 UI/API 양쪽에 노출해 감사 및 운영 대응을 가능하게 한다.

이 작업은 기능 신규가 아니라 이미 존재하는 `audit_log` 테이블(Phase 1에서 생성 확인)과 검수 상태 전이를 **가시화**하는 데 초점이 있다.

---

## 현재 진행 상태

- 메인 Task 상태: 🔴 Not Started
- 메모: MariaDB 스키마에 `audit_log` 테이블이 이미 존재함. Phase 1 admin-review 모듈이 상태 전이를 기록하는지, 기록되는 필드가 무엇인지 재감사 필요.

| SubTask | 상태 | 메모 |
|---------|------|------|
| 3.1 | 🟢 Done | 기록: supplier review transition 3종 (approve/hold/reject). 미기록: notice publish, request status change — 중복/필요성 낮아 보류 (BE-future). |
| 3.2 | 🟢 Done | approve/hold/reject 이벤트는 이미 actor/decision/noteInternal/notePublic/reasonCode 기록. suspend 는 현 도메인에 없음. |
| 3.3 | 🟢 Done | `AdminReviewApplicationService.detail()` 가 history 를 조회해 `reviewHistory[]` 로 반환 중. |
| 3.4 | 🟢 Done | admin-site `ReviewDetailPage` 에 timeline 이미 렌더링 (HistoryItem 컴포넌트 + reviews.json 로케일). |
| 3.5 | ⚪ Deferred | OP-4 로 분리. 운영 요구 발생 시 착수. |
| 3.6 | 🟢 Done | End-to-end smoke (hold transition → history 반영) + evidence 저장. |

---

## SubTask 목록

### 🔴 SubTask 3.1: Audit log 현황 재감사

**작업자:** Backend
**예상 소요:** 0.25일

- [ ] `audit_log` 테이블 컬럼 확인 (actor, action, target, payload, createdAt 등)
- [ ] 어떤 command 핸들러가 audit 기록을 남기는지 grep
- [ ] supplier review, notice publish, requester approval 각 flow의 기록 여부 표 작성

### 🔴 SubTask 3.2: 기록 누락 보강

**작업자:** Backend
**예상 소요:** 0.75일

- [ ] approve / hold / reject / suspend 이벤트에 대해 actor, target, reason, beforeState, afterState 기록
- [ ] command-domain 계층에서 write, projection에서는 read-only
- [ ] 테스트: AdminReviewApplicationService, SupplierVerificationCommandHandler 단위 테스트

### 🔴 SubTask 3.3: 검수 상세 API에 history

**작업자:** Backend
**예상 소요:** 0.5일

- [ ] `GET /api/admin/reviews/{submissionId}` 응답에 `history[]` 추가 (actorName, action, reason, timestamp)
- [ ] Swagger 예제 갱신
- [ ] 별도 엔드포인트 `GET /api/admin/reviews/{submissionId}/history` 검토 (페이지네이션 필요성)

### 🔴 SubTask 3.4: admin-site UI

**작업자:** Frontend
**예상 소요:** 0.75일

- [ ] 검수 상세 화면에 타임라인 컴포넌트 추가
- [ ] 상태 변경 시각, 담당자명, 사유 표시
- [ ] 스크린샷 evidence

### 🔴 SubTask 3.5: 관리자 감사 조회 API

**작업자:** Backend
**예상 소요:** 0.5일

- [ ] `GET /api/admin/audit-logs?actor=&action=&target=&since=&until=&page=&size=`
- [ ] 관리자 role만 접근 가능
- [ ] 페이지네이션 기본 20

### 🔴 SubTask 3.6: 테스트 및 evidence

**작업자:** Full-stack
**예상 소요:** 0.25일

- [ ] backend integration test: 상태 전이 후 history 조회 검증
- [ ] frontend hook test: history 렌더
- [ ] `yarn workspace @fsm/admin-site test`, `./gradlew :admin-server:test`

---

## 인수 완료 조건 (Acceptance Criteria)

- [ ] 관리자가 검수 상세에서 과거 결정 내역(누가, 언제, 어떤 사유로)을 확인할 수 있다.
- [ ] audit_log에 approve/hold/reject/suspend 이벤트가 빠짐없이 기록된다.
- [ ] `/api/admin/audit-logs` 조회로 actor/action/target 기반 필터링 가능.
- [ ] Evidence: `.sisyphus/evidence/phase2-task-03-admin-review-history-and-audit.txt`

---

## 검증 명령

```bash
cd backend
./gradlew :admin-server:test :command-domain-supplier:test :command-domain-user:test

cd frontend
yarn workspace @fsm/admin-site test
yarn workspace @fsm/admin-site build
```

---

## 의존성 매트릭스

| From | To | 관계 |
|------|-----|------|
| 3.1 재감사 | 3.2 보강 | 현재 상태 확정 후 누락 보강 |
| 3.2 write 보강 | 3.3 read API | 기록되는 필드 확정 후 응답 스키마 설계 |
| 3.3 API | 3.4 UI | API 계약 확정 후 화면 연동 |

---

## 리스크 및 완화 전략

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| audit_log payload 스키마가 이벤트마다 달라 가변 | Medium | JSON 컬럼 + 이벤트 타입별 스키마 버전 태그 |
| 과거 데이터 backfill 부재로 history 공백 | Low | Phase 2 시작 시점 이후만 기록 가능함을 UI에 명시 |
| 관리자 role 미구현 상태에서 API 노출 | High | Phase 1 Spring Security 설정 재확인 후 배포 |

---

## 산출물 (Artifacts)

### 코드
- `backend/command-domain-supplier/...` audit write path 보강
- `backend/admin-server/.../AdminReviewController.kt` history 필드
- `backend/admin-server/.../AuditLogController.kt` (신규)
- `backend/query-model-admin-review/...` history projection (필요 시)
- `frontend/apps/admin-site/src/features/review/components/ReviewHistoryTimeline.tsx`

### 문서
- Swagger 응답 예제 갱신
- `.sisyphus/evidence/phase2-task-03-admin-review-history-and-audit.txt`

---

## Commit

```
feat(admin): record actor/action/reason on review transitions
feat(admin): expose review history timeline on detail API
feat(admin-site): render review history timeline
feat(admin): add admin audit-log search endpoint
docs(phase2): record task 03 evidence
```

---

**이전 Task**: [Task 02: Router and Doc Hygiene](./phase2-task-02-router-and-doc-hygiene.md)
**다음 Task**: [Task 04: 공급자 탐색 정렬 및 인덱스](./phase2-task-04-supplier-discovery-sort-and-index.md)
