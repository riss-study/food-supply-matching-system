# Task 07 - Request Lifecycle and Targeting: Implementation Execution Plan

## Document Information
- **Task ID**: 07
- **Task Name**: Request Lifecycle and Targeting
- **Status**: Implementation Ready
- **Source Document**: `.sisyphus/plans/phase1-subplans/phase1-task-07-request-lifecycle.md`
- **Dependencies**: Task 01 (Foundation), Task 04 (Supplier Verification), Task 05 (Admin Review), Task 06 (Supplier Discovery)
- **Blocks**: Task 08 (Quote Lifecycle), Task 09 (Message Threads)

---

## Current State Assessment

### Already Implemented (from Task 06)
| Component | Status | File Location |
|-----------|--------|---------------|
| RequestEntity | ✅ Partial | `command-domain-request/RequestEntity.kt` |
| RequestRepository | ✅ Exists | `command-domain-request/RequestRepository.kt` |
| RequestCommandService | ✅ Partial | `command-domain-request/RequestCommandService.kt` (create only) |
| RequestController | ✅ Partial | `api-server/request/RequestController.kt` (POST only) |
| RequestApplicationService | ✅ Partial | `api-server/request/RequestApplicationService.kt` (create only) |
| RequestDtos | ✅ Partial | `api-server/request/RequestDtos.kt` (Create only) |
| RequestControllerTest | ✅ Exists | `api-server/test/request/RequestControllerTest.kt` |
| RequesterApprovalGuard | ✅ Exists | `api-server/requester/RequesterApprovalGuard.kt` |

### Database Schema Status
| Table | Status | Notes |
|-------|--------|-------|
| request_record | ✅ Exists | Missing: updated_at column, targeted supplier link table |

### Missing for Task 07 Completion
1. TargetedSupplierLink entity and table
2. Request state machine (draft → open → closed/cancelled)
3. GET /api/requests (list)
4. GET /api/requests/{id} (detail)
5. PATCH /api/requests/{id} (update)
6. POST /api/requests/{id}/close
7. POST /api/requests/{id}/cancel
8. GET /api/supplier/requests (supplier feed)
9. RequestAccessGuard for supplier authorization
10. Request projections (query model)
11. Frontend: Request create page
12. Frontend: Request list page
13. Frontend: Request detail page
14. Frontend: Supplier request feed

---

## File-by-File Implementation Plan

### Phase A: Backend Domain Model Extensions (SubTask 7.1)

**Step 1: Database Schema Migration**
```
Priority: 1 (Blocking)
Estimated Time: 0.5h
```

| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | `backend/docker/mariadb/init/01-schema.sql` | Add `updated_at` to request_record |
| ADD | `backend/docker/mariadb/init/01-schema.sql` | Create `targeted_supplier_link` table |

```sql
-- Add to 01-schema.sql after request_record table
ALTER TABLE request_record
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- New table for targeted mode
CREATE TABLE IF NOT EXISTS targeted_supplier_link (
  id VARCHAR(64) PRIMARY KEY,
  request_id VARCHAR(64) NOT NULL,
  supplier_profile_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tsl_request FOREIGN KEY (request_id) REFERENCES request_record(id),
  CONSTRAINT fk_tsl_supplier FOREIGN KEY (supplier_profile_id) REFERENCES supplier_profile(id),
  UNIQUE KEY uk_request_supplier (request_id, supplier_profile_id)
);
```

**Step 2: TargetedSupplierLink Entity**
```
Priority: 2 (Blocking)
Estimated Time: 0.5h
File: backend/command-domain-request/src/main/kotlin/dev/riss/fsm/command/request/TargetedSupplierLinkEntity.kt
```

```kotlin
package dev.riss.fsm.command.request

import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Transient
import org.springframework.data.domain.Persistable
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.LocalDateTime

@Table("targeted_supplier_link")
data class TargetedSupplierLinkEntity(
    @Id
    @Column("id")
    val linkId: String,
    @Column("request_id")
    val requestId: String,
    @Column("supplier_profile_id")
    val supplierProfileId: String,
    @Column("created_at")
    val createdAt: LocalDateTime,
) : Persistable<String> {
    @Transient
    var newEntity: Boolean = false

    override fun getId(): String = linkId
    override fun isNew(): Boolean = newEntity
}
```

