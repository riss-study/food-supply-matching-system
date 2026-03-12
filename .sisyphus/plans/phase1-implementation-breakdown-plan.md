# Phase 1 구현 분해 계획서

## 요약
> **요약**: 현재 Phase 1 신뢰형 매칭 설계 세트를 기반으로, 실제 실행 가능한 구현 백로그와 슬라이스 순서, 정책 반영 작업, 검증 규칙을 고정한다.
> **산출물**:
> - 실제 로컬 명령과 fixture 전략을 담은 execution foundation
> - frontend / backend / QA/validation / docs/policy를 아우르는 9개 vertical slice
> - 남아 있던 운영 정책 5개를 active docs에 반영하는 작업
> - 최종 실행용 구현 분해 백로그
> **난이도**: Large
> **병렬화**: YES - 5 waves
> **크리티컬 패스**: 1 -> 2/3 -> 4/5/6 -> 7 -> 8 -> 9/10 -> 11

## 배경
### 원래 요청
현재 Phase 1 requirements, PRD, design set 뒤에 따라와야 하는 구현용 작업 분해 문서를 만든다.

### 인터뷰 요약
- 추가 product-scope 질문은 더 이상 없다.
- 범위는 Phase 1 trusted matching core로 고정되어 있다.
- 기존 설계 문서가 9-slice 실행 spine을 이미 정의하고 있다.
- 5개 운영 정책 답변은 `phase1-pre-coding-questions.md`에 있고, 이것을 active docs에 materialize 해야 한다.

### Metis 검토 (반영 완료)
- feature slice에 들어가기 전에 Wave 0에서 실제 프로젝트 명령, fixture 전략을 확인해야 한다.
- 열려 있던 정책 5개는 질문으로 남기지 않고 explicit task로 소유시켜야 한다.
- frontend-only/backend-only 분리는 금지하고 vertical slice 구조를 유지한다.
- CQRS read-model / projection 작업을 필요한 slice에 포함한다.
- evidence 기반 QA와 atomic commit 경계를 강제한다.

## 작업 목표
### 핵심 목표
실행자가 slice 순서, 정책 소유, 검증 방식, 커밋 경계를 다시 결정하지 않아도 되도록 decision-complete 구현 분해 계획을 만든다.

### 산출물
- `.sisyphus/plans/phase1-implementation-breakdown-plan.md`
- `.sisyphus/drafts/phase1-execution-foundation.md`
- `.sisyphus/drafts/phase1-policy-closure-log.md`
- 기존 설계 문서와 일치하는 implementation slice sequence

### 완료 기준 (명령으로 검증 가능)
- `read .sisyphus/plans/phase1-implementation-breakdown-plan.md`를 보면 11개 task와 final verification wave가 있어야 한다.
- `grep "Wave 0|Can Parallel|QA Scenarios|Commit:" .sisyphus/plans/phase1-implementation-breakdown-plan.md` 결과가 나와야 한다.
- `grep "thread creation|approval gate|PATCH|revoke|hold" .sisyphus/plans/phase1-implementation-breakdown-plan.md` 결과가 나와야 한다.
- `grep "frontend|backend|QA/validation|docs/policy" .sisyphus/plans/phase1-implementation-breakdown-plan.md` 결과가 나와야 한다.

### 필수 포함 사항
- Wave 0 execution foundation
- 9개 고정 slice 순서
- 명확한 dependency matrix
- explicit policy-closure task
- read model이 필요한 곳의 CQRS projection 작업
- agent-executable QA와 evidence path

### 포함하면 안 되는 사항
- Phase 2 기능 금지
- infra vendor를 blocker로 두지 않기
- WebSocket/map/review/payment/AI 확장 금지
- frontend-only/backend-only 순서 금지
- vague한 acceptance criteria 금지

## 검증 전략
> ZERO HUMAN INTERVENTION - 모든 검증은 agent가 실행 가능해야 한다.
- plan artifact 기준 tests-after
- 모든 task는 plan-level validation scenario를 가져야 한다.
- downstream 구현은 happy path와 denial path를 함께 가져야 한다.
- Evidence 경로: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## 실행 전략
### 병렬 실행 Wave
- Wave 1: execution foundation + policy closure framework
- Wave 2: auth/onboarding + supplier profile/verification + admin review
- Wave 3: supplier discovery/read models + request lifecycle + quote lifecycle
- Wave 4: message threads + contact share + notices/stats
- Wave 5: backlog 정규화 + final verification

