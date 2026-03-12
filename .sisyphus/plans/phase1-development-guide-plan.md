# Phase 1 Development Guide Plan

## TL;DR
> **Summary**: Create one thin pre-coding development entry guide that tells implementers where to start, which documents are authoritative, how to execute slices, and what must not be re-decided.
> **Deliverables**:
> - `.sisyphus/drafts/phase1-development-entry-guide.md`
> - updated references from execution-foundation and implementation-breakdown docs if needed
> - split triggers for when a future multi-doc guide layer becomes justified
> **Effort**: Short
> **Parallel**: NO
> **Critical Path**: 1 -> 2 -> 3 -> 4 -> 5

## Context
### Original Request
Before coding, consider whether a development-guide document like the user-provided example should be created first.

### Interview Summary
- The user prefers creating guide documentation before coding.
- The pasted example is a useful pattern, but our workspace is still planning-only.
- Current `.sisyphus` docs already cover scope, PRD, design, policy closure, and execution planning.
- The real gap is an execution entrypoint, not another large documentation hierarchy.

### Metis Review (gaps addressed)
- Keep the guide execution-only; do not create a second PRD or architecture layer.
- Avoid a new root `docs/` tree because there is no product codebase yet.
- Prevent authority loops by making the guide explicitly subordinate to the current source-of-truth chain.
- Preserve evidence, QA, and commit conventions already defined in the implementation breakdown plan.

## Work Objectives
### Core Objective
Produce a decision-complete plan for one master development entry guide that helps future executors start implementation without duplicating existing planning/design documents.

### Deliverables
- `.sisyphus/plans/phase1-development-guide-plan.md`
- `.sisyphus/drafts/phase1-development-entry-guide.md`
- optional reference updates in `.sisyphus/drafts/phase1-execution-foundation.md`
- optional reference updates in `.sisyphus/plans/phase1-implementation-breakdown-plan.md`

### Definition of Done (verifiable conditions with commands)
- `read .sisyphus/plans/phase1-development-guide-plan.md` shows a single-guide strategy, not a multi-doc guide tree.
- `grep "development entry guide|Authority Chain|Execution Order|Do Not Use This For" .sisyphus/plans/phase1-development-guide-plan.md` confirms the core sections are planned.
- `grep "docs/|backend-guide|frontend-guide|design-system" .sisyphus/plans/phase1-development-guide-plan.md` does not imply immediate creation of a full docs hierarchy.

### Must Have
- one single-file guide as the immediate target
- explicit authority chain
- explicit execution order tied to the 9-slice plan
- QA/evidence/commit/doc-sync rules
- split triggers for future guide expansion

### Must NOT Have
- no duplicate PRD content
- no duplicate API/state-model definitions
- no new root `docs/` tree yet
- no setup/runtime commands invented before scaffolding exists
- no Phase 2 or infra-vendor guidance

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: tests-after for the document artifact.
- QA policy: the guide must be verifiable with `read` and `grep` only.
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves
Wave 1: establish guide boundaries and authority chain
Wave 2: define guide content and execution sections
Wave 3: normalize references, review duplication risks, and handoff

### Dependency Matrix (full, all tasks)
| Task | Depends On | Enables |
|------|------------|---------|
| 1 | none | 2, 3, 4, 5 |
| 2 | 1 | 3, 4, 5 |
| 3 | 1, 2 | 4, 5 |
| 4 | 1, 2, 3 | 5 |
| 5 | 1, 2, 3, 4 | Final verification |

### Agent Dispatch Summary
| Wave | Task Count | Categories |
|------|------------|------------|
| 1 | 1 | writing |
| 2 | 2 | writing, unspecified-high |
| 3 | 2 | writing |

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [ ] 1. Define Guide Scope And Authority

  **What to do**: Lock the guide as a single execution-entry document and explicitly place it below the current authority chain: master plan -> requirements -> PRD -> design -> policy closure -> execution foundation. State that the guide does not own scope, architecture, or product decisions.
  **Must NOT do**: Do not create a new documentation layer that competes with existing source-of-truth files.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: this is a documentation-authority definition task.
  - Skills: [`session-markdown-documentor`] - why needed: precise, readable structure.
  - Omitted: [`frontend-ui-ux`] - why not needed: not a UI artifact.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 2, 3, 4, 5 | Blocked By: none

  **References**:
  - Pattern: `.sisyphus/plans/document-structure-plan.md:35` - existing authority chain.
  - Pattern: `.sisyphus/drafts/phase1-execution-foundation.md:96` - says the next artifact is a pre-coding TASK/doc structure.
  - Pattern: `.sisyphus/drafts/phase1-development-guide-strategy.md:10` - draft rationale for a thin guide.

  **Acceptance Criteria**:
  - [ ] The plan states the guide is subordinate to the existing authority chain.
  - [ ] The plan explicitly forbids turning the guide into a second PRD or architecture spec.

  **QA Scenarios**:
  ```text
  Scenario: Authority chain is explicit
    Tool: Bash
    Steps: Run `grep "authority chain|master plan|requirements|PRD|design|policy closure|execution foundation" ".sisyphus/plans/phase1-development-guide-plan.md"`
    Expected: The plan clearly defines the guide's place in the hierarchy.
    Evidence: .sisyphus/evidence/task-1-guide-scope.txt

  Scenario: No parallel doc-layer expansion
    Tool: Bash
    Steps: Run `grep "new root docs|full guide tree|backend-guide|frontend-guide|design-system" ".sisyphus/plans/phase1-development-guide-plan.md"`
    Expected: The plan does not require immediate expansion to a large guide suite.
    Evidence: .sisyphus/evidence/task-1-guide-scope-error.txt
  ```

  **Commit**: YES | Message: `docs(plan): define development guide scope` | Files: `.sisyphus/plans/phase1-development-guide-plan.md`

