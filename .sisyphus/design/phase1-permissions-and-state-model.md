# Phase 1 Permissions and State Model

> Version: 1.0
> Status: Active
> Parent: `phase1-design-baseline.md`

---

## 1. Roles

- Guest
- Requester
- Supplier
- Admin

---

## 1.5 Requester Business Approval Gate

### Requester Business State

`not_submitted -> submitted -> approved`

Additional exit:

- `submitted -> rejected`

### Rules

- requester signup/login is allowed before approval
- only `approved` requester business state may create, edit, or publish requests
- `submitted` and `rejected` requester states may browse and manage account data, but may not create requests

---

## 2. Verification State Model

### Supplier Verification State

`draft -> submitted -> under_review -> approved`

Additional exits:

- `under_review -> hold`
- `hold -> submitted`
- `under_review -> rejected`
- `rejected -> submitted`
- `approved -> suspended`
- `suspended -> under_review`

### Business Meaning

| State | Meaning |
|-------|---------|
| draft | supplier has not submitted full verification |
| submitted | supplier requested review |
| under_review | admin is actively processing |
| hold | supplier must supplement documents or information |
| approved | supplier is trusted for normal Phase 1 operations |
| rejected | supplier must fix and resubmit |
| suspended | supplier visibility/eligibility restricted by admin |

---

## 3. Supplier Exposure Rules

| Verification State | Search Visibility | Supplier Detail Visibility | Quote Eligibility |
|--------------------|------------------|----------------------------|------------------|
| draft | hidden | owner/admin only | no |
| submitted | hidden | owner/admin only | no |
| under_review | hidden | owner/admin only | no |
| hold | hidden | owner/admin only | no |
| approved | visible | public/requester visible | yes |
| rejected | hidden | owner/admin only | no |
| suspended | hidden | owner/admin only | no |

---

## 4. Request State Model

`draft -> open -> closed`

Additional exit:

- `draft -> cancelled`
- `open -> cancelled`

Rules:

- only `open` requests accept new quotes
- `closed` means requester no longer accepts new quote activity
- `cancelled` hides or disables transaction actions

---

## 5. Quote State Model

`submitted -> selected`

Additional exits:

- `submitted -> withdrawn`
- `submitted -> declined`

Rules:

- supplier creates at most one active quote per request
- requester can move a quote to `selected` or `declined`
- supplier can move own submitted quote to `withdrawn` before selection
- quote PATCH is allowed only while state is `submitted`
- quote PATCH may modify only price/MOQ/lead-time/sample-cost/note fields
- quote PATCH must store revision history

---

## 6. Contact Share State Model

`not_requested -> requested -> one_side_approved -> mutually_approved`

Additional exit:

- any non-final state may be `revoked`

Rules:

- external contact details are visible only in `mutually_approved`
- revoke is allowed only in `requested` and `one_side_approved`
- a new consent cycle may be created after `revoked`
- revoke does not hide contact details that were already revealed in `mutually_approved`

---

## 7. Permission Matrix

| Resource / Action | Guest | Requester | Supplier | Admin |
|-------------------|-------|-----------|----------|-------|
| View public supplier list | yes | yes | yes | yes |
| View approved supplier detail | limited | yes | yes | yes |
| Create request | no | approved requester only | no | no |
| Edit own request | no | approved requester only | no | yes |
| View open request | no | owner + eligible supplier | eligible supplier | yes |
| Submit quote | no | no | approved supplier only | no |
| Compare quotes | no | request owner | no | yes |
| Send thread message | no | thread participant | thread participant | audit only |
| Request contact share | no | thread participant | thread participant | no |
| Approve verification | no | no | no | yes |
| Change supplier state | no | no | no | yes |
| Manage notices | no | no | no | yes |

---

## 8. Guard Rules

1. Unapproved suppliers cannot appear in search.
2. Unapproved suppliers cannot submit quotes.
3. Requesters can only compare quotes on their own requests.
4. Message thread access is limited to thread participants and admins with audit context.
5. Admin rejection requires a reason code or explanatory note.
6. Suspended suppliers lose exposure and quote eligibility immediately.

---

## 9. Admin Review Decision Rules

### Review Outcomes

- approve
- hold
- reject
- resubmission

### Minimum Admin Inputs

- decision
- reviewer id
- timestamp
- internal note
- user-visible note when rejected or resubmission is required

### Outcome Meanings

- `hold`: more information is needed; supplier remains hidden and ineligible; resubmission is expected
- `reject`: current submission is denied; supplier remains hidden and ineligible; a later resubmission is allowed
- `resubmission`: supplier action that moves a held or rejected submission back to `submitted`

### User-Facing Text

- `hold`: `추가 서류 또는 정보 보완이 필요합니다. 내용을 보완한 뒤 다시 제출해주세요.`
- `reject`: `이번 제출은 승인되지 않았습니다. 내용을 수정한 뒤 다시 제출해주세요.`