**Step 3: TargetedSupplierLink Repository**
```
Priority: 2 (Blocking)
Estimated Time: 0.5h
File: backend/command-domain-request/src/main/kotlin/dev/riss/fsm/command/request/TargetedSupplierLinkRepository.kt
```

```kotlin
package dev.riss.fsm.command.request

import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

interface TargetedSupplierLinkRepository : ReactiveCrudRepository<TargetedSupplierLinkEntity, String> {
    fun findAllByRequestId(requestId: String): Flux<TargetedSupplierLinkEntity>
    fun existsByRequestIdAndSupplierProfileId(requestId: String, supplierProfileId: String): Mono<Boolean>
}
```

**Step 4: Extend RequestEntity with updatedAt**
```
Priority: 2 (Blocking)
Estimated Time: 0.5h
File: backend/command-domain-request/src/main/kotlin/dev/riss/fsm/command/request/RequestEntity.kt
```

Add field:
```kotlin
@Column("updated_at")
val updatedAt: LocalDateTime,
```

---

### Phase B: Backend Command Services (SubTask 7.1, 7.3)

**Step 5: Extend RequestCommandService**
```
Priority: 3 (Blocking)
Estimated Time: 1h
File: backend/command-domain-request/src/main/kotlin/dev/riss/fsm/command/request/RequestCommandService.kt
```

Add commands:
- UpdateRequestCommand
- PublishRequestCommand  
- CloseRequestCommand
- CancelRequestCommand
- AddTargetedSuppliersCommand

Add methods:
- update(command): Mono<RequestEntity>
- publish(command): Mono<RequestEntity>
- close(command): Mono<RequestEntity>
- cancel(command): Mono<RequestEntity>
- addTargetedSuppliers(command): Mono<Void>

State machine validation:
```kotlin
private fun validateStateTransition(current: String, next: String) {
    val validTransitions = mapOf(
        "draft" to setOf("open", "cancelled"),
        "open" to setOf("closed", "cancelled"),
        "closed" to emptySet(),
        "cancelled" to emptySet()
    )
    if (next !in (validTransitions[current] ?: emptySet())) {
        throw IllegalStateException("Invalid state transition: $current -> $next")
    }
}
```

---

### Phase C: Backend API Layer (SubTask 7.2, 7.3)

**Step 6: Extend RequestDtos**
```
Priority: 4 (Blocking)
Estimated Time: 1h
File: backend/api-server/src/main/kotlin/dev/riss/fsm/api/request/RequestDtos.kt
```

Add DTOs:
- UpdateRequestRequest
- PublishRequestRequest (optional targetedSupplierIds)
- CloseRequestRequest (optional reason)
- CancelRequestRequest (optional reason)
- RequestResponse (full detail)
- RequestListItemResponse
- RequestListResponse
- TargetSupplierInfo (nested)

**Step 7: Extend RequestApplicationService**
```
Priority: 4 (Blocking)
Estimated Time: 1h
File: backend/api-server/src/main/kotlin/dev/riss/fsm/api/request/RequestApplicationService.kt
```

Add methods:
- update(principal, requestId, request): Mono<RequestResponse>
- publish(principal, requestId, request): Mono<RequestResponse>
- close(principal, requestId, request): Mono<RequestResponse>
- cancel(principal, requestId, request): Mono<RequestResponse>
- getMyRequests(principal, state, page, size): Mono<RequestListResponse>
- getRequestDetail(principal, requestId): Mono<RequestResponse>

**Step 8: Extend RequestController**
```
Priority: 4 (Blocking)
Estimated Time: 1h
File: backend/api-server/src/main/kotlin/dev/riss/fsm/api/request/RequestController.kt
```

