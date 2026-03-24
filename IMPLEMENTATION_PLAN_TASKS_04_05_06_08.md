# Implementation Plan: Closing Partial Items in Tasks 04, 05, 06, 08

**Date:** 2026-03-20  
**Scope:** Backend changes, frontend changes, verification commands, and doc status transitions  
**Status:** Implementation-Ready Plan (No File Edits Performed)

---

## Executive Summary

This plan addresses the remaining partial items from Tasks 04, 05, 06, and 08 based on the 2026-03-20 re-audit. Each task has core acceptance criteria satisfied but has UI/UX refinements, API enhancements, and infrastructure items that remain unimplemented or unverified.

**Boundary Policy:** Items beyond the current task scope (Task 09+, generic refactors) are explicitly marked as "KEEP PARTIAL" with justification.

---

## Task 04: Supplier Profile and Verification Submission

### Current Status: 🟡 Partial
**Evidence File:** `.sisyphus/evidence/task-4-supplier-verification.txt`  
**SubPlan:** `.sisyphus/plans/phase1-subplans/phase1-task-04-supplier-verification.md`

### Partial Items to Implement

#### 1. Storage Adapter Interface Abstraction (SubTask 4.3)

**Current State:**
- `LocalFileStorageService.kt` exists with local file storage only
- No abstraction interface for S3/cloud storage swapping

**Files to Create:**
| Priority | File Path | Description |
|----------|-----------|-------------|
| P1 | `backend/shared-core/src/main/kotlin/dev/riss/fsm/shared/file/FileStorageService.kt` | Interface with `store()`, `delete()`, `getUrl()` methods |
| P2 | `backend/api-server/src/main/kotlin/dev/riss/fsm/api/config/StorageConfig.kt` | Bean configuration for storage adapter selection via properties |

**Files to Modify:**
| Priority | File Path | Changes |
|----------|-----------|---------|
| P1 | `backend/api-server/src/main/kotlin/dev/riss/fsm/api/supplier/LocalFileStorageService.kt` | Add `implements FileStorageService` interface |
| P1 | `backend/api-server/src/main/kotlin/dev/riss/fsm/api/supplier/SupplierProfileApplicationService.kt` | Inject `FileStorageService` interface instead of concrete class |

**Verification:**
```bash
./gradlew :api-server:compileKotlin
```

---

#### 2. Category Multi-Select Component (SubTask 4.6)

**Current State:**
- Categories input is comma-separated text field
- No visual multi-select with checkboxes/chips

**Files to Create:**
| Priority | File Path | Description |
|----------|-----------|-------------|
| P2 | `frontend/packages/ui/src/components/MultiSelect/MultiSelect.tsx` | Reusable multi-select with chips, checkboxes, clear-all |

**Files to Modify:**
| Priority | File Path | Changes |
|----------|-----------|---------|
| P2 | `frontend/apps/main-site/src/features/supplier-profile/pages/SupplierProfilePage.tsx` | Replace categories text input with MultiSelect component using discovery categories API |

**Verification:**
```bash
cd frontend && yarn workspace @fsm/main-site type-check
```

---

#### 3. Region Dropdown (SubTask 4.6)

**Current State:**
- Region is free-text input
- Should use predefined region list from discovery API

**Files to Modify:**
| Priority | File Path | Changes |
|----------|-----------|---------|
| P2 | `frontend/apps/main-site/src/features/supplier-profile/pages/SupplierProfilePage.tsx` | Replace region text input with `<select>` populated from `useSupplierRegions()` hook |

**Verification:**
```bash
cd frontend && yarn workspace @fsm/main-site build
```

---

### Items to KEEP PARTIAL (Out of Scope)

| Item | Reason |
|------|--------|
| Drag-and-drop file upload | UX enhancement, not blocking acceptance criteria |
| Upload progress indicator | Nice-to-have, current implementation works |
| File preview (images) | Nice-to-have enhancement |
| Pre-submission confirmation modal | UX refinement, not blocking |
| Profile completion gauge | Requires complex validation scoring, not in acceptance criteria |
| "다시 제출하기" CTA exact text | Functional path exists, text matching is cosmetic |

---

## Task 05: Admin Review Queue and Decision Actions

### Current Status: 🟡 Partial
**Evidence File:** `.sisyphus/evidence/task-5-admin-review-queue.txt`  
**SubPlan:** `.sisyphus/plans/phase1-subplans/phase1-task-05-admin-review-queue.md`

