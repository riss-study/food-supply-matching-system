# Phase 1 Implementation Breakdown Plan

## TL;DR
> **Summary**: Convert the current Phase 1 trusted-matching design set into an ultrawork-ready implementation backlog with exact execution order, slice ownership, policy-closure tasks, and agent-executable verification.
> **Deliverables**:
> - execution-foundation artifact with exact local commands and fixture strategy
> - 9 vertical implementation slices mapped across frontend, backend, QA/validation, and docs/policy
> - policy-closure outputs for the 5 remaining operational gaps
> - final implementation-ready breakdown doc and review evidence
> **Effort**: Large
> **Parallel**: YES - 5 waves
> **Critical Path**: 1 -> 2/3 -> 4/5/6 -> 7 -> 8 -> 9/10 -> 11

## Context
### Original Request
Create the missing implementation task-breakdown document that should follow the current Phase 1 requirements, PRD, and design set.

### Interview Summary
- No new product-scope questions remain.
- Scope stays at the Phase 1 trusted-matching core.
- Existing design docs already define the 9-slice execution spine.
- The 5 operational policy answers now exist in `phase1-pre-coding-questions.md` and must be materialized into active docs.

### Metis Review (gaps addressed)
- Add Wave 0 to discover exact project commands and fixture strategy before any feature slice work.
- Convert 5 unresolved policy details into explicit owned tasks instead of leaving them as open questions.
- Keep slices vertical; do not split execution into frontend-only/backend-only phases.
- Include CQRS read-model/projection work where required.
- Require evidence-based QA and atomic commit boundaries per slice.

## Work Objectives
### Core Objective
Produce a decision-complete implementation breakdown that an executor can follow without re-deciding slice order, policy ownership, verification method, or commit boundaries.

### Deliverables
- `.sisyphus/plans/phase1-implementation-breakdown-plan.md`
- `.sisyphus/drafts/phase1-execution-foundation.md`
- `.sisyphus/drafts/phase1-policy-closure-log.md`
- implementation slice sequence aligned to existing design docs

### Definition of Done (verifiable conditions with commands)
- `read .sisyphus/plans/phase1-implementation-breakdown-plan.md` shows all 11 tasks plus final verification wave.
- `grep "Wave 0|Can Parallel|QA Scenarios|Commit:" .sisyphus/plans/phase1-implementation-breakdown-plan.md` returns each task block pattern.
- `grep "thread creation|approval gate|PATCH|revoke|hold" .sisyphus/plans/phase1-implementation-breakdown-plan.md` confirms the 5 policy gaps are explicitly owned.
- `grep "frontend|backend|QA/validation|docs/policy" .sisyphus/plans/phase1-implementation-breakdown-plan.md` confirms all workstreams are represented.

### Must Have
- Wave 0 execution foundation
- 9 fixed slices in execution order
- explicit dependency matrix
- explicit policy-closure tasks
- CQRS projection tasks where read models exist
- agent-executable QA scenarios and evidence paths

### Must NOT Have
- no Phase 2 features
- no infra vendor decision as a blocker
- no WebSocket/map/review/payment/AI scope expansion
- no frontend-only/backend-only sequencing
- no vague “verify it works” acceptance criteria

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: tests-after for the plan artifact; downstream implementation uses TDD inside each slice after Wave 0 locks exact commands.
- QA policy: Every task includes a plan-level validation scenario; downstream slice execution must include happy and denial paths.
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves
Wave 1: execution foundation + policy closure framework
Wave 2: auth/onboarding + supplier profile/verification + admin review
Wave 3: supplier discovery/read models + request lifecycle + quote lifecycle
Wave 4: message threads + contact share + notices/stats
Wave 5: implementation backlog normalization + final verification

### Dependency Matrix (full, all tasks)
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