Add endpoints:
- GET /api/requests - listMyRequests
- GET /api/requests/{requestId} - getRequestDetail
- PATCH /api/requests/{requestId} - updateRequest
- POST /api/requests/{requestId}/publish - publishRequest
- POST /api/requests/{requestId}/close - closeRequest
- POST /api/requests/{requestId}/cancel - cancelRequest

---

### Phase D: Backend Access Control (SubTask 7.5)

**Step 9: RequestAccessGuard**
```
Priority: 5 (Blocking)
Estimated Time: 1h
File: backend/api-server/src/main/kotlin/dev/riss/fsm/api/request/RequestAccessGuard.kt
```

```kotlin
package dev.riss.fsm.api.request

import dev.riss.fsm.command.request.RequestRepository
import dev.riss.fsm.command.request.TargetedSupplierLinkRepository
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono

@Service
class RequestAccessGuard(
    private val requestRepository: RequestRepository,
    private val targetedSupplierLinkRepository: TargetedSupplierLinkRepository,
) {
    fun requireRequestOwnership(principal: AuthenticatedUserPrincipal, requestId: String): Mono<Void> {
        return requestRepository.findById(requestId)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found")))
            .flatMap { request ->
                if (request.requesterUserId != principal.userId) {
                    Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Not request owner"))
                } else {
                    Mono.empty()
                }
            }
    }

    fun requireSupplierAccess(principal: AuthenticatedUserPrincipal, requestId: String, supplierProfileId: String): Mono<Void> {
        return requestRepository.findById(requestId)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found")))
            .flatMap { request ->
                when (request.mode) {
                    "public" -> Mono.empty() // All approved suppliers can access
                    "targeted" -> targetedSupplierLinkRepository.existsByRequestIdAndSupplierProfileId(requestId, supplierProfileId)
                        .flatMap { exists ->
                            if (exists) Mono.empty()
                            else Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Not targeted for this request"))
                        }
                    else -> Mono.error(ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid request mode"))
                }
            }
    }
}
```

---

### Phase E: Backend Projections/Query Model (SubTask 7.4)

**Step 10: Request Query Model Service**
```
Priority: 6 (Non-blocking, can parallel with frontend)
Estimated Time: 1.5h
File: backend/query-model-request/src/main/kotlin/dev/riss/fsm/query/request/RequestQueryService.kt
```

Methods:
- findRequesterRequests(requesterUserId, stateFilter, page, size): Flux<RequestSummaryView>
- findSupplierFeed(supplierProfileId, categoryFilter, page, size): Flux<SupplierRequestFeedView>
- findRequestDetailForSupplier(requestId, supplierProfileId): Mono<RequestDetailView>
- countQuotesForRequest(requestId): Mono<Long>

**Step 11: Request Projection Documents**
```
Priority: 6
Estimated Time: 1h
File: backend/query-model-request/src/main/kotlin/dev/riss/fsm/query/request/RequestViews.kt
```

```kotlin
data class RequestSummaryView(
    val requestId: String,
    val title: String,
    val category: String,
    val state: String,
    val mode: String,
    val desiredVolume: Int,
    val quoteCount: Int,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class SupplierRequestFeedView(
    val requestId: String,
    val title: String,
    val category: String,
    val requesterBusinessName: String,
    val desiredVolume: Int,
    val targetPriceRange: PriceRange?,
    val mode: String,
    val hasQuoted: Boolean,
    val createdAt: Instant,
)
```

**Step 12: Supplier Request Controller**
```
Priority: 6
Estimated Time: 1h
File: backend/api-server/src/main/kotlin/dev/riss/fsm/api/supplier/SupplierRequestController.kt
```

Endpoints:
- GET /api/supplier/requests - getRequestFeed (for authenticated suppliers)
- GET /api/supplier/requests/{requestId} - getRequestDetail

---

### Phase F: Frontend Types (Shared Package)

**Step 13: Extend Shared Types**
```
Priority: 7 (Can parallel with backend)
Estimated Time: 0.5h
File: frontend/packages/types/src/index.ts
```