### Partial Items to Implement

#### 1. Queue API Enhancement (SubTask 5.2)

**Current State:**
- `GET /api/admin/reviews` has `state`, `page`, `size` params only
- Missing: `fromDate`, `toDate`, `sort` params

**Files to Modify:**
| Priority | File Path | Changes |
|----------|-----------|---------|
| P1 | `backend/admin-server/src/main/kotlin/dev/riss/fsm/admin/review/AdminReviewController.kt` | Add `@RequestParam fromDate: LocalDate?`, `@RequestParam toDate: LocalDate?`, `@RequestParam sort: String?` to `queue()` method |
| P1 | `backend/admin-server/src/main/kotlin/dev/riss/fsm/admin/review/AdminReviewApplicationService.kt` | Update `queue()` signature and pass date range + sort to repository |
| P1 | `backend/query-model-admin-review/src/main/kotlin/dev/riss/fsm/query/admin/review/AdminReviewRepositories.kt` | Add date range filtering and sort support to query methods |

**Code Changes:**
```kotlin
// AdminReviewController.kt - queue() method signature
fun queue(
    @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
    @RequestParam(required = false) state: String?,
    @RequestParam(required = false) fromDate: LocalDate?,  // ADD
    @RequestParam(required = false) toDate: LocalDate?,    // ADD
    @RequestParam(defaultValue = "1") page: Int,
    @RequestParam(defaultValue = "20") size: Int,
    @RequestParam(required = false) sort: String?,         // ADD
): Mono<ApiSuccessResponse<List<AdminReviewQueueItemResponse>>>
```

**Verification:**
```bash
./gradlew :admin-server:test
```

---

#### 2. Review History in Detail Response (SubTask 5.2)

**Current State:**
- `GET /api/admin/reviews/{reviewId}` returns current state only
- No audit trail/history of state transitions

**Files to Modify:**
| Priority | File Path | Changes |
|----------|-----------|---------|
| P2 | `backend/admin-server/src/main/kotlin/dev/riss/fsm/admin/review/AdminReviewDtos.kt` | Add `reviewHistory: List<ReviewHistoryItem>` to `AdminReviewDetailResponse` |
| P2 | `backend/admin-server/src/main/kotlin/dev/riss/fsm/admin/review/AdminReviewApplicationService.kt` | Query `audit_log` table and map to history items |
| P2 | `backend/command-domain-supplier/src/main/kotlin/dev/riss/fsm/command/supplier/AuditLogEntity.kt` | Add query method `findByTargetTypeAndTargetIdOrderByCreatedAtDesc()` |

---

#### 3. Status Color Coding in Admin UI (SubTask 5.5)

**Current State:**
- Status displayed as plain text
- No color coding for different states

**Files to Modify:**
| Priority | File Path | Changes |
|----------|-----------|---------|
| P3 | `frontend/apps/admin-site/src/features/reviews/pages/ReviewQueuePage.tsx` | Add color mapping: submitted(yellow), under_review(blue), hold(orange), approved(green), rejected(red) |
| P3 | `frontend/apps/admin-site/src/features/reviews/pages/ReviewDetailPage.tsx` | Apply same color coding to status display |

**Color Mapping:**
```typescript
const statusColors: Record<string, string> = {
  submitted: '#eab308',    // yellow-500
  under_review: '#3b82f6', // blue-500
  hold: '#f97316',         // orange-500
  approved: '#22c55e',     // green-500
  rejected: '#ef4444',     // red-500
}
```

**Verification:**
```bash
cd frontend && yarn workspace @fsm/admin-site test --run
```

---

#### 4. Swagger Response Examples (SubTask 5.3)

**Current State:**
- Admin endpoints have basic `@Operation` annotations
- Missing response examples and explicit event documentation

**Files to Modify:**
| Priority | File Path | Changes |
|----------|-----------|---------|
| P3 | `backend/admin-server/src/main/kotlin/dev/riss/fsm/admin/review/AdminReviewController.kt` | Add `@ApiResponse` annotations with examples for 200, 400, 403, 404 |

---

### Items to KEEP PARTIAL (Out of Scope)

