# Phase 1 실행 계획서

## 요약
> **요약**: 현재 active 7문서 기준선을 기반으로 Phase 1 trusted matching core를 실제 구현 가능한 실행 계획으로 전환한다. 이 계획은 repo/runtime foundation, full-stack vertical slice, QA/evidence, Swagger/OpenAPI code-first 통합 규칙까지 포함한다.
> **산출물**:
> - `.sisyphus/plans/phase1-execution-plan.md`
> - 실행 가능한 foundation backlog
> - full-stack vertical slice 순서와 dependency matrix
> - Swagger/OpenAPI code-first integration 기준
> - evidence/QA/commit 기준
> **난이도**: Large
> **병렬화**: YES - task groups
> **크리티컬 패스**: 1 -> 2/3/4 -> 5/6/7 -> 8/9/10 -> 11

## 배경
### 원래 요청
새 기준 문서 세트(`system-architecture.md`, `data-model.md`, `api-spec.md`, `backend-guide.md`, `frontend-guide.md`, `design-system.md`, `acceptance-scenarios-and-backlog.md`)를 기반으로 실제 구현을 시작할 수 있는 실행 계획을 만든다.

### 인터뷰 요약
- 이제 설계 문서 작성보다 실제 실행용 plan이 먼저다.
- OpenAPI는 별도 spec-first 문서 프로젝트로 분리하지 않는다.
- Swagger/OpenAPI는 backend source code 안에서 최대한 해결한다.
- 모든 구현은 frontend / backend / read model / QA / docs 기준을 함께 갖는 vertical slice로 진행한다.

### 반영된 판단
- legacy design 세트는 archive 상태다.
- active 기준선은 `.sisyphus/drafts/`의 7문서 세트다.
- implementation order는 acceptance/backlog 문서의 vertical slice를 따른다.
- Swagger/OpenAPI는 foundation bootstrap + 각 slice 완료 기준에 내장한다.

## 작업 목표
### 핵심 목표
실행자가 더 이상 아키텍처, API 계약, 상태/권한 규칙, 문서 우선순위를 다시 결정하지 않고, Phase 1 구현을 task 단위로 바로 시작할 수 있게 한다.

### 산출물
- `.sisyphus/plans/phase1-execution-plan.md`
- foundation / slice / stabilization 실행 spine
- dependency matrix
- QA/evidence 규칙
- Swagger/OpenAPI code-first 통합 규칙

### 완료 기준 (명령으로 검증 가능)
- `read .sisyphus/plans/phase1-execution-plan.md`를 보면 foundation + 10 slice + final verification wave가 있어야 한다.
- `grep "Swagger|OpenAPI|Task 01|Can Parallel|QA Scenarios|Commit:" ".sisyphus/plans/phase1-execution-plan.md"` 결과가 나와야 한다.
- `grep "auth|approval gate|verification|review queue|search|request|quote|thread|contact-share|notice|stats" ".sisyphus/plans/phase1-execution-plan.md"` 결과가 나와야 한다.
- `grep "frontend|backend|projection|QA|evidence" ".sisyphus/plans/phase1-execution-plan.md"` 결과가 나와야 한다.

### 필수 포함 사항
- Task 01 foundation/bootstrap
- Swagger/OpenAPI code-first bootstrap
- full-stack vertical slice 실행 순서
- read model / projection 작업 포함
- acceptance scenario 기반 QA
- evidence path와 atomic commit 기준

### 포함하면 안 되는 사항
- OpenAPI spec-first 별도 workstream 금지
- WebSocket / PNS / MQTT / AI / OCR / 지도 / 리뷰 확장 금지
- frontend-only/backend-only 순서 금지
- Phase 2 기능 혼입 금지
- infra vendor 확정 강제 금지

