# Phase 1 Information Architecture and Flows

> Version: 1.0
> Status: Active
> Parent: `phase1-design-baseline.md`

---

## 1. Surface Map

### Public

- landing page
- supplier search/listing preview
- notices

### Requester Area

- requester onboarding/business submission
- supplier search/list/detail
- request list/detail/create/edit
- quote comparison
- message thread list/detail
- contact-share requests

### Supplier Area

- supplier onboarding
- supplier profile edit
- verification submission status
- eligible request list/detail
- quote list/detail/create/update/withdraw
- message thread list/detail
- contact-share requests

### Admin Area

- review queue
- supplier/business detail review
- supplier state management
- notices management
- basic stats dashboard

---

## 2. Primary Navigation

### Requester

- Dashboard
- Suppliers
- Requests
- Quotes
- Messages
- Account

### Supplier

- Dashboard
- Profile
- Verification
- Requests
- Quotes
- Messages
- Account

### Admin

- Review Queue
- Suppliers
- Requesters
- Notices
- Stats

---

## 3. Screen Inventory

| Screen | Actor | Primary Object |
|--------|-------|----------------|
| Landing | Public | Notice / SupplierPreview |
| Supplier Search | Public/Requester | SupplierSearchView |
| Supplier Detail | Public/Requester | SupplierProfileReadModel |
| Request Create/Edit | Requester | Request |
| Request Detail | Requester/Supplier | Request |
| Quote Compare | Requester | QuoteCollection |
| Quote Form | Supplier | Quote |
| Thread List | Requester/Supplier | MessageThreadSummary |
| Thread Detail | Requester/Supplier | MessageThread |
| Verification Submission | Supplier | VerificationSubmission |
| Review Queue | Admin | AdminReviewItem |
| Review Detail | Admin | VerificationSubmission |
| Notice List/Edit | Admin | Notice |
| Stats Dashboard | Admin | PlatformStatSummary |

---

## 4. Core Flow Catalog

### Flow A: Supplier Verification

- Entry: supplier signs up and reaches verification screen
- Preconditions: supplier account exists
- Happy path:
  1. supplier enters company/profile basics
  2. supplier uploads business/certification documents
  3. supplier submits verification
  4. admin reviews submission
  5. admin approves or rejects
- Failure paths:
  - missing required document
  - invalid file type/size
  - rejection with resubmission required
- Postconditions:
  - supplier state changes and impacts visibility/eligibility

### Flow B: Request Posting

- Entry: requester chooses create request
- Preconditions: requester account exists; requester business state is `approved`
- Happy path:
  1. requester fills request form
  2. requester chooses public or targeted mode
  3. requester publishes request
- Failure paths:
  - incomplete required fields
  - invalid category or production range inputs
- Postconditions:
  - request becomes visible according to mode and state

### Flow C: Quote Submission and Comparison

- Entry: supplier opens eligible request detail
- Preconditions: supplier is eligible to quote; request is open
- Happy path:
  1. supplier creates quote
  2. requester receives quote
  3. requester compares multiple quotes
  4. requester selects follow-up target
- Failure paths:
  - supplier not eligible
  - request closed/cancelled
  - duplicate quote policy violation
- Postconditions:
  - quote state updated; if no thread exists for the requester-supplier-request tuple, one thread is created automatically

### Flow D: Messaging and Contact Sharing

- Entry: requester or supplier opens thread linked to request context
- Preconditions: thread already exists, or requester creates/opens it from request context, or it was auto-created by first quote submission
- Happy path:
  1. party sends message
  2. other party reads and replies
  3. one party requests contact sharing
  4. both parties consent
  5. external contact details become visible
- Failure paths:
  - one-sided consent only
  - revoked consent
  - duplicate thread creation request returns existing thread
  - attachment validation failure
- Postconditions:
  - conversation history preserved with auditable contact-share state and auditable consent retry history

### Flow E: Admin Review and Notice Operations

- Entry: admin opens queue or notices
- Preconditions: admin authenticated
- Happy path:
  1. admin filters review queue
  2. admin opens submission
  3. admin approves/rejects/holds
  4. admin posts notice if needed
- Failure paths:
  - invalid transition from already-final state
  - missing reason on rejection
  - hold or reject without user-visible guidance

---

## 5. Object-to-Screen Mapping

| Object | Create | Read | Update | Admin Action |
|--------|--------|------|--------|-------------|
| SupplierProfile | Supplier Profile | Supplier Detail | Supplier Profile | Review visibility |
| VerificationSubmission | Verification Submission | Review Detail | Resubmit | Approve/Reject/Hold |
| Request | Request Create | Request Detail | Request Edit | Moderate if needed |
| Quote | Quote Form | Quote Compare | Quote Update/Withdraw | Inspect if needed |
| MessageThread | System/triggered | Thread Detail | N/A | Audit access |
| ContactShareConsent | Thread Detail | Thread Detail | Consent response | Audit access |
| Notice | Notice Editor | Landing/Notice List | Notice Editor | Publish/Archive |

---

## 6. UI Decision Rules

1. Public users can browse but cannot transact.
2. Supplier trust state must be visible on list and detail surfaces.
3. Request mode must clearly differentiate `public` and `targeted`.
4. Contact details must remain hidden before bilateral consent.
5. Admin review status must be reflected in supplier-side UI without exposing internal-only notes.