| Item | Reason |
|------|--------|
| StartReview command | State machine works without explicit start transition (submitted -> under_review implicit) |
| SuspendReview command | Requires Task 11 admin features, out of current scope |
| File download URLs | Requires storage URL generation, interface abstraction needed first |
| Timeline visualization | UX enhancement, audit log provides raw data |
| Modal-based decision UX | Current inline forms work; modal is UX refinement |

---

## Task 06: Supplier Discovery and Read Models

### Current Status: 🟡 Partial
**Evidence File:** `.sisyphus/evidence/task-6-supplier-discovery.txt`  
**SubPlan:** `.sisyphus/plans/phase1-subplans/phase1-task-06-supplier-discovery.md`

### Partial Items to Implement

#### 1. MongoDB Indexes for Search (SubTask 6.1, 6.7)

**Current State:**
- `supplier_search_view` collection exists
- No explicit index configuration

**Files to Create:**
| Priority | File Path | Description |
|----------|-----------|-------------|
| P2 | `backend/query-model-supplier/src/main/kotlin/dev/riss/fsm/query/supplier/SupplierSearchViewIndexes.kt` | Index definitions using `@Document` and `@CompoundIndex` |

**Files to Modify:**
| Priority | File Path | Changes |
|----------|-----------|---------|
| P2 | `backend/query-model-supplier/src/main/kotlin/dev/riss/fsm/query/supplier/SupplierSearchViewDocument.kt` | Add `@CompoundIndex(name = "category_region_idx", def = "{'categories': 1, 'region': 1}")` |

**Index Definitions:**
```kotlin
// Compound indexes
categories + region
oemAvailable + odmAvailable

// Single indexes
monthlyCapacity (for range queries)
companyName (text index for keyword search)
```

---

#### 2. OEM/ODM/Capacity Filters in Search UI (SubTask 6.5)

**Current State:**
- Search has keyword, category, region filters
- Missing: OEM/ODM checkboxes, minCapacity/maxMoq inputs, reset button

**Files to Modify:**
| Priority | File Path | Changes |
|----------|-----------|---------|
| P2 | `frontend/apps/main-site/src/features/discovery/pages/SupplierSearchPage.tsx` | Add: OEM checkbox, ODM checkbox, minCapacity number input, maxMoq number input, "필터 초기화" button |

**Code Changes:**
```typescript
// Add to URL params handling
const oem = searchParams.get("oem") === "true"
const odm = searchParams.get("odm") === "true"
const minCapacity = searchParams.get("minCapacity") ?? ""
const maxMoq = searchParams.get("maxMoq") ?? ""

// Add to filter UI
<label><input type="checkbox" checked={oem} onChange={...} /> OEM 가능</label>
<label><input type="checkbox" checked={odm} onChange={...} /> ODM 가능</label>
<input type="number" value={minCapacity} placeholder="최소 월생산량" />
<input type="number" value={maxMoq} placeholder="최대 MOQ" />
<button onClick={() => setSearchParams({})}>필터 초기화</button>
```

**Verification:**
```bash
cd frontend && yarn workspace @fsm/main-site test --run
```

---

#### 3. Sort Parameters for Search API (SubTask 6.3)

**Current State:**
- `GET /api/suppliers` has filters but no sort/order params

**Files to Modify:**
| Priority | File Path | Changes |
|----------|-----------|---------|
| P3 | `backend/api-server/src/main/kotlin/dev/riss/fsm/api/supplier/SupplierDiscoveryController.kt` | Add `@RequestParam sort: String?`, `@RequestParam order: String?` to `list()` method |
| P3 | `backend/query-model-supplier/src/main/kotlin/dev/riss/fsm/query/supplier/SupplierQueryService.kt` | Implement sorting logic for `monthlyCapacity`, `moq`, `companyName` |

---

### Items to KEEP PARTIAL (Out of Scope)

| Item | Reason |
|------|--------|
| Event consumers explicit definition | Projection handlers already work; explicit consumer config is infrastructure detail |
| Full-text search on equipmentSummary | Requires MongoDB text index + scoring; current keyword search on companyName works |
| "의뢰하기" button CTA from supplier detail | Requires Task 08 quote flow integration; complex feature |

---

## Task 08: Quote Lifecycle and Comparison

### Current Status: 🟡 Partial
**Evidence File:** `.sisyphus/evidence/task-8-quote-lifecycle.txt`  
**SubPlan:** `.sisyphus/plans/phase1-subplans/phase1-task-08-quote-lifecycle.md`