Add types:
```typescript
export type RequestState = "draft" | "open" | "closed" | "cancelled"
export type RequestMode = "public" | "targeted"

export interface Request {
  requestId: string
  mode: RequestMode
  title: string
  category: string
  desiredVolume: number
  targetPriceRange?: { min: number; max: number } | null
  certificationRequirement?: string[]
  rawMaterialRule?: string
  packagingRequirement?: string
  deliveryRequirement?: string
  notes?: string
  state: RequestState
  targetSuppliers?: TargetSupplierInfo[]
  quoteCount?: number
  createdAt: string
  updatedAt: string
}

export interface CreateRequestRequest {
  mode: RequestMode
  title: string
  category: string
  desiredVolume: number
  targetPriceRange?: { min: number; max: number }
  certificationRequirement?: string[]
  rawMaterialRule?: string
  packagingRequirement?: string
  deliveryRequirement?: string
  notes?: string
  supplierIds?: string[] // For targeted mode
}

export interface UpdateRequestRequest {
  title?: string
  category?: string
  desiredVolume?: number
  targetPriceRange?: { min: number; max: number }
  certificationRequirement?: string[]
  rawMaterialRule?: string
  packagingRequirement?: string
  deliveryRequirement?: string
  notes?: string
}

export interface TargetSupplierInfo {
  supplierProfileId: string
  companyName: string
}

export interface RequestListItem {
  requestId: string
  title: string
  category: string
  state: RequestState
  mode: RequestMode
  desiredVolume: number
  quoteCount: number
  createdAt: string
}

export interface SupplierRequestFeedItem {
  requestId: string
  title: string
  category: string
  requesterBusinessName: string
  desiredVolume: number
  targetPriceRange?: { min: number; max: number }
  mode: RequestMode
  hasQuoted: boolean
  createdAt: string
}
```

---

### Phase G: Frontend Requester UI (SubTask 7.6)

**Step 14: Request API Module**
```
Priority: 8
Estimated Time: 0.5h
File: frontend/apps/main-site/src/features/request/api/request-api.ts
```

Functions:
- createRequest(request): Promise<Request>
- getMyRequests(state?): Promise<RequestListItem[]>
- getRequestDetail(requestId): Promise<Request>
- updateRequest(requestId, request): Promise<Request>
- publishRequest(requestId, supplierIds?): Promise<void>
- closeRequest(requestId, reason?): Promise<void>
- cancelRequest(requestId, reason?): Promise<void>

**Step 15: Request Hooks**
```
Priority: 8
Estimated Time: 0.5h
Files: 
- frontend/apps/main-site/src/features/request/hooks/useCreateRequest.ts
- frontend/apps/main-site/src/features/request/hooks/useMyRequests.ts
- frontend/apps/main-site/src/features/request/hooks/useRequestDetail.ts
- frontend/apps/main-site/src/features/request/hooks/useUpdateRequest.ts
- frontend/apps/main-site/src/features/request/hooks/usePublishRequest.ts
- frontend/apps/main-site/src/features/request/hooks/useCloseRequest.ts
- frontend/apps/main-site/src/features/request/hooks/useCancelRequest.ts
```

**Step 16: Create Request Page**
```
Priority: 9
Estimated Time: 1h
File: frontend/apps/main-site/src/features/request/pages/CreateRequestPage.tsx
```

Features:
- Mode selector (public/targeted)
- Targeted mode: Supplier picker using discovery API
- Form fields: title, category, desiredVolume, targetPriceRange, certificationRequirement[], rawMaterialRule, packagingRequirement, deliveryRequirement, notes
- Validation: title 5-200 chars, desiredVolume positive
- Submit creates in draft state

**Step 17: My Requests List Page**
```
Priority: 9
Estimated Time: 1h
File: frontend/apps/main-site/src/features/request/pages/MyRequestsPage.tsx
```

Features:
- State filter tabs (draft/open/closed/cancelled/all)
- Request cards with: title, state badge, quote count, created date
- Click navigates to detail

