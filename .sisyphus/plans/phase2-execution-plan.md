# Phase 2 Execution Plan

Date: 2026-03-25
Status: Draft

## 1. Intent

Phase 2 extends the Phase 1 matching core without reopening the product surface too broadly.

The goal is to improve trust, relevance, and execution quality around the existing supplier discovery -> request -> quote -> thread flow before taking on heavy external integrations or brand-new business domains.

## 2. Non-goals

- No expansion into payment, escrow, e-contract, or dispute workflows in the first Phase 2 wave.
- No OCR, external verification APIs, AI recommendation, or chatbot automation in the first Phase 2 wave.
- No map provider, CDN, file-storage vendor, or real-time transport decision unless required by a gated pilot or launch milestone.
- No broad platform rewrite or premature package extraction without repeated cross-app reuse.

## 3. Current State Snapshot

- Phase 1 is complete and verified end to end.
- Core requester, supplier, admin, quote, thread, contact-share, notice, and stats flows are present.
- Architecture remains dual frontend + dual backend server + CQRS.
- Local compose is already split by datastore.
- Remaining known issues after Phase 1 are small and concrete:
  - React Router v7 future-flag warnings remain in tests.
  - Admin stats currently use deterministic runtime aggregation.
  - Browser-driven seeded acceptance coverage is still light.

## 4. Hidden Assumptions

- Admin user/supplier list capability may still be completion debt rather than true new scope.
- Current local-first runtime configuration is not evidence of launch readiness. In other words, "works on a developer machine" is not the same as "ready to launch."
- Deterministic admin stats are acceptable only while usage remains small. This is a practical temporary choice, not a long-term scaling strategy.
- The next milestone may be either a pilot launch or another feature wave; the order changes depending on that decision.

## 5. Phase 2 Principles

- Deepen the current loop before creating a new one.
- Prefer vertical slices over broad infrastructure programs.
- Fix only the architectural hotspots touched by the chosen Phase 2 epics.
- Keep backend boundaries aligned to existing modules.
- Land only green commits; red-green-refactor happens locally, not in shared history.
- Preserve code-first OpenAPI and existing evidence discipline.

## 6. Recommended Priority Order

### P0. Launch Readiness and Execution Baseline

These items are cheap, reduce risk, and establish a reliable delivery baseline before feature expansion.

- Browser-driven acceptance baseline for the critical end-to-end flows.
- CI/check automation that runs the existing backend/frontend green paths consistently.
- React Router warning cleanup in tests and route configuration.
- Replace generic frontend READMEs with repository-specific run/test/deploy docs where still thin.
- Externalize runtime config and define a non-local deployment posture for secrets/storage assumptions.

### P1. MVP Completion Debt

These are already partially specified and have the best cost-to-certainty ratio.

- Decision item: confirm whether admin requester/supplier lists are unfinished MVP scope or true Phase 2 scope.
- Admin review history and audit exposure improvements.
- Supplier discovery sort/filter/index completion.
- Admin Swagger/example polish where Phase 1 intentionally stopped at code-first baseline.

### P2. Matching-Core Extension

Choose one narrow product-extension wave that improves trust or conversion on the current core.

Recommended first candidate:

- Reviews and ratings anchored to completed request/quote relationships.

Secondary candidates after that:

- Supplier profile completeness improvements.
- Onboarding and notification UX polish.

### P3. Scalability Hardening

Do these after the first feature wave establishes where actual load and friction exist.

- Replace the hottest in-memory filtered reads with repository-backed pagination/sorting.
- Revisit admin stats projection/caching if aggregation cost becomes visible.
- Expand seed and evidence coverage into repeatable smoke suites.
- Harden file-storage path only when launch or scale requires a vendor decision.

### P4. Deferred Expansion Tracks

These remain Phase 2+ candidates, not first-wave Phase 2 scope.

- Map-based discovery
- Real-time communication upgrades
- OCR automation
- External verification APIs
- AI recommendation/tagging/FAQ
- Payment, escrow, e-contract
- Community and content features

## 7. Why This Order