### Partial Items to Implement

#### 1. Initial Message Auto-Generation (SubTask 8.5)

**Current State:**
- Thread is created on quote submission
- No initial message is auto-generated

**Files to Modify:**
| Priority | File Path | Changes |
|----------|-----------|---------|
| P2 | `backend/command-domain-thread/src/main/kotlin/dev/riss/fsm/command/thread/ThreadCommandService.kt` | In `createThread()`, add auto-generation of initial message when triggered by quote submission |
| P2 | `backend/projection/src/main/kotlin/dev/riss/fsm/projection/thread/ThreadProjectionService.kt` | Ensure initial message is projected to read model |

**Code Pattern:**
```kotlin
// In ThreadCommandService, when creating thread from quote:
if (sourceType == "quote") {
    createInitialMessage(
        threadId = threadId,
        senderId = supplierUserId,
        content = "견적이 제출되었습니다. 단가: ${quote.unitPriceEstimate}, MOQ: ${quote.moq}, 납기: ${quote.leadTime}일"
    )
}
```

**Verification:**
```bash
./gradlew :command-domain-thread:test
```

---

#### 2. Quote Submission Confirmation UX (SubTask 8.6)

**Current State:**
- Quote form submits immediately
- No confirmation step before submission

**Files to Create:**
| Priority | File Path | Description |
|----------|-----------|-------------|
| P3 | `frontend/apps/main-site/src/features/supplier-quotes/components/QuoteSubmitConfirmModal.tsx` | Modal showing quote summary with confirm/cancel buttons |

**Files to Modify:**
| Priority | File Path | Changes |
|----------|-----------|---------|
| P3 | `frontend/apps/main-site/src/features/supplier-quotes/pages/QuoteCreatePage.tsx` | Add modal trigger before calling `submitMutation.mutate()` |

---

#### 3. Quote Selection Confirmation Modal (SubTask 8.7)

**Current State:**
- Quote can be selected inline in comparison table
- No confirmation that request will be closed

**Files to Create:**
| Priority | File Path | Description |
|----------|-----------|-------------|
| P3 | `frontend/apps/main-site/src/features/quotes/components/QuoteSelectConfirmModal.tsx` | Modal with warning about request closure and confirm button |

**Files to Modify:**
| Priority | File Path | Changes |
|----------|-----------|---------|
| P3 | `frontend/apps/main-site/src/features/quotes/pages/QuoteComparisonPage.tsx` | Add modal before calling `selectMutation.mutate()` |

---

### Items to KEEP PARTIAL (Out of Scope)

| Item | Reason |
|------|--------|
| Quote detail modal | Current inline detail panel works; modal is UX refinement |
| Full modal-based decision flow | Current inline actions satisfy acceptance criteria |

---

## Execution Order

### Phase 1: Backend Core (Days 1-2)

| Order | Task | File(s) | Priority | Verification |
|-------|------|---------|----------|--------------|
| 1 | T04: Storage Interface | `FileStorageService.kt` (create), `LocalFileStorageService.kt` (modify) | P1 | `./gradlew :api-server:compileKotlin` |
| 2 | T05: Queue API Enhancement | `AdminReviewController.kt`, `AdminReviewApplicationService.kt`, `AdminReviewRepositories.kt` | P1 | `./gradlew :admin-server:test` |
| 3 | T06: MongoDB Indexes | `SupplierSearchViewDocument.kt`, `SupplierSearchViewIndexes.kt` | P2 | `./gradlew :query-model-supplier:compileKotlin` |
| 4 | T08: Initial Message | `ThreadCommandService.kt` | P2 | `./gradlew :command-domain-thread:test` |

### Phase 2: Backend Secondary (Days 2-3)

| Order | Task | File(s) | Priority | Verification |
|-------|------|---------|----------|--------------|
| 5 | T05: Review History | `AdminReviewDtos.kt`, `AdminReviewApplicationService.kt`, `AuditLogEntity.kt` | P2 | `./gradlew :admin-server:test` |
| 6 | T06: Search Sort | `SupplierDiscoveryController.kt`, `SupplierQueryService.kt` | P3 | `./gradlew :api-server:test` |
| 7 | T05: Swagger Examples | `AdminReviewController.kt` | P3 | Manual Swagger UI check |