**Step 18: Request Detail Page (Requester)**
```
Priority: 9
Estimated Time: 1.5h
File: frontend/apps/main-site/src/features/request/pages/RequestDetailPage.tsx
```

Features:
- Display all request fields
- State-based action buttons:
  - Draft: Edit, Publish, Cancel
  - Open: Close, Cancel
  - Closed/Cancelled: View only
- Target suppliers list (targeted mode)
- Quote count summary

---

### Phase H: Frontend Supplier UI (SubTask 7.7)

**Step 19: Supplier Request Feed API**
```
Priority: 10
Estimated Time: 0.5h
File: frontend/apps/main-site/src/features/supplier-request/api/supplier-request-api.ts
```

Functions:
- getRequestFeed(category?): Promise<SupplierRequestFeedItem[]>
- getRequestDetail(requestId): Promise<Request>

**Step 20: Supplier Request Hooks**
```
Priority: 10
Estimated Time: 0.5h
Files:
- frontend/apps/main-site/src/features/supplier-request/hooks/useRequestFeed.ts
- frontend/apps/main-site/src/features/supplier-request/hooks/useSupplierRequestDetail.ts
```

**Step 21: Supplier Request Feed Page**
```
Priority: 10
Estimated Time: 1h
File: frontend/apps/main-site/src/features/supplier-request/pages/SupplierRequestFeedPage.tsx
```

Features:
- Two sections: Public requests, Targeted requests (for me)
- Category filter
- Request cards: title, requester business name, desired volume, price range, hasQuoted indicator
- Click navigates to detail

**Step 22: Supplier Request Detail Page**
```
Priority: 10
Estimated Time: 1h
File: frontend/apps/main-site/src/features/supplier-request/pages/SupplierRequestDetailPage.tsx
```

Features:
- Display request details (read-only)
- "견적 제출하기" button if not quoted (navigates to quote creation - Task 08)
- "내 견적 보기" button if already quoted

---

### Phase I: Frontend Routing & Integration

**Step 23: Update App.tsx Routes**
```
Priority: 11
Estimated Time: 0.5h
File: frontend/apps/main-site/src/App.tsx
```

Add imports and routes:
- /requests - MyRequestsPage (requester)
- /requests/new - CreateRequestPage (requester, with approval gate)
- /requests/:requestId - RequestDetailPage (requester)
- /supplier/requests - SupplierRequestFeedPage (supplier)
- /supplier/requests/:requestId - SupplierRequestDetailPage (supplier)

**Step 24: Feature Exports**
```
Priority: 11
Estimated Time: 0.5h
Files:
- frontend/apps/main-site/src/features/request/index.ts
- frontend/apps/main-site/src/features/supplier-request/index.ts
```

---

### Phase J: Tests

**Step 25: Backend Tests**
```
Priority: 12
Estimated Time: 2h
Files:
- backend/api-server/src/test/kotlin/dev/riss/fsm/api/request/RequestControllerIntegrationTest.kt
- backend/api-server/src/test/kotlin/dev/riss/fsm/api/request/RequestAccessGuardTest.kt
```

Test scenarios:
- Create request (happy path)
- Create request by unapproved requester (403)
- Update draft request (success)
- Update closed request (failure)
- Publish draft with targeted suppliers
- Close open request
- Cancel draft/open request
- Supplier access public request (success)
- Supplier access targeted request (success if targeted)
- Supplier access targeted request (403 if not targeted)
- State transition guards

**Step 26: Frontend Component Tests**
```
Priority: 12
Estimated Time: 1h
Files: 
- CreateRequestPage.test.tsx
- MyRequestsPage.test.tsx
- RequestDetailPage.test.tsx
```

---

## Implementation Order & Dependencies