### 의존성 매트릭스
| Task | Depends On | Enables |
|------|------------|---------|
| 1 | none | 2-11 |
| 2 | 1 | 5, 6, 7, 8 |
| 3 | 1 | 4, 5, 7, 8 |
| 4 | 1, 3 | 3, 5, 7, 9 |
| 5 | 1, 3, 4 | 6, 7, 8 |
| 6 | 1, 2 | 7, 8, 9, 10 |
| 7 | 1, 3, 5, 6 | 8, 9, 11 |
| 8 | 1, 6, 7 | 9, 11 |
| 9 | 1, 7, 8 | 11 |
| 10 | 1, 3, 4 | 11 |
| 11 | 1-10 | Final verification |

### 에이전트 배치 요약
| Wave | Task Count | Categories |
|------|------------|------------|
| 1 | 1 | unspecified-high |
| 2 | 3 | unspecified-high, quick |
| 3 | 3 | unspecified-high, deep |
| 4 | 3 | unspecified-high |
| 5 | 1 | writing |

## 작업 목록
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [ ] 1. Wave 0 - 실행 기반 및 정책 고정

  **What to do**: 실제 repo stack, 로컬 test/build/dev 명령, fixture 전략, evidence 규칙, worktree verification routine을 담은 execution foundation을 만든다. 이미 답변받은 5개 운영 정책을 `phase1-pre-coding-questions.md`에서 policy closure layer와 active docs에 반영한다.
  **Must NOT do**: Phase 2로 scope 확장 금지. infra vendor 결정 금지. feature slice 구현 시작 금지.

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: [`session-markdown-documentor`]
  - Omitted: [`git-master`]

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 2,3,4,5,6,7,8,9,10,11 | Blocked By: none

  **Acceptance Criteria**:
  - [ ] `.sisyphus/drafts/phase1-execution-foundation.md`가 실제 로컬 명령 또는 planning-only 상태를 명확히 기록한다.
  - [ ] `.sisyphus/drafts/phase1-policy-closure-log.md`가 5개 정책을 더 이상 판단 없이 닫는다.
  - [ ] 이후 slice용 evidence / fixture 기준이 정리된다.

  **QA Scenarios**:
  ```text
  Scenario: Foundation artifact completeness
    Tool: Bash
    Steps: Run `ls .sisyphus/drafts`; run `grep "test|build|dev|fixture|evidence" ".sisyphus/drafts/phase1-execution-foundation.md"`; run `grep "thread creation|approval gate|PATCH|revoke|hold" ".sisyphus/drafts/phase1-policy-closure-log.md"`
    Expected: 필요한 foundation/policy 항목이 모두 존재한다.
    Evidence: .sisyphus/evidence/task-1-execution-foundation.txt
  ```

  **Commit**: YES | Message: `docs(plan): 실행 기반과 정책 고정 반영`

- [ ] 2. Slice 1 - 인증, 역할, 요청자 사업자 승인 게이트

  **What to do**: auth와 requester onboarding을 frontend, backend, QA, docs/policy 작업으로 분해한다. 역할 선택, requester business profile create/read/update, approval gate denial을 포함한다.
  **Must NOT do**: supplier verification이나 search read model까지 끌고 오면 안 된다.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 6 | Blocked By: 1
  **Commit**: YES | Message: `design: AUTH-001 슬라이스 분해 정리`

- [ ] 3. Slice 2 - 공급자 프로필 및 검수 제출

  **What to do**: supplier profile, verification submission, certification attachment, validation, supplier-side state visibility를 분해한다.
  **Must NOT do**: admin review 결정까지 포함하면 안 된다.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 4,5,7,9 | Blocked By: 1
  **Commit**: YES | Message: `design: SUPPLIER-001 슬라이스 분해 정리`

- [ ] 4. Slice 3 - 관리자 검수 큐 및 공급자 상태 결정

  **What to do**: admin review queue, review detail, approve/hold/reject, user-visible note, audit log, hold/reject/resubmission semantics를 분해한다.
  **Must NOT do**: 일반 support tooling으로 범위를 넓히지 않는다.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 5,7,9 | Blocked By: 1,3
  **Commit**: YES | Message: `design: ADMIN-001 슬라이스 분해 정리`

- [ ] 5. Slice 4 - 공급자 탐색, 검색, 상세 리드모델

  **What to do**: supplier listing, filtering, approved-only exposure, supplier detail read model, search/detail projection 작업을 분해한다.
  **Must NOT do**: map, review, ranking 확장 금지.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 7 | Blocked By: 1,3,4
  **Commit**: YES | Message: `design: DISCOVERY-001 슬라이스 분해 정리`

