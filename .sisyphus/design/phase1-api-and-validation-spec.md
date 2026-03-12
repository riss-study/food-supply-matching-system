# Phase 1 API and Validation Spec

> Version: 1.0
> Status: Active
> Parent: `phase1-design-baseline.md`

---

## 1. API Grouping

- Auth and Accounts
- Business and Supplier Verification
- Supplier Discovery
- Requests
- Quotes
- Message Threads and Messages
- Contact Share
- Notices
- Admin Review and Stats

---

## 2. Endpoint Inventory

### Auth and Accounts

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/me`

### Requester / Business

- `POST /api/requester/business-profile`
- `GET /api/requester/business-profile`
- `PATCH /api/requester/business-profile`

### Supplier Profile and Verification

- `POST /api/supplier/profile`
- `GET /api/supplier/profile`
- `PATCH /api/supplier/profile`
- `POST /api/supplier/verification-submissions`
- `GET /api/supplier/verification-submissions/latest`

### Supplier Discovery

- `GET /api/suppliers`
- `GET /api/suppliers/{supplierId}`

### Requests

- `POST /api/requests`
- `GET /api/requests`
- `GET /api/requests/{requestId}`
- `PATCH /api/requests/{requestId}`
- `POST /api/requests/{requestId}/close`
- `POST /api/requests/{requestId}/cancel`
- `POST /api/requests/{requestId}/threads`

### Quotes

- `POST /api/requests/{requestId}/quotes`
- `GET /api/requests/{requestId}/quotes`
- `PATCH /api/quotes/{quoteId}`
- `POST /api/quotes/{quoteId}/withdraw`
- `POST /api/quotes/{quoteId}/select`
- `POST /api/quotes/{quoteId}/decline`

### Message Threads

- `GET /api/threads`
- `GET /api/threads/{threadId}`
- `POST /api/threads/{threadId}/messages`
- `POST /api/threads/{threadId}/attachments`
- `POST /api/threads/{threadId}/read`

### Contact Share

- `POST /api/threads/{threadId}/contact-share/request`
- `POST /api/threads/{threadId}/contact-share/approve`
- `POST /api/threads/{threadId}/contact-share/revoke`

### Notices

- `GET /api/notices`
- `GET /api/notices/{noticeId}`

### Admin

- `GET /api/admin/reviews`
- `GET /api/admin/reviews/{reviewId}`
- `POST /api/admin/reviews/{reviewId}/approve`
- `POST /api/admin/reviews/{reviewId}/reject`
- `POST /api/admin/reviews/{reviewId}/hold`
- `GET /api/admin/notices`
- `POST /api/admin/notices`
- `PATCH /api/admin/notices/{noticeId}`
- `GET /api/admin/stats/summary`

---

## 3. Validation Rules

### Common

- all ids must be server-generated
- all write endpoints require authenticated actor except public browse endpoints
- unauthorized access returns `403`
- invalid payload returns `400`
- unknown resource returns `404`

### Supplier Profile

- `company_name` required
- `region` required
- at least one category required
- `monthly_capacity` positive number
- `moq` positive number

### Verification Submission

- supplier profile must exist before submission
- submission requires at least one business proof document
- file type restricted to approved MIME list
- file size and file count capped by server rules

### Request

- title required
- category required
- desired volume positive
- request mode must be `public` or `targeted`
- targeted mode requires at least one targeted supplier link
- requester business state must be `approved` before request creation or update

### Quote

- only approved supplier can submit
- request must be `open`
- price and MOQ values must be positive when present
- supplier cannot submit duplicate active quote for same request
- quote PATCH is allowed only while state is `submitted`
- quote PATCH may update only `unit_price_estimate`, `moq`, `lead_time`, `sample_cost`, and `note`
- quote PATCH must create revision history

### Thread and Message

- sender must be thread participant
- message body or attachment required
- attachment validation uses file type/size rules
- thread may be created either by first quote submission or by requester start action
- manual thread creation must reuse existing requester-supplier-request thread if one already exists

### Contact Share

- actor must be thread participant
- contact reveal occurs only after bilateral approval
- revoke is allowed only in `requested` or `one_side_approved`
- retry is allowed after `revoked` by creating a new consent cycle
- revoke does not hide contact details already revealed after `mutually_approved`

---

## 4. Response Shape Guidelines

- list endpoints support pagination
- search endpoint supports filter query params for category, region, verification, capacity, MOQ, OEM, ODM
- state fields should be explicit enums, not free text
- audit-sensitive internal notes must never be exposed to non-admin callers

---

## 5. Error Model

| Code | Meaning |
|------|---------|
| 400 | validation failure |
| 401 | unauthenticated |
| 403 | forbidden by role or state |
| 404 | resource not found |
| 409 | state conflict or duplicate active submission |