### Phase 3: Frontend Core (Days 3-4)

| Order | Task | File(s) | Priority | Verification |
|-------|------|---------|----------|--------------|
| 8 | T04: Category MultiSelect | `MultiSelect.tsx` (create), `SupplierProfilePage.tsx` (modify) | P2 | `yarn workspace @fsm/main-site type-check` |
| 9 | T04: Region Dropdown | `SupplierProfilePage.tsx` | P2 | `yarn workspace @fsm/main-site build` |
| 10 | T06: OEM/ODM Filters | `SupplierSearchPage.tsx` | P2 | `yarn workspace @fsm/main-site test --run` |

### Phase 4: Frontend Secondary (Days 4-5)

| Order | Task | File(s) | Priority | Verification |
|-------|------|---------|----------|--------------|
| 11 | T05: Status Colors | `ReviewQueuePage.tsx`, `ReviewDetailPage.tsx` | P3 | `yarn workspace @fsm/admin-site test --run` |
| 12 | T08: Confirm Modals | `QuoteSubmitConfirmModal.tsx`, `QuoteCreatePage.tsx`, `QuoteSelectConfirmModal.tsx`, `QuoteComparisonPage.tsx` | P3 | `yarn build` |

### Phase 5: Integration Verification (Day 5)

| Order | Command | Purpose |
|-------|---------|---------|
| 1 | `./gradlew build` | Full backend build |
| 2 | `cd frontend && yarn test && yarn build` | Full frontend test and build |
| 3 | `./gradlew :api-server:bootRun --args='--spring.profiles.active=local'` | Local backend verification |
| 4 | `cd frontend && yarn dev:main-site` | Frontend manual verification |

---

## Doc Status Transitions After Implementation

### Task 04: Supplier Verification

| SubTask | Current | After Implementation | Transition |
|---------|---------|---------------------|------------|
| 4.3 | 🟡 Partial | 🟢 Done | Storage adapter interface added |
| 4.6 | 🟡 Partial | 🟡 Partial | Keep partial (drag-drop, progress, preview, modal out of scope) |
| 4.7 | 🟡 Partial | 🟡 Partial | Keep partial (completion gauge, exact CTA text out of scope) |
| **Overall** | 🟡 Partial | 🟡 Partial | Core acceptance criteria met, UX refinements remain |

### Task 05: Admin Review Queue

| SubTask | Current | After Implementation | Transition |
|---------|---------|---------------------|------------|
| 5.1 | 🟡 Partial | 🟡 Partial | Keep partial (StartReview/SuspendReview out of scope) |
| 5.2 | 🟡 Partial | 🟢 Done | fromDate/toDate/sort + review history added |
| 5.3 | 🟡 Partial | 🟢 Done | Swagger response examples added |
| 5.4 | 🟢 Done | 🟢 Done | No change |
| 5.5 | 🟡 Partial | 🟢 Done | Status colors added |
| 5.6 | 🟡 Partial | 🟡 Partial | Keep partial (timeline/modal UX out of scope) |
| **Overall** | 🟡 Partial | 🟡 Partial | Core acceptance criteria met, UX refinements remain |

### Task 06: Supplier Discovery

| SubTask | Current | After Implementation | Transition |
|---------|---------|---------------------|------------|
| 6.1 | 🟡 Partial | 🟢 Done | MongoDB indexes added |
| 6.2 | 🟡 Partial | 🟢 Done | Event consumers documented/verified |
| 6.3 | 🟡 Partial | 🟢 Done | sort/order params added |
| 6.4 | 🟢 Done | 🟢 Done | No change |
| 6.5 | 🟡 Partial | 🟢 Done | OEM/ODM/capacity filters + reset button added |
| 6.6 | 🟢 Done | 🟢 Done | No change |
| 6.7 | 🟡 Partial | 🟢 Done | Text index configuration added |
| **Overall** | 🟡 Partial | 🟢 Done | All core items implemented |

### Task 08: Quote Lifecycle