- [ ] 2. Design The Master Development Entry Guide Structure

  **What to do**: Define the exact section structure of `.sisyphus/drafts/phase1-development-entry-guide.md`. At minimum include: Purpose, When To Use, Authority Chain, Current Workspace Reality, Definition of Ready To Start Coding, Execution Order, Per-Slice Required Inputs, QA/Evidence Rules, Commit Rules, Doc-Sync Rules, and Do Not Use This For.
  **Must NOT do**: Do not restate detailed state models, API payloads, or PRD feature lists already covered elsewhere.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: this is structural document design.
  - Skills: [`session-markdown-documentor`] - why needed: exact section organization.
  - Omitted: [`playwright`] - why not needed: no browser interaction.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 4, 5 | Blocked By: 1

  **References**:
  - Pattern: `.sisyphus/drafts/phase1-execution-foundation.md:82` - next planning steps.
  - Pattern: `.sisyphus/plans/phase1-implementation-breakdown-plan.md:68` - execution waves.
  - Test: `.sisyphus/design/phase1-acceptance-scenarios-and-backlog.md:104` - definition of ready concepts.

  **Acceptance Criteria**:
  - [ ] The plan lists the exact guide sections to be created.
  - [ ] Each section is mapped to an existing upstream source document.

  **QA Scenarios**:
  ```text
  Scenario: Required guide sections present
    Tool: Bash
    Steps: Run `grep "Purpose|When To Use|Authority Chain|Current Workspace Reality|Execution Order|QA|Commit|Doc-Sync|Do Not Use This For" ".sisyphus/plans/phase1-development-guide-plan.md"`
    Expected: All required sections are present in the plan.
    Evidence: .sisyphus/evidence/task-2-guide-structure.txt

  Scenario: No duplicated deep-spec sections
    Tool: Bash
    Steps: Run `grep "API payload schema|full ERD|full state table|feature scope appendix" ".sisyphus/plans/phase1-development-guide-plan.md"`
    Expected: The plan does not demand duplicated deep-spec content.
    Evidence: .sisyphus/evidence/task-2-guide-structure-error.txt
  ```

  **Commit**: YES | Message: `docs(plan): define development entry guide structure` | Files: `.sisyphus/plans/phase1-development-guide-plan.md`

- [ ] 3. Bind Guide Content To Existing Execution Rules

  **What to do**: Map the guide’s execution sections to the existing 9-slice implementation order, Wave 0 requirements, evidence naming conventions, TDD expectations, and atomic commit boundaries. Make the guide point outward to authoritative docs instead of copying them.
  **Must NOT do**: Do not let the guide redefine slice order or policy decisions.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: this task prevents guide-vs-plan divergence.
  - Skills: [] - why needed: upstream docs already exist.
  - Omitted: [`git-master`] - why not needed: no repo-history work.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 4, 5 | Blocked By: 1, 2

  **References**:
  - Pattern: `.sisyphus/plans/phase1-implementation-breakdown-plan.md:68` - execution waves.
  - Pattern: `.sisyphus/plans/phase1-implementation-breakdown-plan.md:100` - task/slice structure.
  - Pattern: `.sisyphus/plans/phase1-implementation-breakdown-plan.md:542` - commit strategy.
  - Pattern: `.sisyphus/plans/phase1-implementation-breakdown-plan.md:66` - evidence naming pattern.

  **Acceptance Criteria**:
  - [ ] The plan explicitly binds the future guide to the existing 9-slice order.
  - [ ] Evidence, QA, and commit rules are referenced from upstream docs instead of rewritten from scratch.

  **QA Scenarios**:
  ```text
  Scenario: Execution mapping is explicit
    Tool: Bash
    Steps: Run `grep "Wave 0|9-slice|evidence|atomic commit|TDD" ".sisyphus/plans/phase1-development-guide-plan.md"`
    Expected: Execution rules are clearly mapped into the guide plan.
    Evidence: .sisyphus/evidence/task-3-guide-binding.txt

  Scenario: No slice-order divergence
    Tool: Bash
    Steps: Run `grep "redefine slice order|change wave order|override policy" ".sisyphus/plans/phase1-development-guide-plan.md"`
    Expected: The plan does not permit redefinition of existing execution order or policies.
    Evidence: .sisyphus/evidence/task-3-guide-binding-error.txt
  ```

  **Commit**: YES | Message: `docs(plan): bind guide to existing execution rules` | Files: `.sisyphus/plans/phase1-development-guide-plan.md`