## 검증 전략
> ZERO HUMAN INTERVENTION - 모든 검증은 agent가 실행 가능해야 한다.
- 모든 task는 acceptance 기준과 evidence path를 가져야 한다.
- 모든 slice는 happy path와 denial path를 함께 검증한다.
- Swagger/OpenAPI는 backend source code에서 생성/노출 가능한 상태여야 한다.
- Evidence 경로: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## 실행 전략
### 병렬 참고 그룹
- Group A: foundation / runtime / Swagger bootstrap
- Group B: auth + requester approval gate + supplier verification + admin review
- Group C: supplier discovery/read models + request lifecycle + quote lifecycle
- Group D: message threads + contact-share + notice/stats
- Group E: backlog 정규화 + seeded acceptance + Swagger verification

주의:

- Group은 병렬화 참고 기준일 뿐, 실제 착수/리뷰/재시작 단위는 `Task`다.
- `/start-work` 사용 시에는 group이 아니라 개별 task 문서 기준으로 진행한다.

### Sub-plan Reference
- 각 main task의 상세 실행 체크리스트는 `.sisyphus/plans/phase1-subplans-index.md`를 먼저 본다.
- 상세 task 문서는 `.sisyphus/plans/phase1-subplans/` 아래에 있으며, task 번호와 1:1로 대응한다.
- 실행자는 main plan을 상위 spine으로 보고, 실제 작업 직전에는 반드시 대응 sub-plan 문서를 함께 읽는다.
- 코드 리뷰와 완료 판정도 task 단위로 수행한다.

### 현재 Task 상태

| Task | 상태 | 상세 문서 |
|------|------|-----------|
| 01 | 🟢 Done | `.sisyphus/plans/phase1-subplans/phase1-task-01-foundation-runtime-swagger.md` |
| 02 | 🟢 Done | `.sisyphus/plans/phase1-subplans/phase1-task-02-auth-role-skeleton.md` |
| 03 | 🟢 Done | `.sisyphus/plans/phase1-subplans/phase1-task-03-requester-approval-gate.md` |
| 04 | 🟢 Done | `.sisyphus/plans/phase1-subplans/phase1-task-04-supplier-verification.md` |
| 05 | 🟢 Done | `.sisyphus/plans/phase1-subplans/phase1-task-05-admin-review-queue.md` |
| 06 | 🔴 Not Started | `.sisyphus/plans/phase1-subplans/phase1-task-06-supplier-discovery.md` |
| 07 | 🔴 Not Started | `.sisyphus/plans/phase1-subplans/phase1-task-07-request-lifecycle.md` |
| 08 | 🔴 Not Started | `.sisyphus/plans/phase1-subplans/phase1-task-08-quote-lifecycle.md` |
| 09 | 🔴 Not Started | `.sisyphus/plans/phase1-subplans/phase1-task-09-message-threads.md` |
| 10 | 🔴 Not Started | `.sisyphus/plans/phase1-subplans/phase1-task-10-contact-share.md` |
| 11 | 🔴 Not Started | `.sisyphus/plans/phase1-subplans/phase1-task-11-admin-notices-stabilization.md` |

### 의존성 매트릭스
| Task | Depends On | Enables |
|------|------------|---------|
| 1 | none | 2-11 |
| 2 | 1 | 3,4,6,7,8 |
| 3 | 1 | 4,5,7,9 |
| 4 | 1,3 | 5,7,9 |
| 5 | 1,3,4 | 7 |
| 6 | 1,2 | 7,8,9 |
| 7 | 1,4,5,6 | 8,9,11 |
| 8 | 1,6,7 | 9,11 |
| 9 | 1,7,8 | 10,11 |
| 10 | 1,4 | 11 |
| 11 | 1-10 | Final verification |

## 작업 목록
> Implementation + Test + Docs sync = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.
> 실제 실행/리뷰 단위는 각 task이며, wave는 참고 정보다.
> 각 task의 현재 상태는 아래 요약표와 개별 sub-plan 문서를 함께 확인한다.