### Agent Dispatch Summary
| Wave | Task Count | Categories |
|------|------------|------------|
| 1 | 1 | unspecified-high |
| 2 | 3 | unspecified-high, quick |
| 3 | 3 | unspecified-high, deep |
| 4 | 3 | unspecified-high |
| 5 | 1 | writing |

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [ ] 1. Wave 0 - Execution Foundation And Policy Lock

  **What to do**: Create the execution-foundation artifact that records the actual repo stack, exact local test/build/dev commands, fixture strategy, evidence file conventions, and worktree verification routine. In the same wave, materialize the already-answered 5 operational policy rules from `phase1-pre-coding-questions.md` into the policy closure layer and sync active docs.
  **Must NOT do**: Do not expand scope into Phase 2. Do not choose infra vendors. Do not start coding feature slices.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: combines repo reality discovery with policy closure and execution setup.
  - Skills: [`session-markdown-documentor`] - why needed: keep output traceable and precise.
  - Omitted: [`git-master`] - why not needed: no git workflow decision is required in the plan artifact.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 | Blocked By: none

  **References**:
  - Pattern: `.sisyphus/plans/document-structure-plan.md:157` - implementation task breakdown is the next intended artifact.
  - Pattern: `.sisyphus/design/phase1-design-baseline.md:97` - lists allowed remaining TBDs.
  - Pattern: `.sisyphus/design/phase1-design-baseline.md:109` - lists items that must not remain TBD.
  - Pattern: `.sisyphus/drafts/session-work-document-2026-03-11.md:177` - records the 5 unresolved operational rules.
  - Pattern: `.sisyphus/drafts/phase1-pre-coding-questions.md:52` - answered source for the 5 policy rules.
  - Pattern: `.sisyphus/drafts/phase1-policy-closure-log.md:20` - authoritative closure log after sync.

  **Acceptance Criteria**:
  - [ ] `.sisyphus/drafts/phase1-execution-foundation.md` exists and lists exact local commands for test/build/dev if code is present, or explicitly records that the repo is planning-only if code is absent.
  - [ ] `.sisyphus/drafts/phase1-policy-closure-log.md` exists and closes all 5 operational policy rules with no remaining judgment call.
  - [ ] Evidence paths and fixture/seed conventions are recorded for all later slices.

  **QA Scenarios**:
  ```text
  Scenario: Foundation artifact completeness
    Tool: Bash
    Steps: Run `ls .sisyphus/drafts`; run `grep "test|build|dev|fixture|evidence" ".sisyphus/drafts/phase1-execution-foundation.md"`; run `grep "thread creation|approval gate|PATCH|revoke|hold" ".sisyphus/drafts/phase1-policy-closure-log.md"`
    Expected: Both files exist; all required command/policy sections are present.
    Evidence: .sisyphus/evidence/task-1-execution-foundation.txt

  Scenario: No scope creep in policy closure
    Tool: Bash
    Steps: Run `grep "WebSocket|지도|리뷰|결제|AI 추천" ".sisyphus/drafts/phase1-policy-closure-log.md"`
    Expected: No out-of-scope Phase 2 feature appears in the policy file.
    Evidence: .sisyphus/evidence/task-1-execution-foundation-error.txt
  ```

  **Commit**: YES | Message: `docs(plan): lock execution foundation and policy rules` | Files: `.sisyphus/drafts/phase1-execution-foundation.md`, `.sisyphus/drafts/phase1-policy-closure-log.md`

- [ ] 2. Slice 1 - Auth, Roles, And Requester Business Onboarding

  **What to do**: Break the auth and requester onboarding slice into frontend, backend, QA, and docs/policy tasks. Include role selection, requester business profile create/read/update, requester approval gate behavior from Task 1, and acceptance/denial cases.
  **Must NOT do**: Do not include supplier verification or search read models here.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: auth, ownership, and role gating affect many later slices.
  - Skills: [] - why needed: current docs already define the baseline.
  - Omitted: [`frontend-ui-ux`] - why not needed: this task is execution planning, not visual design.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 6 | Blocked By: 1

  **References**:
  - API/Type: `.sisyphus/design/phase1-api-and-validation-spec.md:25` - auth and requester business endpoints.
  - Pattern: `.sisyphus/design/phase1-acceptance-scenarios-and-backlog.md:92` - first vertical slice.
  - Pattern: `.sisyphus/design/phase1-permissions-and-state-model.md:108` - permission matrix.

  **Acceptance Criteria**:
  - [ ] Slice breakdown lists backend tasks, frontend tasks, QA tasks, docs/policy tasks, and dependencies.
  - [ ] Requester approval-gate rule from Task 1 is referenced explicitly.
  - [ ] Acceptance and denial tests are attached to the slice.

  **QA Scenarios**:
  ```text
  Scenario: Slice 1 planning block exists
    Tool: Bash
    Steps: Run `grep "Slice 1|auth and role skeleton|requester business" ".sisyphus/plans/phase1-implementation-breakdown-plan.md"`
    Expected: Slice 1 task block and requester onboarding references are present.
    Evidence: .sisyphus/evidence/task-2-auth-onboarding.txt

  Scenario: Requester gate denial path included
    Tool: Bash
    Steps: Run `grep "approval gate|403|forbidden|denial" ".sisyphus/plans/phase1-implementation-breakdown-plan.md"`
    Expected: Requester approval-gate denial behavior is present in the slice planning text.
    Evidence: .sisyphus/evidence/task-2-auth-onboarding-error.txt
  ```

  **Commit**: YES | Message: `docs(plan): define auth and requester onboarding slice` | Files: `.sisyphus/plans/phase1-implementation-breakdown-plan.md`

