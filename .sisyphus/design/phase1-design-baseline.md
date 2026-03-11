# Phase 1 MVP Design Baseline

> Version: 1.0
> Status: Active
> Scope: Trusted matching core only
> Source of Truth: `../plans/document-structure-plan.md`, `../drafts/1st-phase-requirements-final.md`, `../drafts/PRD-v1.0-MVP-Korean.md`

---

## 1. Purpose

This document freezes the implementation baseline for Phase 1 so downstream design docs do not reopen product scope.

---

## 2. In Scope

- requester business onboarding
- supplier signup and profile creation
- supplier verification submission and admin review
- supplier discovery via search and filters
- request creation
- public request exposure and targeted supplier inquiry
- quote submission and comparison
- message threads with attachments and read state
- bilateral contact sharing
- admin notices and basic operational stats

---

## 3. Out of Scope

- review/rating system
- map-based discovery
- WebSocket real-time delivery guarantees
- OCR automation
- external business verification API
- AI recommendation, chatbot, price prediction
- payment, escrow, electronic contract
- community boards, education, consulting operations

---

## 4. Actors

| Actor | Definition |
|------|------------|
| Requester | Business-side user posting manufacturing requests |
| Supplier | Manufacturer-side user creating supplier profile and submitting quotes |
| Admin | Internal operator reviewing verification and managing platform basics |

---

## 5. Core Objects

- UserAccount
- BusinessProfile
- SupplierProfile
- VerificationSubmission
- CertificationRecord
- Request
- Quote
- MessageThread
- Message
- Attachment
- ContactShareConsent
- Notice
- AuditLog

---

## 6. Product Invariants

1. Phase 1 is B2B-first.
2. Supplier trust is determined by verification state.
3. Messaging belongs to request/quote context.
4. Contact details are hidden until bilateral consent succeeds.
5. Manual review is the MVP trust mechanism.
6. Phase 1 must remain buildable without mandatory third-party integrations.

---

## 7. Canonical Terms

| Term | Meaning |
|------|---------|
| Requester | Demand-side business user |
| Supplier | Supply-side manufacturer |
| Verification | Reviewable trust submission for supplier/business credibility |
| Request | Manufacturing request created by requester |
| Quote | Supplier response with terms |
| Message Thread | Context-bound conversation between requester and supplier |
| Contact Share | Bilateral consent to reveal external contact info |

---

## 8. Allowed TBD Items

- infra vendor
- file storage vendor
- CDN
- exact deployment topology
- exact MongoDB read-model shapes after final index tuning

These items may remain open if API, permissions, and state rules do not depend on them.

---

## 9. Not Allowed to Remain TBD

- verification states and their effects
- who can see which supplier/profile state
- request and quote lifecycle rules
- contact-sharing rules
- required fields and validation semantics
- API boundaries for MVP flows

---

## 10. Downstream Documents

- `phase1-information-architecture-and-flows.md`
- `phase1-permissions-and-state-model.md`
- `phase1-domain-and-data-model.md`
- `phase1-api-and-validation-spec.md`
- `phase1-acceptance-scenarios-and-backlog.md`