- [ ] 1. Task 01 - Foundation, Runtime, Swagger/OpenAPI Bootstrap

  **What to do**: frontend workspace, backend Gradle 멀티모듈, MariaDB/Mongo 연결 골격, JWT/security skeleton, 공통 success/error envelope, seed data baseline, test harness, Swagger/OpenAPI code-first bootstrap을 설정한다.
  **Must NOT do**: feature slice 구현 시작 금지. 별도 OpenAPI spec-first 문서 프로젝트 생성 금지.

  **Parallelization**: Can Parallel: NO | Group A | Blocks: 2-11 | Blocked By: none

  **Acceptance Criteria**:
  - [ ] frontend / backend foundation 구조가 active architecture 기준과 일치한다.
  - [ ] `api-server`와 `admin-server`에 Swagger/OpenAPI 노출 기준이 설정된다.
  - [ ] 공통 auth scheme, success/error envelope, seed/test baseline이 정리된다.

  **QA Scenarios**:
  ```text
  Scenario: Foundation and Swagger bootstrap readiness
    Tool: Bash
    Steps: Verify workspace/module skeleton, shared response envelope, and Swagger/OpenAPI integration points exist in code/config.
    Expected: executor can start slice work without re-deciding runtime/API tooling.
    Evidence: .sisyphus/evidence/task-1-foundation-swagger.txt
  ```

  **Commit**: YES | Message: `chore(plan): foundation and swagger bootstrap 정렬`

- [ ] 2. Task 02 - Auth and Role Skeleton

  **What to do**: signup/login/me, JWT issuance, role baseline, auth error envelope, Swagger auth scheme 문서화를 구현 단위로 정리한다.
  **Must NOT do**: business approval gate나 supplier verification 규칙까지 여기서 확장하지 않는다.

  **Parallelization**: Can Parallel: YES | Group B | Blocks: 6 | Blocked By: 1
  **Commit**: YES | Message: `feat(plan): AUTH-001 실행 계획 고정`

- [ ] 3. Task 03 - Requester Business Approval Gate

  **What to do**: requester business profile create/read/update, approval state, denial path, gate enforcement를 full-stack으로 구현 단위화한다.
  **Must NOT do**: supplier-side 프로필 규칙과 섞지 않는다.

  **Parallelization**: Can Parallel: YES | Group B | Blocks: 6,7 | Blocked By: 1
  **Commit**: YES | Message: `feat(plan): REQUESTER-APPROVAL-001 실행 계획 고정`

- [ ] 4. Task 04 - Supplier Profile and Verification Submission

  **What to do**: supplier profile, verification submission, certification attachment, state visibility, validation 규칙을 구현 단위화한다.
  **Must NOT do**: admin review action semantics를 여기서 마감하지 않는다.

  **Parallelization**: Can Parallel: YES | Group B | Blocks: 5,7,10 | Blocked By: 1
  **Commit**: YES | Message: `feat(plan): SUPPLIER-VERIFICATION-001 실행 계획 고정`

- [ ] 5. Task 05 - Admin Review Queue and Decision Actions

  **What to do**: admin review queue/detail, approve/hold/reject, internal/public note, audit, resubmission semantics를 구현 단위화한다.
  **Must NOT do**: 일반 backoffice 범위로 넓히지 않는다.

  **Parallelization**: Can Parallel: YES | Group B | Blocks: 7,10 | Blocked By: 1,3
  **Commit**: YES | Message: `feat(plan): ADMIN-REVIEW-001 실행 계획 고정`

- [ ] 6. Task 06 - Supplier Discovery and Read Models

  **What to do**: approved-only exposure, search/detail read model, projection, filter/query shape를 구현 단위화한다.
  **Must NOT do**: ranking/review/map 확장 금지.

  **Parallelization**: Can Parallel: YES | Group C | Blocks: 7,8 | Blocked By: 1,2
  **Commit**: YES | Message: `feat(plan): DISCOVERY-001 실행 계획 고정`

- [ ] 7. Task 07 - Request Lifecycle and Targeting

  **What to do**: request create/edit/open/close/cancel, public vs targeted mode, ownership, targeted supplier link를 구현 단위화한다.
  **Must NOT do**: quote 비교 규칙을 여기서 다시 정의하지 않는다.

  **Parallelization**: Can Parallel: YES | Group C | Blocks: 8,9 | Blocked By: 1,4,5,6
  **Commit**: YES | Message: `feat(plan): REQUEST-001 실행 계획 고정`