- [ ] 3. Slice 2 - Supplier Profile And Verification Submission

  **What to do**: Break down supplier profile creation/editing, verification submission, certification attachment handling, validation, and supplier-side state visibility. Include write models, attachment metadata, and denial cases for incomplete submission.
  **Must NOT do**: Do not include admin review decisions in this slice; those belong to Slice 3.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: this slice anchors trust state and attachment handling.
  - Skills: [] - why needed: current design docs are sufficient.
  - Omitted: [`playwright`] - why not needed: browser verification is not needed at plan-authoring time.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 4, 5, 7, 9 | Blocked By: 1

  **References**:
  - Pattern: `.sisyphus/design/phase1-domain-and-data-model.md:31` - supplier profile aggregate.
  - Pattern: `.sisyphus/design/phase1-domain-and-data-model.md:49` - verification submission aggregate.
  - Pattern: `.sisyphus/design/phase1-api-and-validation-spec.md:37` - supplier profile and verification endpoints.
  - Test: `.sisyphus/design/phase1-acceptance-scenarios-and-backlog.md:23` - supplier happy path.

  **Acceptance Criteria**:
  - [ ] Slice breakdown covers supplier profile UI/API/model, verification submission, attachments, and validation rules.
  - [ ] Attachment validation and incomplete-submission denial tests are included.
  - [ ] Output lists the exact downstream dependency on admin review and supplier visibility.

  **QA Scenarios**:
  ```text
  Scenario: Supplier verification tasks mapped
    Tool: Bash
    Steps: Run `grep "Supplier Profile And Verification Submission|verification|attachment" ".sisyphus/plans/phase1-implementation-breakdown-plan.md"`
    Expected: Supplier profile, verification, and attachment planning content exists.
    Evidence: .sisyphus/evidence/task-3-supplier-verification.txt

  Scenario: Invalid upload denial present
    Tool: Bash
    Steps: Run `grep "invalid file|file type|file size|rejected" ".sisyphus/plans/phase1-implementation-breakdown-plan.md"`
    Expected: Invalid upload and denial behavior is included for this slice.
    Evidence: .sisyphus/evidence/task-3-supplier-verification-error.txt
  ```

  **Commit**: YES | Message: `docs(plan): define supplier profile and verification slice` | Files: `.sisyphus/plans/phase1-implementation-breakdown-plan.md`

- [ ] 4. Slice 3 - Admin Review Queue And Supplier State Decisions

  **What to do**: Break down admin review queue, review detail, approve/reject/hold actions, reviewer notes, user-visible note behavior, audit logging, and the final `hold` / `reject` / resubmission semantics from Task 1.
  **Must NOT do**: Do not include general platform moderation or support tooling beyond the review queue and supplier-state decisions.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: admin review is the trust-enforcement control plane.
  - Skills: [] - why needed: planning is grounded in existing requirements.
  - Omitted: [`frontend-ui-ux`] - why not needed: only task breakdown, not UI polish.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 5, 7, 9 | Blocked By: 1, 3

  **References**:
  - Pattern: `.sisyphus/design/phase1-permissions-and-state-model.md:136` - admin review decision rules.
  - API/Type: `.sisyphus/design/phase1-api-and-validation-spec.md:87` - admin review endpoints.
  - Test: `.sisyphus/design/phase1-acceptance-scenarios-and-backlog.md:33` - admin happy path.

  **Acceptance Criteria**:
  - [ ] Slice breakdown includes queue/read model tasks, action endpoints, audit tasks, QA, and docs/policy closure.
  - [ ] Hold vs reject vs resubmission behavior is explicit and referenced from Task 1.
  - [ ] Rejection reason enforcement and audit-log creation are included as non-happy-path verification.

  **QA Scenarios**:
  ```text
  Scenario: Admin decision semantics present
    Tool: Bash
    Steps: Run `grep "hold|reject|resubmission|audit" ".sisyphus/plans/phase1-implementation-breakdown-plan.md"`
    Expected: Decision semantics and audit requirements are present in the admin slice.
    Evidence: .sisyphus/evidence/task-4-admin-review.txt

  Scenario: Reject-without-reason failure included
    Tool: Bash
    Steps: Run `grep "reason code|reject without reason|409|400" ".sisyphus/plans/phase1-implementation-breakdown-plan.md"`
    Expected: The plan includes a failure path for invalid rejection actions.
    Evidence: .sisyphus/evidence/task-4-admin-review-error.txt
  ```

  **Commit**: YES | Message: `docs(plan): define admin review and supplier state slice` | Files: `.sisyphus/plans/phase1-implementation-breakdown-plan.md`