- It maximizes reuse of existing request, quote, thread, supplier, and admin-review modules.
- It delays vendor and transport decisions that the PRD still marks as open.
- It avoids prematurely optimizing admin stats or platform infra before usage signals exist.
- It focuses new product value on trust and conversion inside the already-working matching loop.

## 8. Architectural Guardrails

- Keep write concerns in `command-domain-*` and relational persistence.
- Keep read concerns in `query-model-*` only when read complexity justifies it.
- Keep `projection` for cross-model update paths; do not hide write-side rules in projection code.
- Prefer runtime aggregation for small-scope admin metrics until real cost appears.
- Do not extract new shared frontend packages unless at least two apps need the exact same concern.
- Avoid layering realtime or external-provider behavior onto synchronous write paths until those write paths are explicitly hardened.

## 9. Must Not Have In First-Wave Phase 2

- AI recommendation, OCR, external verification APIs, payment, escrow, e-contract, and community features in the same milestone as launch-readiness work.
- Multiple new product tracks starting in parallel.
- Broad platform rewrites without a concrete hotspot or repeated reuse signal.

## 10. Phase 2 Wave Plan

### Wave 0 - Planning Freeze

- Create Phase 2 subplan index.
- Break the selected P0/P1/P2 items into atomic subplans.
- Define verification commands and evidence targets per task.

### Wave 1 - Launch Readiness and Delivery Baseline

- CI/check harness
- Browser acceptance skeleton
- Router warning cleanup
- Frontend doc cleanup

### Wave 2 - MVP Completion Debt Closure

- Admin review history/audit follow-through
- Supplier discovery backend sorting and indexing
- Supplier discovery UI sort/filter follow-through
- Swagger/example polish for admin/public endpoints

### Wave 3 - Controlled Product Extension

- Reviews and ratings vertical slice
- Trust/relevance UX refinement around supplier discovery and quote follow-up

### Wave 4 - Scalability and Operability Gate

- Hot query hardening
- Stats aggregation review
- Storage/runtime decision gate only if justified by launch scope or usage

## 11. Task Candidates

Suggested initial Phase 2 task list:

1. `phase2-task-01-e2e-and-ci-baseline`
2. `phase2-task-02-router-and-doc-hygiene`
3. `phase2-task-03-admin-review-history-and-audit`
4. `phase2-task-04-supplier-discovery-sort-and-index`
5. `phase2-task-05-swagger-and-contract-polish`
6. `phase2-task-06-reviews-and-ratings-foundation`
7. `phase2-task-07-hot-query-hardening`

## 12. TDD and Verification Matrix

Each Phase 2 task should declare:

- command/domain tests if write logic changes
- query/projection tests if read models change
- server/application/controller tests for API contract changes
- frontend hook/page tests for UI behavior
- browser-level smoke coverage where the flow matters
- exact evidence commands and captured outputs

## 13. Evidence Rules

- Use `.sisyphus/evidence/phase2-task-xx-<slug>.txt` for each task.
- Record exact commands, pass/fail results, and any scoped warnings.
- Keep one short decision note when architectural tradeoffs matter.

## 14. Atomic Commit Strategy

- `docs(phase2): freeze roadmap, assumptions, and wave priorities`
- `test(e2e): add failing browser acceptance harness`
- `ci: add backend and frontend build-test workflow`
- `chore(config): externalize runtime config and secret handling`
- `test(scope): add characterization coverage`
- `feat(scope): implement backend vertical slice`
- `feat(scope): wire frontend vertical slice`
- `docs(scope): sync evidence and plan status`

For larger slices, split backend and frontend commits. For small slices, keep one green vertical commit.

## 15. Exit Criteria For First Phase 2 Milestone

- P0 baseline is complete.
- P1 residual gaps are closed.
- One narrow P2 product-extension slice is delivered.
- Backend and both frontend apps remain green on full build/test runs.
- New evidence artifacts exist for every Phase 2 task.

## 16. Escalation Trigger

If the next milestone is a pilot or production launch rather than another feature wave, reorder work so these happen before new product scope:

- admin-role enforcement audit
- local file-storage replacement decision
- hot query pagination/sort hardening
- browser acceptance coverage on launch-critical flows