- [ ] 8. Task 08 - Quote Lifecycle and Comparison

  **What to do**: quote submit/update/withdraw/select/decline, duplicate guard, patch rule, comparison read model을 구현 단위화한다.
  **Must NOT do**: thread/contact-share semantics를 임의로 바꾸지 않는다.

  **Parallelization**: Can Parallel: YES | Group C | Blocks: 9,11 | Blocked By: 1,6,7
  **Commit**: YES | Message: `feat(plan): QUOTE-001 실행 계획 고정`

- [ ] 9. Task 09 - Message Threads, Attachments, Read State

  **What to do**: thread creation trigger, thread list/detail, message send/read, attachment validation, participant denial path를 구현 단위화한다.
  **Must NOT do**: real-time transport를 전제하지 않는다.

  **Parallelization**: Can Parallel: YES | Group D | Blocks: 10,11 | Blocked By: 1,7,8
  **Commit**: YES | Message: `feat(plan): THREAD-001 실행 계획 고정`

- [ ] 10. Task 10 - Contact-Share Consent

  **What to do**: request/approve/revoke/retry, bilateral reveal gating, post-approval non-revocation rule, audit expectation을 구현 단위화한다.
  **Must NOT do**: 일반 메시징 규칙과 혼합해서 흐리게 만들지 않는다.

  **Parallelization**: Can Parallel: YES | Group D | Blocks: 11 | Blocked By: 1,4,9
  **Commit**: YES | Message: `feat(plan): CONTACT-SHARE-001 실행 계획 고정`

- [ ] 11. Task 11 - Admin Notices and Basic Stats + Stabilization

  **What to do**: notice CRUD, public notice read, stats projection, seeded acceptance run, regression on role/state rules, Swagger coverage verification을 구현 단위화한다.
  **Must NOT do**: advanced analytics나 별도 문서형 OpenAPI 프로젝트로 확장하지 않는다.

  **Parallelization**: Can Parallel: NO | Group E | Blocks: Final verification | Blocked By: 1-10
  **Commit**: YES | Message: `docs(plan): Phase 1 실행 백로그 최종 고정`

## QA / Evidence Rules
- 모든 slice는 happy path와 denial path를 함께 가진다.
- backend 작업은 command model / query model / projection 중 필요한 요소를 포함해야 한다.
- frontend 작업은 대응 화면과 state visibility 규칙을 포함해야 한다.
- Swagger/OpenAPI는 foundation에서만 켜고 끝내는 것이 아니라, 각 slice 완료 시 endpoint contract가 반영되어야 한다.
- Evidence 경로는 `.sisyphus/evidence/task-{N}-{slug}.{ext}`를 사용한다.

## 최종 검증 그룹 (4 parallel agents, ALL must APPROVE)
- [ ] F1. Plan Compliance Audit - oracle
- [ ] F2. Runtime/Architecture Safety Review - unspecified-high
- [ ] F3. Slice Reality Check - unspecified-high
- [ ] F4. Scope Fidelity Check - deep

## 커밋 전략
- Task 01은 foundation/bootstrap 성격의 별도 커밋으로 먼저 고정한다.
- 각 slice는 frontend/backend/projection/test/docs sync를 가능한 한 하나의 vertical commit 묶음으로 관리한다.
- Swagger 관련 변경은 각 slice의 API 구현과 함께 커밋한다.
- 문서 전파가 필요한 경우 active 7문서 세트와 같은 커밋에서 동기화한다.

Commit message format:

- 기본 형식은 `prefix: 한글 설명`
- 문서/계획 변경은 `docs` 또는 `design`
- 설정/런타임/bootstrap은 `chore`
- 실제 기능 구현은 `feat`, 오류 수정은 `fix`, 테스트 보강은 `test`

## 성공 기준
- 실행자는 foundation부터 stabilization까지 구현 순서를 다시 설계하지 않고 진행할 수 있다.
- 모든 slice가 frontend / backend / projection / QA / docs 관점을 함께 가진다.
- Swagger/OpenAPI는 source code 안에서 유지되며, 별도 spec-first 문서 프로젝트가 필요 없다.
- active 7문서 세트와 구현 실행 계획이 충돌하지 않는다.