- [ ] 5. Slice 4 - Supplier Discovery, Search, And Detail Read Models

  **What to do**: Break down public/requester supplier listing, filtering, approved-only exposure, supplier detail read model, and CQRS projection tasks for search and detail surfaces. Include projection update verification and visibility gating.
  **Must NOT do**: Do not add maps, reviews, or ranking work beyond current deterministic filters.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: CQRS projection planning and visibility gating require careful dependency handling.
  - Skills: [] - why needed: internal docs already define the shape.
  - Omitted: [`playwright`] - why not needed: plan stage only.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 7 | Blocked By: 1, 3, 4

  **References**:
  - Pattern: `.sisyphus/design/phase1-domain-and-data-model.md:170` - MongoDB read models.
  - Pattern: `.sisyphus/design/phase1-permissions-and-state-model.md:44` - supplier exposure rules.
  - API/Type: `.sisyphus/design/phase1-api-and-validation-spec.md:45` - supplier discovery endpoints.

  **Acceptance Criteria**:
  - [ ] Slice breakdown includes write-side dependencies, projection jobs/read models, frontend listing/detail tasks, and QA.
  - [ ] Approved-only exposure logic is represented in both implementation tasks and denial-path tests.
  - [ ] Search filters are limited to current MVP filters only.

  **QA Scenarios**:
  ```text
  Scenario: Read-model tasks included
    Tool: Bash
    Steps: Run `grep "read model|projection|supplier search|supplier detail" ".sisyphus/plans/phase1-implementation-breakdown-plan.md"`
    Expected: Projection/read-model work is explicitly listed for discovery.
    Evidence: .sisyphus/evidence/task-5-discovery.txt

  Scenario: Unapproved exposure denial included
    Tool: Bash
    Steps: Run `grep "unapproved suppliers cannot appear in search|visibility gating" ".sisyphus/plans/phase1-implementation-breakdown-plan.md"`
    Expected: Exposure denial is part of discovery QA.
    Evidence: .sisyphus/evidence/task-5-discovery-error.txt
  ```

  **Commit**: YES | Message: `docs(plan): define supplier discovery and read-model slice` | Files: `.sisyphus/plans/phase1-implementation-breakdown-plan.md`

- [ ] 6. Slice 5 - Request Lifecycle And Targeting

  **What to do**: Break down request create/edit/open/close/cancel behavior, public vs targeted mode, targeted supplier linking, requester ownership rules, and request-state denial cases.
  **Must NOT do**: Do not bring quote comparison or messaging rules into this slice beyond request context dependencies.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: request mode and lifecycle drive quote and thread context.
  - Skills: [] - why needed: docs already specify the request structure.
  - Omitted: [`frontend-ui-ux`] - why not needed: no visual redesign here.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 7, 8, 9 | Blocked By: 1, 2

  **References**:
  - Pattern: `.sisyphus/design/phase1-information-architecture-and-flows.md:73` - request posting flow.
  - API/Type: `.sisyphus/design/phase1-api-and-validation-spec.md:50` - request endpoints.
  - Pattern: `.sisyphus/design/phase1-permissions-and-state-model.md:57` - request state model.

  **Acceptance Criteria**:
  - [ ] Slice breakdown includes request form/UI, request write model/API, targeted link management, QA, and docs/policy tasks.
  - [ ] Public vs targeted request behavior is explicit.
  - [ ] Closed/cancelled denial paths are included.

  **QA Scenarios**:
  ```text
  Scenario: Request lifecycle planning exists
    Tool: Bash
    Steps: Run `grep "Request Lifecycle And Targeting|public|targeted|close|cancel" ".sisyphus/plans/phase1-implementation-breakdown-plan.md"`
    Expected: Request lifecycle and mode planning is present.
    Evidence: .sisyphus/evidence/task-6-requests.txt

  Scenario: Closed/cancelled denial included
    Tool: Bash
    Steps: Run `grep "closed|cancelled|deny|forbidden" ".sisyphus/plans/phase1-implementation-breakdown-plan.md"`
    Expected: Request denial cases are explicitly covered.
    Evidence: .sisyphus/evidence/task-6-requests-error.txt
  ```

  **Commit**: YES | Message: `docs(plan): define request lifecycle slice` | Files: `.sisyphus/plans/phase1-implementation-breakdown-plan.md`