- [ ] 6. Slice 5 - 의뢰 라이프사이클 및 타겟팅

  **What to do**: request create/edit/open/close/cancel, public vs targeted mode, targeted supplier link, ownership rule을 분해한다.
  **Must NOT do**: quote comparison이나 messaging rule을 여기서 다시 정의하지 않는다.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 7,8,9 | Blocked By: 1,2
  **Commit**: YES | Message: `design: REQUEST-001 슬라이스 분해 정리`

- [ ] 7. Slice 6 - 견적 제출, 수정, 선택, 비교

  **What to do**: quote create/update/withdraw, requester compare/select/decline, duplicate quote 방지, quote PATCH semantics, comparison read model을 분해한다.
  **Must NOT do**: thread trigger를 다시 임의로 바꾸면 안 된다.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 8,9,11 | Blocked By: 1,3,5,6
  **Commit**: YES | Message: `design: QUOTE-001 슬라이스 분해 정리`

- [ ] 8. Slice 7 - 메시지 스레드, 첨부, 읽음 상태

  **What to do**: thread creation trigger, thread list/detail, message send/read, attachment validation, participant access denial을 분해한다.
  **Must NOT do**: real-time transport guarantee를 전제하지 않는다.

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: 9,11 | Blocked By: 1,6,7
  **Commit**: YES | Message: `design: THREAD-001 슬라이스 분해 정리`

- [ ] 9. Slice 8 - 연락처 공유 동의 흐름

  **What to do**: contact-share request/approve/revoke/retry, bilateral reveal gating, one-sided denial, audit expectations를 분해한다.
  **Must NOT do**: 메시지 스레드 일반 규칙 안에 그냥 묻어버리면 안 된다.

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: 11 | Blocked By: 1,7,8
  **Commit**: YES | Message: `design: CONTACT-001 슬라이스 분해 정리`

- [ ] 10. Slice 9 - 공지 및 기본 관리자 통계

  **What to do**: notice CRUD, public notice read, stats projection, admin-only authorization을 분해한다.
  **Must NOT do**: advanced analytics로 확장하지 않는다.

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: 11 | Blocked By: 1,3,4
  **Commit**: YES | Message: `design: NOTICE-001 슬라이스 분해 정리`

- [ ] 11. Delivery Backlog 정규화 및 handoff

  **What to do**: Tasks 1-10을 executor용 backlog로 정규화하고, wave/workstream별로 inputs, outputs, dependencies, verification, evidence, atomic commit boundary를 정리한다.
  **Must NOT do**: 이미 잠긴 product decision을 다시 열면 안 된다.

  **Parallelization**: Can Parallel: NO | Wave 5 | Blocks: Final verification | Blocked By: 1-10
  **Commit**: YES | Message: `docs(plan): Phase 1 구현 백로그 최종 정리`

## 최종 검증 Wave (4 parallel agents, ALL must APPROVE)
- [ ] F1. Plan Compliance Audit - oracle
- [ ] F2. Code Quality Review - unspecified-high
- [ ] F3. Real Manual QA - unspecified-high
- [ ] F4. Scope Fidelity Check - deep

## 커밋 전략
- Task 1 이후 execution foundation과 policy closure를 먼저 고정한다.
- 각 slice task 이후 atomic commit으로 끊는다.
- 서로 먼 slice를 한 커밋에 섞지 않는다.
- 정책/설계 기준이 바뀌면 관련 requirements/PRD/design 문서를 같은 커밋에서 같이 수정한다.

Commit message format:

- 기본 형식은 `prefix: 한글 설명`
- 사용 가능한 기본 prefix는 `feat`, `fix`, `docs`, `design`, `refactor`, `test`, `chore`
- 문서 전용 변경은 `docs` 또는 `design`
- 설정/도구/MCP/빌드 관련 변경은 `chore`
- 실제 기능 구현은 `feat`, 오류 수정은 `fix`, 테스트 추가/수정은 `test`

## 성공 기준
- 실행자가 slice 순서, ownership, verification style을 다시 결정하지 않고 Wave 1부터 Wave 5까지 진행할 수 있다.
- 5개 운영 정책 gap은 feature 구현 전에 모두 닫힌다.
- 모든 slice에 frontend, backend, QA/validation, docs/policy 관점이 들어간다.
- discovery, comparison, thread summary, review queue, stats에 필요한 CQRS read-model 작업이 포함된다.
- 최종 분해 계획이 Phase 1 trusted matching scope 안에 머문다.