- [ ] 4. Define Split Triggers For Future Guide Expansion

  **What to do**: Define explicit conditions under which the single-file guide may later split into setup/run/backend/frontend/qa guides. Use real triggers only: actual scaffolded codebase, multiple executors, repeated onboarding confusion, or stable runtime commands.
  **Must NOT do**: Do not authorize immediate splitting based on preference alone.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: this is a future-structure guardrail task.
  - Skills: [] - why needed: grounded in current workspace reality.
  - Omitted: [`frontend-ui-ux`] - why not needed: no UI work.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: 5 | Blocked By: 2, 3

  **References**:
  - Pattern: `.sisyphus/drafts/phase1-execution-foundation.md:27` - planning-only workspace reality.
  - Pattern: `.sisyphus/drafts/phase1-execution-foundation.md:45` - commands are not real yet.
  - Pattern: `.sisyphus/drafts/phase1-development-guide-strategy.md:21` - avoid unnecessary document bulk.

  **Acceptance Criteria**:
  - [ ] The plan lists objective split triggers for future guide expansion.
  - [ ] The plan explicitly says a full multi-doc guide suite is premature today.

  **QA Scenarios**:
  ```text
  Scenario: Expansion triggers are objective
    Tool: Bash
    Steps: Run `grep "multiple executors|scaffolded codebase|runtime commands|onboarding confusion" ".sisyphus/plans/phase1-development-guide-plan.md"`
    Expected: Future split triggers are concrete and objective.
    Evidence: .sisyphus/evidence/task-4-guide-expansion.txt

  Scenario: No premature guide-suite mandate
    Tool: Bash
    Steps: Run `grep "must create backend guide now|must create frontend guide now|must create docs tree now" ".sisyphus/plans/phase1-development-guide-plan.md"`
    Expected: The plan does not prematurely force a large guide suite.
    Evidence: .sisyphus/evidence/task-4-guide-expansion-error.txt
  ```

  **Commit**: YES | Message: `docs(plan): define future guide split triggers` | Files: `.sisyphus/plans/phase1-development-guide-plan.md`

- [ ] 5. Normalize References And Handoff

  **What to do**: Finish the plan by specifying how the new guide will be referenced from execution-foundation and implementation-breakdown docs, and how executors should use it first before diving into detailed design docs. Include final handoff wording and non-goals.
  **Must NOT do**: Do not create authority loops where the guide becomes upstream of the design stack.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: final normalization and handoff.
  - Skills: [`session-markdown-documentor`] - why needed: concise handoff structure.
  - Omitted: [`playwright`] - why not needed: no browser requirement.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: Final verification | Blocked By: 1, 2, 3, 4

  **References**:
  - Pattern: `.sisyphus/drafts/phase1-execution-foundation.md:96` - next artifact context.
  - Pattern: `.sisyphus/plans/phase1-implementation-breakdown-plan.md:497` - handoff task style.
  - Pattern: `.sisyphus/drafts/phase1-policy-closure-log.md:171` - propagation targets.

  **Acceptance Criteria**:
  - [ ] The plan specifies how the guide is referenced without creating circular authority.
  - [ ] The plan explains the implementer entry sequence: guide first, then detailed source docs.
  - [ ] The plan includes non-goals to prevent duplication.

  **QA Scenarios**:
  ```text
  Scenario: Handoff sequence is explicit
    Tool: Bash
    Steps: Run `grep "guide first|then detailed source docs|non-goals|authority loop" ".sisyphus/plans/phase1-development-guide-plan.md"`
    Expected: Handoff order and anti-loop rules are present.
    Evidence: .sisyphus/evidence/task-5-guide-handoff.txt

  Scenario: No circular authority
    Tool: Bash
    Steps: Run `grep "guide is upstream of PRD|guide overrides design" ".sisyphus/plans/phase1-development-guide-plan.md"`
    Expected: The plan does not allow circular authority or override behavior.
    Evidence: .sisyphus/evidence/task-5-guide-handoff-error.txt
  ```

  **Commit**: YES | Message: `docs(plan): finalize development guide plan` | Files: `.sisyphus/plans/phase1-development-guide-plan.md`

## Final Verification Wave (4 parallel agents, ALL must APPROVE)
- [ ] F1. Plan Compliance Audit - oracle
- [ ] F2. Code Quality Review - unspecified-high
- [ ] F3. Real Manual QA - unspecified-high
- [ ] F4. Scope Fidelity Check - deep

## Commit Strategy
- Commit after the guide-scope/authority definition if created incrementally.
- Keep the future guide artifact in one commit if possible because it is a single-entry document.
- Any reference updates in execution-foundation or implementation-breakdown must be committed together with the guide artifact.

## Success Criteria
- The team has one clear pre-coding development entry guide and not a competing new doc layer.
- The guide points to existing authority documents instead of duplicating them.
- The guide explains how to start implementation once scaffolding exists.
- The plan avoids over-documentation while preserving execution clarity.