- [ ] 7. Slice 6 - Quote Submission, Selection, And Comparison

  **What to do**: Break down supplier quote create/update/withdraw, requester compare/select/decline flows, duplicate active quote prevention, quote `PATCH` semantics from Task 1, and comparison read-model work.
  **Must NOT do**: Do not bury thread creation rules here without explicitly referencing the thread-trigger policy from Task 1.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: quote semantics and comparison views cross state, permissions, and read models.
  - Skills: [] - why needed: current docs provide all inputs.
  - Omitted: [`git-master`] - why not needed: no repo history analysis needed.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 8, 9, 11 | Blocked By: 1, 3, 5, 6

  **References**:
  - Pattern: `.sisyphus/design/phase1-permissions-and-state-model.md:74` - quote state model.
  - API/Type: `.sisyphus/design/phase1-api-and-validation-spec.md:59` - quote endpoints.
  - Test: `.sisyphus/design/phase1-acceptance-scenarios-and-backlog.md:43` - duplicate/closed-request negative scenarios.
  - Pattern: `.sisyphus/design/phase1-domain-and-data-model.md:176` - quote comparison read model.

  **Acceptance Criteria**:
  - [ ] Slice breakdown includes create/update/withdraw/select/decline tasks, compare-view projection tasks, QA, and docs/policy closure.
  - [ ] Quote `PATCH` semantics are explicit and referenced from Task 1.
  - [ ] Duplicate active quote prevention is included in backend and QA tasks.

  **QA Scenarios**:
  ```text
  Scenario: Quote comparison and patch semantics present
    Tool: Bash
    Steps: Run `grep "Quote Submission, Selection, And Comparison|PATCH|duplicate|comparison" ".sisyphus/plans/phase1-implementation-breakdown-plan.md"`
    Expected: Quote patch semantics, duplicate prevention, and comparison tasks are present.
    Evidence: .sisyphus/evidence/task-7-quotes.txt

  Scenario: Duplicate quote denial included
    Tool: Bash
    Steps: Run `grep "duplicate active quote|409|closed request" ".sisyphus/plans/phase1-implementation-breakdown-plan.md"`
    Expected: Duplicate and closed-request denial cases are present.
    Evidence: .sisyphus/evidence/task-7-quotes-error.txt
  ```

  **Commit**: YES | Message: `docs(plan): define quote lifecycle and comparison slice` | Files: `.sisyphus/plans/phase1-implementation-breakdown-plan.md`

- [ ] 8. Slice 7 - Message Threads, Attachments, And Read State

  **What to do**: Break down thread creation behavior using the Task 1 trigger rule, thread list/detail/read models, message send/read flows, attachment validation, and denial cases for participant access.
  **Must NOT do**: Do not assume real-time transport guarantees beyond current MVP constraints.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: this slice closes the cross-role transaction loop.
  - Skills: [] - why needed: current docs define scope and constraints.
  - Omitted: [`playwright`] - why not needed: plan stage only.

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: 9, 11 | Blocked By: 1, 6, 7

  **References**:
  - Pattern: `.sisyphus/design/phase1-information-architecture-and-flows.md:105` - messaging flow context.
  - API/Type: `.sisyphus/design/phase1-api-and-validation-spec.md:68` - thread/message endpoints.
  - Pattern: `.sisyphus/design/phase1-domain-and-data-model.md:103` - thread/message aggregates.

  **Acceptance Criteria**:
  - [ ] Slice breakdown includes thread creation trigger, participant access, attachment validation, read state, and QA.
  - [ ] Thread creation trigger is explicit and referenced from Task 1.
  - [ ] Participant-access denial is included.

  **QA Scenarios**:
  ```text
  Scenario: Thread planning present
    Tool: Bash
    Steps: Run `grep "Message Threads, Attachments, And Read State|thread creation|attachment|read state" ".sisyphus/plans/phase1-implementation-breakdown-plan.md"`
    Expected: Thread trigger, attachment, and read-state planning are present.
    Evidence: .sisyphus/evidence/task-8-messaging.txt

  Scenario: Participant access denial included
    Tool: Bash
    Steps: Run `grep "thread participant|forbidden" ".sisyphus/plans/phase1-implementation-breakdown-plan.md"`
    Expected: Non-participant access denial is included.
    Evidence: .sisyphus/evidence/task-8-messaging-error.txt
  ```

  **Commit**: YES | Message: `docs(plan): define messaging slice` | Files: `.sisyphus/plans/phase1-implementation-breakdown-plan.md`

