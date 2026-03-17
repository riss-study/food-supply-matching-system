# Phase 1 개발 가이드 계획서

## 요약
> 상태: Archived
> 대체 문서: `.sisyphus/drafts/phase1-development-entry-guide.md`, `.sisyphus/plans/phase1-execution-plan.md`, `.sisyphus/plans/phase1-subplans-index.md`

> **요약**: 구현자가 어디서부터 시작하고, 어떤 문서가 기준이며, 슬라이스를 어떤 순서로 실행해야 하는지 알려주는 얇은 개발 진입 가이드를 만든다.
> **산출물**:
> - `.sisyphus/drafts/phase1-development-entry-guide.md`
> - 필요 시 `phase1-execution-foundation.md`, `phase1-implementation-breakdown-plan.md` 참조 갱신
> - 미래에 다문서 가이드로 분리할 조건 정리
> **난이도**: Short
> **병렬화**: NO
> **크리티컬 패스**: 1 -> 2 -> 3 -> 4 -> 5

## 배경
### 원래 요청
코딩 전에, 사용자가 보여준 예시처럼 개발 가이드 문서를 먼저 만드는 것이 좋은지 검토하고 계획을 세운다.

### 인터뷰 요약
- 사용자는 코딩 전에 가이드 문서가 있기를 원한다.
- 붙여준 예시는 좋은 패턴이지만, 현재 워크스페이스는 아직 planning-only 상태다.
- 현재 `.sisyphus` 문서들은 이미 범위, PRD, 설계, 정책 고정, 실행 계획을 갖고 있다.
- 지금 진짜 부족한 것은 거대한 문서 계층이 아니라, 실행 관점의 진입점이다.

### Metis 검토 (반영 완료)
- 가이드는 execution-only 문서여야 하며, 두 번째 PRD나 아키텍처 문서가 되면 안 된다.
- 아직 코드베이스가 없으므로 새로운 root `docs/` tree는 만들지 않는다.
- authority loop를 막기 위해, 가이드는 현재 source-of-truth chain 아래에 둔다.
- evidence, QA, commit, doc-sync 규칙은 기존 계획서를 그대로 따른다.

## 작업 목표
### 핵심 목표
기존 planning/design 문서를 중복하지 않으면서, 미래 작업자가 구현을 시작할 때 가장 먼저 보는 단일 개발 진입 가이드를 만들기 위한 decision-complete 계획을 세운다.

### 산출물
- `.sisyphus/plans/phase1-development-guide-plan.md`
- `.sisyphus/drafts/phase1-development-entry-guide.md`
- 필요 시 `.sisyphus/drafts/phase1-execution-foundation.md` 참조 갱신
- 필요 시 `.sisyphus/plans/phase1-implementation-breakdown-plan.md` 참조 갱신

### 완료 기준 (명령으로 검증 가능)
- `read .sisyphus/plans/phase1-development-guide-plan.md`를 보면 single-guide 전략이 보이고 multi-doc guide tree를 강제하지 않아야 한다.
- `grep "development entry guide|Authority Chain|Execution Order|Do Not Use This For" .sisyphus/plans/phase1-development-guide-plan.md` 결과가 나와야 한다.
- `grep "docs/|backend-guide|frontend-guide|design-system" .sisyphus/plans/phase1-development-guide-plan.md`로 immediate full docs hierarchy를 요구하지 않음을 확인할 수 있어야 한다.

### 필수 포함 사항
- 지금 당장 목표는 단일 파일 가이드 1개
- 명확한 authority chain
- 9-slice 계획과 연결된 실행 순서
- QA / evidence / commit / doc-sync 규칙
- 나중에 분리할 조건 명시

### 포함하면 안 되는 사항
- PRD 중복 작성 금지
- API / 상태 모델 중복 정의 금지
- 새로운 root `docs/` tree 금지
- 스캐폴딩 전 setup/runtime command 발명 금지
- Phase 2 / infra-vendor guidance 금지

## 검증 전략
> ZERO HUMAN INTERVENTION - 모든 검증은 agent가 실행 가능해야 한다.
- 문서 산출물 기준 tests-after
- 가이드는 `read`, `grep`만으로 검증 가능해야 한다.
- Evidence 경로: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## 실행 전략
### 병렬 실행 Wave
Wave 1: 가이드 범위와 authority chain 확정
Wave 2: 가이드 섹션 구조와 실행 연결 정리
Wave 3: 참조 정규화, 중복 위험 점검, handoff 정리

### 의존성 매트릭스
| Task | Depends On | Enables |
|------|------------|---------|
| 1 | none | 2, 3, 4, 5 |
| 2 | 1 | 3, 4, 5 |
| 3 | 1, 2 | 4, 5 |
| 4 | 1, 2, 3 | 5 |
| 5 | 1, 2, 3, 4 | Final verification |

### 에이전트 배치 요약
| Wave | Task Count | Categories |
|------|------------|------------|
| 1 | 1 | writing |
| 2 | 2 | writing, unspecified-high |
| 3 | 2 | writing |

## 작업 목록

- [ ] 1. 가이드 범위와 권위 정의

  **What to do**: 개발 진입 가이드를 단일 execution-entry 문서로 고정하고, 현재 authority chain(마스터 계획 -> 요구사항 -> PRD -> 설계 -> 정책 고정 -> 실행 기반) 아래에 둔다. 이 문서는 scope, architecture, product decision을 새로 만들지 않는다고 명시한다.
  **Must NOT do**: 기존 source-of-truth 파일과 경쟁하는 새 문서 계층을 만들면 안 된다.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: 문서 권위와 역할을 정하는 작업이다.
  - Skills: [`session-markdown-documentor`] - why needed: 읽기 쉬운 정확한 구조화가 필요하다.
  - Omitted: [`frontend-ui-ux`] - why not needed: UI 산출물이 아니다.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 2, 3, 4, 5 | Blocked By: none

  **References**:
  - `.sisyphus/plans/document-structure-plan.md`
  - `.sisyphus/drafts/phase1-execution-foundation.md`

  **Acceptance Criteria**:
  - [ ] 가이드가 기존 authority chain 아래에 있음을 명시한다.
  - [ ] 가이드가 두 번째 PRD / 아키텍처 문서가 되어서는 안 된다고 명시한다.