| SubTask | Current | After Implementation | Transition |
|---------|---------|---------------------|------------|
| 8.1 | 🟢 Done | 🟢 Done | No change |
| 8.2 | 🟢 Done | 🟢 Done | No change |
| 8.3 | 🟢 Done | 🟢 Done | No change |
| 8.4 | 🟢 Done | 🟢 Done | No change |
| 8.5 | 🟡 Partial | 🟢 Done | Initial message auto-generation added |
| 8.6 | 🟡 Partial | 🟡 Partial | Keep partial (confirmation UX enhancement out of scope) |
| 8.7 | 🟡 Partial | 🟡 Partial | Keep partial (detail/confirm modals out of scope) |
| **Overall** | 🟡 Partial | 🟢 Done | Core acceptance criteria met |

---

## Summary Table: Items to Implement vs Keep Partial

| Task | Items to Implement | Items to Keep Partial |
|------|-------------------|----------------------|
| **T04** | Storage interface abstraction, Category multi-select, Region dropdown | Drag-drop, progress, preview, confirmation modal, completion gauge, exact CTA text |
| **T05** | Queue date/sort filters, Review history, Status colors, Swagger examples | StartReview/SuspendReview commands, Timeline visualization, Modal UX |
| **T06** | MongoDB indexes, OEM/ODM/capacity filters, Sort params | Event consumer config (working), "의뢰하기" CTA integration |
| **T08** | Initial message auto-generation, Confirmation modals | Detail modal UX (inline works) |

---

## Final Status Projection

After implementing this plan:

| Task | Before | After |
|------|--------|-------|
| T04 | 🟡 Partial | 🟡 Partial (closer to completion) |
| T05 | 🟡 Partial | 🟡 Partial (closer to completion) |
| T06 | 🟡 Partial | 🟢 Done |
| T08 | 🟡 Partial | 🟢 Done |

**T06 and T08** are expected to transition to **Done** status.  
**T04 and T05** remain **Partial** but with significantly reduced scope of remaining work (UX refinements only, no functional gaps).

---

## Appendices

### A. Key File Locations

**Backend Controllers:**
- `/backend/api-server/src/main/kotlin/dev/riss/fsm/api/supplier/SupplierProfileController.kt`
- `/backend/api-server/src/main/kotlin/dev/riss/fsm/api/supplier/SupplierDiscoveryController.kt`
- `/backend/api-server/src/main/kotlin/dev/riss/fsm/api/quote/QuoteController.kt`
- `/backend/admin-server/src/main/kotlin/dev/riss/fsm/admin/review/AdminReviewController.kt`

**Backend Services:**
- `/backend/api-server/src/main/kotlin/dev/riss/fsm/api/supplier/SupplierProfileApplicationService.kt`
- `/backend/api-server/src/main/kotlin/dev/riss/fsm/api/supplier/LocalFileStorageService.kt`
- `/backend/admin-server/src/main/kotlin/dev/riss/fsm/admin/review/AdminReviewApplicationService.kt`
- `/backend/command-domain-thread/src/main/kotlin/dev/riss/fsm/command/thread/ThreadCommandService.kt`
- `/backend/query-model-supplier/src/main/kotlin/dev/riss/fsm/query/supplier/SupplierQueryService.kt`

**Frontend Pages:**
- `/frontend/apps/main-site/src/features/supplier-profile/pages/SupplierProfilePage.tsx`
- `/frontend/apps/main-site/src/features/discovery/pages/SupplierSearchPage.tsx`
- `/frontend/apps/main-site/src/features/supplier-quotes/pages/QuoteCreatePage.tsx`
- `/frontend/apps/main-site/src/features/quotes/pages/QuoteComparisonPage.tsx`
- `/frontend/apps/admin-site/src/features/reviews/pages/ReviewQueuePage.tsx`
- `/frontend/apps/admin-site/src/features/reviews/pages/ReviewDetailPage.tsx`

### B. Verification Commands Reference

```bash
# Backend compilation
./gradlew :api-server:compileKotlin
./gradlew :admin-server:compileKotlin
./gradlew :query-model-supplier:compileKotlin
./gradlew :command-domain-thread:compileKotlin

# Backend tests
./gradlew :api-server:test
./gradlew :admin-server:test
./gradlew :command-domain-thread:test
./gradlew build

# Frontend type-checking
yarn workspace @fsm/main-site type-check
yarn workspace @fsm/admin-site type-check

# Frontend tests
yarn workspace @fsm/main-site test --run
yarn workspace @fsm/admin-site test --run
yarn test

# Frontend build
yarn workspace @fsm/main-site build
yarn workspace @fsm/admin-site build
yarn build
```

---

**End of Implementation Plan**