- [ ] 9. Slice 8 - Contact Share Consent

  **What to do**: Break down contact-share request/approve/revoke/retry behavior, bilateral reveal gating, denial cases for one-sided consent, and audit/logging expectations. Use the Task 1 revoke/retry policy as the exact rule source.
  **Must NOT do**: Do not collapse contact-share logic into generic thread behavior or expose contact details before bilateral approval.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: closes a trust-sensitive policy slice with clear cross-role effects.
  - Skills: [] - why needed: current docs define scope; Task 1 closes final semantics.
  - Omitted: [`playwright`] - why not needed: plan stage only.

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: 11 | Blocked By: 1, 7, 8

  **References**:
  - Pattern: `.sisyphus/design/phase1-permissions-and-state-model.md:91` - contact-share state model.
  - API/Type: `.sisyphus/design/phase1-api-and-validation-spec.md:76` - contact-share endpoints.
  - Test: `.sisyphus/design/phase1-acceptance-scenarios-and-backlog.md:49` - one-sided consent denial scenario.

  **Acceptance Criteria**:
  - [ ] Slice breakdown includes request/approve/revoke/retry tasks, reveal gating, audit tasks, QA, and docs/policy tasks.
  - [ ] Revoke/retry semantics are explicit and referenced from Task 1.
  - [ ] One-sided consent denial and premature reveal denial are included.

  **QA Scenarios**:
  ```text
  Scenario: Contact-share policy planning present
    Tool: Bash
    Steps: Run `grep "Slice 8 - Contact Share Consent|revoke|retry|bilateral|contact reveal" ".sisyphus/plans/phase1-implementation-breakdown-plan.md"`
    Expected: Contact-share semantics and reveal gating are present.
    Evidence: .sisyphus/evidence/task-9-contact-share.txt

  Scenario: One-sided denial included
    Tool: Bash
    Steps: Run `grep "one-sided consent|premature reveal|forbidden" ".sisyphus/plans/phase1-implementation-breakdown-plan.md"`
    Expected: One-sided or premature reveal denial is included.
    Evidence: .sisyphus/evidence/task-9-contact-share-error.txt
  ```

  **Commit**: YES | Message: `docs(plan): define contact-share slice` | Files: `.sisyphus/plans/phase1-implementation-breakdown-plan.md`

- [ ] 10. Slice 9 - Notices, Admin Summary, And Basic Stats Read Models

  **What to do**: Break down notice CRUD for admins, public/read access for notices, stats summary projections, and minimal operational metrics. Include admin-only authorization and read-model verification.
  **Must NOT do**: Do not add advanced analytics beyond current basic stats scope.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: closes the remaining admin/public read surfaces without expanding into analytics products.
  - Skills: [] - why needed: current docs define notice/stats scope.
  - Omitted: [`frontend-ui-ux`] - why not needed: planning only.

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: 11 | Blocked By: 1, 3, 4

  **References**:
  - API/Type: `.sisyphus/design/phase1-api-and-validation-spec.md:82` - notice and admin stats endpoints.
  - Pattern: `.sisyphus/design/phase1-domain-and-data-model.md:177` - stats summary view.
  - Test: `.sisyphus/design/phase1-acceptance-scenarios-and-backlog.md:85` - admin notices/stats test types.

  **Acceptance Criteria**:
  - [ ] Slice breakdown includes notice write/read tasks, stats projection tasks, auth rules, and QA.
  - [ ] Public notice read and admin-only write paths are explicit.
  - [ ] Basic stats stay within current MVP scope.

  **QA Scenarios**:
  ```text
  Scenario: Notice and stats planning present
    Tool: Bash
    Steps: Run `grep "Notices, Admin Summary, And Basic Stats|notice|stats" ".sisyphus/plans/phase1-implementation-breakdown-plan.md"`
    Expected: Notice and stats slice planning is present.
    Evidence: .sisyphus/evidence/task-10-notices-stats.txt

  Scenario: Admin-only write access included
    Tool: Bash
    Steps: Run `grep "admin-only|forbidden|public notice read" ".sisyphus/plans/phase1-implementation-breakdown-plan.md"`
    Expected: Public read/admin write split is part of the slice QA.
    Evidence: .sisyphus/evidence/task-10-notices-stats-error.txt
  ```

  **Commit**: YES | Message: `docs(plan): define notices and stats slice` | Files: `.sisyphus/plans/phase1-implementation-breakdown-plan.md`

