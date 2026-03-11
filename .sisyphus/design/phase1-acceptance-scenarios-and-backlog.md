# Phase 1 Acceptance Scenarios and Backlog

> Version: 1.0
> Status: Active
> Parent: `phase1-design-baseline.md`

---

## 1. Acceptance Scenario Pack

### Requester Happy Path

1. requester signs up
2. requester submits business information
3. requester searches approved suppliers
4. requester views supplier detail
5. requester creates request
6. approved supplier submits quote
7. requester compares quotes
8. requester opens message thread
9. bilateral contact share succeeds

### Supplier Happy Path

1. supplier signs up
2. supplier creates profile
3. supplier submits verification documents
4. admin approves supplier
5. supplier appears in search
6. supplier submits quote on open request
7. supplier continues thread conversation

### Admin Happy Path

1. admin opens review queue
2. admin inspects submission
3. admin approves or rejects with note
4. admin verifies supplier state change in system views
5. admin publishes notice

---

## 2. Critical Negative Scenarios

- unapproved supplier cannot appear in search
- unapproved supplier cannot submit quote
- requester cannot compare quotes for another requester’s request
- supplier cannot quote on closed request
- one-sided contact consent does not reveal contact details
- invalid file upload is rejected
- admin cannot reject without reason code or note if policy requires one

---

## 3. Minimal Seed Data

### Accounts

- 1 requester-approved account
- 1 supplier-draft account
- 1 supplier-approved account
- 1 admin account

### Business Data

- 2 supplier profiles across different categories/regions
- 1 open public request
- 1 targeted request
- 2 quotes on one request
- 1 active message thread
- 1 published notice

---

## 4. Traceability Matrix

| Feature | Core Test Types |
|---------|-----------------|
| Auth and role selection | auth, role, validation |
| Supplier verification | state transition, admin decision, permission |
| Supplier discovery | projection, filter, visibility |
| Request creation | validation, ownership |
| Quote submission | permission, state, duplicate prevention |
| Messaging | participant access, attachment validation |
| Contact share | bilateral consent, visibility gating |
| Admin notices/stats | admin auth, read visibility |

---

## 5. Recommended Vertical Slice Backlog

1. auth and role skeleton
2. supplier profile and verification submission
3. admin review queue and decision actions
4. supplier search and detail read model
5. request creation and request lifecycle
6. quote submission and comparison
7. message thread, attachments, read state
8. contact-share consent
9. notices and basic stats

---

## 6. Definition of Ready for Coding

A slice is ready only when all of the following exist:

- mapped flow
- explicit permissions
- explicit state transitions
- required fields and validation rules
- API endpoints
- acceptance and rejection scenarios