```
Phase A: Backend Domain (Steps 1-5)
├── Step 1: Database Schema (MIGRATION)
├── Step 2: TargetedSupplierLink Entity
├── Step 3: TargetedSupplierLink Repository
├── Step 4: Extend RequestEntity
└── Step 5: Extend RequestCommandService

Phase B: Backend API (Steps 6-8, parallel with Phase A after Step 5)
├── Step 6: Extend RequestDtos
├── Step 7: Extend RequestApplicationService
└── Step 8: Extend RequestController

Phase C: Backend Access Control (Step 9)
└── Step 9: RequestAccessGuard

Phase D: Backend Query Model (Steps 10-12, parallel)
├── Step 10: RequestQueryService
├── Step 11: RequestViews
└── Step 12: SupplierRequestController

Phase E: Frontend Types (Step 13, parallel with backend)
└── Step 13: Extend Shared Types

Phase F: Frontend Requester (Steps 14-18)
├── Step 14: Request API Module
├── Step 15: Request Hooks
├── Step 16: CreateRequestPage
├── Step 17: MyRequestsPage
└── Step 18: RequestDetailPage

Phase G: Frontend Supplier (Steps 19-22)
├── Step 19: Supplier Request API
├── Step 20: Supplier Request Hooks
├── Step 21: SupplierRequestFeedPage
└── Step 22: SupplierRequestDetailPage

Phase H: Integration (Steps 23-24)
├── Step 23: Update App.tsx
└── Step 24: Feature Index Files

Phase I: Tests (Steps 25-26)
├── Step 25: Backend Tests
└── Step 26: Frontend Tests
```

---

## Verification Commands

### Database Verification
```bash
# Verify schema changes
docker compose -f backend/compose.local.yml exec mariadb mariadb -uroot -proot fsm_command -e "DESCRIBE request_record;"
docker compose -f backend/compose.local.yml exec mariadb mariadb -uroot -proot fsm_command -e "DESCRIBE targeted_supplier_link;"
```

### Backend Build & Test
```bash
# Build
cd backend && ./gradlew build

# Run specific tests
cd backend && ./gradlew :api-server:test --tests "*RequestController*"
cd backend && ./gradlew :api-server:test --tests "*RequestAccessGuard*"

# Run all tests
cd backend && ./gradlew test
```

### Backend Runtime Verification
```bash
# Start servers
cd backend && ./gradlew :api-server:bootRun --args='--spring.profiles.active=local'

# Verify Swagger endpoints
curl http://localhost:8080/swagger-ui.html

# Test request creation
curl -X POST http://localhost:8080/api/requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode":"public","title":"Test Request","category":"snack","desiredVolume":1000}'
```

### Frontend Build & Test
```bash
# Install dependencies
cd frontend && yarn install

# Type check
cd frontend && yarn typecheck

# Run tests
cd frontend && yarn test

# Build
cd frontend && yarn build
```

### Frontend Dev Verification
```bash
cd frontend && yarn dev:main-site
# Navigate to http://localhost:5173/requests/new
```

---

## File Summary

### New Files to Create (22 files)

**Backend (12 files):**
1. `backend/command-domain-request/TargetedSupplierLinkEntity.kt`
2. `backend/command-domain-request/TargetedSupplierLinkRepository.kt`
3. `backend/api-server/request/RequestAccessGuard.kt`
4. `backend/api-server/supplier/SupplierRequestController.kt`
5. `backend/query-model-request/RequestQueryService.kt`
6. `backend/query-model-request/RequestViews.kt`
7. `backend/api-server/test/request/RequestControllerIntegrationTest.kt`
8. `backend/api-server/test/request/RequestAccessGuardTest.kt`

**Frontend (10 files):**
9. `frontend/apps/main-site/src/features/request/api/request-api.ts`
10. `frontend/apps/main-site/src/features/request/hooks/useCreateRequest.ts`
11. `frontend/apps/main-site/src/features/request/hooks/useMyRequests.ts`
12. `frontend/apps/main-site/src/features/request/hooks/useRequestDetail.ts`
13. `frontend/apps/main-site/src/features/request/pages/CreateRequestPage.tsx`
14. `frontend/apps/main-site/src/features/request/pages/MyRequestsPage.tsx`
15. `frontend/apps/main-site/src/features/request/pages/RequestDetailPage.tsx`
16. `frontend/apps/main-site/src/features/supplier-request/api/supplier-request-api.ts`
17. `frontend/apps/main-site/src/features/supplier-request/pages/SupplierRequestFeedPage.tsx`
18. `frontend/apps/main-site/src/features/supplier-request/pages/SupplierRequestDetailPage.tsx`