- [ ] 11. Normalize Into Delivery Backlog And Review-Ready Handoff

  **What to do**: Convert Tasks 1-10 into executor-facing backlog units grouped by wave and workstream. Each unit must include inputs, outputs, dependencies, verification method, evidence target, and atomic commit boundary. Add final handoff guidance to use the 9-slice order and to preserve document sync.
  **Must NOT do**: Do not re-open any product decision that was already locked.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: this task consolidates and normalizes the final artifact for execution.
  - Skills: [`session-markdown-documentor`] - why needed: final document clarity and traceability.
  - Omitted: [`playwright`] - why not needed: no browser action required.

  **Parallelization**: Can Parallel: NO | Wave 5 | Blocks: Final verification | Blocked By: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10

  **References**:
  - Pattern: `.sisyphus/design/phase1-acceptance-scenarios-and-backlog.md:90` - 9-slice backlog order.
  - Pattern: `.sisyphus/plans/document-structure-plan.md:231` - verification expectation for the implementation breakdown document.
  - Pattern: `.sisyphus/plans/document-structure-plan.md:246` - change propagation rules.

  **Acceptance Criteria**:
  - [ ] Final plan contains 11 tasks, 5 waves, full dependency matrix, commit strategy, and final verification wave.
  - [ ] Every slice includes frontend, backend, QA/validation, and docs/policy treatment.
  - [ ] Final handoff explains how to start execution without re-discovery.

  **QA Scenarios**:
  ```text
  Scenario: Final backlog normalization complete
    Tool: Bash
    Steps: Run `grep "Wave 1|Wave 2|Wave 3|Wave 4|Wave 5|frontend|backend|QA/validation|docs/policy" ".sisyphus/plans/phase1-implementation-breakdown-plan.md"`
    Expected: Waves and all workstreams appear in the final plan.
    Evidence: .sisyphus/evidence/task-11-normalization.txt

  Scenario: All slices represented
    Tool: Bash
    Steps: Run `grep "Slice 1|Slice 2|Slice 3|Slice 4|Slice 5|Slice 6|Slice 7|Slice 8|Slice 9" ".sisyphus/plans/phase1-implementation-breakdown-plan.md"`
    Expected: All implementation slices are present in the final plan.
    Evidence: .sisyphus/evidence/task-11-normalization-error.txt
  ```

  **Commit**: YES | Message: `docs(plan): finalize phase1 implementation breakdown` | Files: `.sisyphus/plans/phase1-implementation-breakdown-plan.md`

## Final Verification Wave (4 parallel agents, ALL must APPROVE)
- [ ] F1. Plan Compliance Audit - oracle
- [ ] F2. Code Quality Review - unspecified-high
- [ ] F3. Real Manual QA - unspecified-high
- [ ] F4. Scope Fidelity Check - deep

## Commit Strategy
- Commit after Task 1 to freeze execution foundation and policy closure.
- Commit after each slice task to keep boundaries atomic.
- Keep one coherent slice per commit; do not mix distant slices.
- Preserve doc sync: if a policy closure changes a baseline assumption, update the linked requirements/PRD/design docs in the same commit.

## Success Criteria
- The executor can start with Wave 1 and reach Wave 5 without deciding slice order, ownership, or verification style.
- The 5 operational policy gaps are closed before feature implementation begins.
- Every slice has explicit frontend, backend, QA/validation, and docs/policy work.
- CQRS read-model work appears wherever discovery, comparison, thread summary, review queue, or stats require it.
- The final breakdown remains inside the Phase 1 trusted-matching scope.