- [ ] 2. 마스터 개발 진입 가이드 구조 설계

  **What to do**: `.sisyphus/drafts/phase1-development-entry-guide.md`의 정확한 섹션 구조를 정의한다. 최소한 Purpose, When To Use, Authority Chain, Current Workspace Reality, Definition of Ready To Start Coding, Execution Order, Per-Slice Required Inputs, QA/Evidence Rules, Commit Rules, Doc-Sync Rules, Do Not Use This For가 있어야 한다.
  **Must NOT do**: 이미 다른 문서에 있는 상세 state model, API payload, PRD 기능 목록을 다시 쓰면 안 된다.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: 문서 구조 설계 작업이다.
  - Skills: [`session-markdown-documentor`] - why needed: 섹션 배치가 중요하다.
  - Omitted: [`playwright`] - why not needed: 브라우저 작업이 아니다.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 4, 5 | Blocked By: 1

  **Acceptance Criteria**:
  - [ ] 필요한 가이드 섹션이 명시된다.
  - [ ] 각 섹션이 기존 upstream 문서와 연결된다.

- [ ] 3. 가이드 내용을 기존 실행 규칙에 연결

  **What to do**: 가이드가 현재 9-slice 실행 순서, Wave 0 요구사항, evidence naming, TDD expectation, atomic commit 경계를 그대로 따르도록 연결한다. 가이드는 원문을 복사하지 않고 authoritative doc로 연결만 한다.
  **Must NOT do**: 슬라이스 순서나 정책 결정을 다시 정의하면 안 된다.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: guide-vs-plan drift를 막는 연결 작업이다.
  - Skills: [] - why needed: upstream 문서가 이미 존재한다.
  - Omitted: [`git-master`] - why not needed: history 분석 불필요.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 4, 5 | Blocked By: 1, 2

  **Acceptance Criteria**:
  - [ ] 가이드가 9-slice 순서를 명시적으로 따르도록 연결된다.
  - [ ] evidence, QA, commit 규칙이 새로 발명되지 않고 기존 문서를 참조한다.

- [ ] 4. 미래 가이드 분리 조건 정의

  **What to do**: setup/run/backend/frontend/qa guide로 나중에 분리할 수 있는 조건을 정의한다. 실제 scaffolded codebase, multiple executors, repeated onboarding confusion, stable runtime commands 같은 현실 조건만 허용한다.
  **Must NOT do**: 단순 취향만으로 지금 즉시 분리하는 것을 허용하면 안 된다.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: 미래 구조의 가드레일을 정하는 작업이다.
  - Skills: [] - why needed: 현재 워크스페이스 현실 기준으로 쓰면 된다.
  - Omitted: [`frontend-ui-ux`] - why not needed: UI 작업 아님.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: 5 | Blocked By: 2, 3

  **Acceptance Criteria**:
  - [ ] future split trigger가 객관적으로 적혀 있어야 한다.
  - [ ] 지금 full multi-doc guide suite는 premature라고 명시되어야 한다.

- [ ] 5. 참조 정규화 및 handoff 정리

  **What to do**: 새 가이드가 execution-foundation, implementation-breakdown 문서에서 어떻게 참조되는지 정하고, 구현자는 guide -> detailed source docs 순으로 봐야 한다는 handoff를 넣는다. non-goal도 같이 정리한다.
  **Must NOT do**: guide가 design stack보다 상위가 되는 authority loop를 만들면 안 된다.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: 최종 정리와 handoff 작업이다.
  - Skills: [`session-markdown-documentor`] - why needed: concise handoff 구조가 필요하다.
  - Omitted: [`playwright`] - why not needed: 브라우저 필요 없음.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: Final verification | Blocked By: 1, 2, 3, 4

  **Acceptance Criteria**:
  - [ ] guide가 circular authority 없이 참조되는 방식이 명시된다.
  - [ ] implementer가 guide 먼저, 그다음 detailed source docs를 보는 순서가 설명된다.
  - [ ] non-goal이 포함되어 중복을 방지한다.

## 최종 검증 Wave (4 parallel agents, ALL must APPROVE)
- [ ] F1. Plan Compliance Audit - oracle
- [ ] F2. Code Quality Review - unspecified-high
- [ ] F3. Real Manual QA - unspecified-high
- [ ] F4. Scope Fidelity Check - deep

## 커밋 전략
- 가이드 범위 / 권위 정의를 점진적으로 만들 경우 첫 커밋으로 분리 가능
- 미래 guide artifact는 가능하면 한 커밋으로 묶는다. 단일 진입 문서이기 때문이다.
- execution-foundation 또는 implementation-breakdown 참조 갱신이 있으면 가이드 커밋과 같이 묶는다.

## 성공 기준
- 팀이 중복 문서 계층이 아니라 명확한 pre-coding 개발 진입 가이드 1개를 갖게 된다.
- 가이드는 기존 authority 문서를 복제하지 않고 가리킨다.
- 스캐폴딩 이후 구현 시작 방식을 설명할 수 있다.
- 과도한 문서화 없이 실행 명확성을 유지한다.