### Files to Modify (11 files)

**Backend (7 files):**
1. `backend/docker/mariadb/init/01-schema.sql` - Add updated_at, targeted_supplier_link table
2. `backend/command-domain-request/RequestEntity.kt` - Add updated_at field
3. `backend/command-domain-request/RequestCommandService.kt` - Add update/publish/close/cancel methods
4. `backend/api-server/request/RequestDtos.kt` - Add new DTOs
5. `backend/api-server/request/RequestApplicationService.kt` - Add new methods
6. `backend/api-server/request/RequestController.kt` - Add new endpoints

**Frontend (4 files):**
7. `frontend/packages/types/src/index.ts` - Add request types
8. `frontend/apps/main-site/src/App.tsx` - Add routes
9. `frontend/apps/main-site/src/features/request/index.ts` - Export new components
10. `frontend/apps/main-site/src/features/supplier-request/index.ts` - Create and export

---

## Acceptance Criteria Verification Checklist

- [ ] **AC1**: Approved requester can create request (returns 201, state=draft)
- [ ] **AC2**: Unapproved requester gets 403 when creating request
- [ ] **AC3**: Request created with draft state
- [ ] **AC4**: Draft request can be updated
- [ ] **AC5**: Open request can be updated (optional - check spec)
- [ ] **AC6**: Closed/cancelled request cannot be updated
- [ ] **AC7**: Public mode request visible to all approved suppliers
- [ ] **AC8**: Targeted mode request visible only to targeted suppliers
- [ ] **AC9**: Non-targeted supplier gets 403 for targeted request
- [ ] **AC10**: Request state transitions: draft→open, draft→cancelled, open→closed, open→cancelled
- [ ] **AC11**: Invalid state transitions blocked (e.g., closed→open)
- [ ] **AC12**: Requester can view list of their requests with state filter
- [ ] **AC13**: Supplier can view feed of accessible requests
- [ ] **AC14**: Closed/cancelled requests block quote submission (integration with Task 08)
- [ ] **AC15**: Swagger documents all request endpoints

---

## Evidence Path

After implementation, evidence files should be created at:
- `.sisyphus/evidence/task-07-request-lifecycle-backend-tests.txt`
- `.sisyphus/evidence/task-07-request-lifecycle-frontend-tests.txt`
- `.sisyphus/evidence/task-07-request-lifecycle-swagger.png` (screenshot)
- `.sisyphus/evidence/task-07-request-lifecycle-ui.png` (screenshot)

---

## Commit Message

```
feat(request): Task 07 - Request Lifecycle and Targeting

- Add TargetedSupplierLink entity and repository for targeted mode
- Extend RequestEntity with updated_at field
- Implement request state machine (draft -> open -> closed/cancelled)
- Add CRUD APIs: GET list, GET detail, PATCH update
- Add state transition APIs: publish, close, cancel
- Implement RequestAccessGuard for public/targeted authorization
- Create RequestQueryService and projections
- Add supplier request feed API
- Frontend: Request create/list/detail pages for requesters
- Frontend: Request feed/detail pages for suppliers
- Add shared types for Request domain
- Comprehensive backend and frontend tests
```

---

## Notes

1. **Quote Count Synchronization**: Use eventual consistency. The quote count in request summary can be populated via projection events or calculated on read initially.

2. **Targeted Mode Supplier Selection**: Reuse the supplier discovery components from Task 06 for the supplier picker in create request form.

3. **State Validation**: State transitions should be validated in the command service layer, not just at API level.

4. **Security**: Always verify request ownership for requester operations and access rights for supplier operations.

5. **Pagination**: Follow the same pagination pattern as SupplierDiscoveryController for list endpoints.
