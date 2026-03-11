# Product Requirements Document (PRD) - v1.0 MVP

> Project: food2008-matching
> Version: 1.0.0-MVP
> Status: Active
> Document Role: Detailed implementation baseline
> Mirror Source: `PRD-v1.0-MVP-Korean.md`
> Upstream Baseline: `1st-phase-requirements-final.md`

---

## 1. Purpose

This document defines what should actually be built in Phase 1 / MVP.

It keeps the long-term product ambition visible, but it does not let future vision expand the current MVP scope.

---

## 2. Product Framing

### 2.1 Long-Term Vision

The long-term direction is a broader food-manufacturing platform that can grow from matching into trust management, operational support, community/content, and later AI capabilities.

### 2.2 v1.0 MVP Definition

v1.0 MVP is a **trusted matching core**.

Included:

- business-oriented user flows
- supplier verification status management
- supplier profiles
- search and filtering
- request and quotation flow
- message threads
- basic admin review tools

Excluded:

- community expansion
- education/consulting operations
- reviews and ratings
- map-based discovery
- WebSocket-driven real-time enhancements
- OCR and automated external verification
- AI recommendation, chatbot, pricing prediction
- payment, escrow, e-contract

---

## 3. User Roles

| Role | Description | Core MVP Actions |
|------|-------------|------------------|
| Requester | Business user requesting manufacturing | sign up, post requests, discover suppliers, compare quotations, exchange messages |
| Supplier | Manufacturer or supply-side company | sign up, build profile, submit verification documents, send quotations, reply in threads |
| Admin | Platform operator | review verification, update status, post notices, view basic stats |

---

## 4. Phase 1 Core Features

### 4.1 AUTH-001 Registration and Verification State

#### Description

Both requesters and suppliers can register, and supplier visibility/privileges should reflect verification state.

#### Acceptance Criteria

1. Email-based registration and login are supported.
2. Users can choose requester or supplier role.
3. Requesters can submit business information.
4. Suppliers can submit business and certification information.
5. Admins can review submissions and change status.
6. Supplier profiles display verification state.

#### Notes

- MVP uses manual review by default.
- External business-verification APIs are not a required MVP dependency.

---

### 4.2 PROFILE-001 Supplier Profile

#### Required Fields

- company name
- representative name
- location
- contact information
- categories served
- equipment summary
- monthly capacity
- MOQ
- OEM/ODM availability
- raw-material support
- packaging/labeling support

#### Optional or Reviewable Fields

- HACCP status and documents
- ISO/FSSC and other certifications
- portfolio images
- major clients
- company introduction

#### Acceptance Criteria

1. Suppliers can create and update their profile.
2. Requesters can see core capabilities and trust signals.
3. Certification information is shown in structured fields.
4. Admin review status affects profile exposure state.

---

### 4.3 SEARCH-001 Search and Filtering

#### Required MVP Capabilities

- keyword search
- card view
- list view
- category filter
- region filter
- verification filter
- production-capability filter
- MOQ filter
- OEM/ODM filter

#### Acceptance Criteria

1. Requesters can search supplier listings.
2. Filter combinations narrow the result set.
3. Users can switch between card and list views.
4. Listing cards show at least company name, category, region, verification state, and key capability signals.

#### Not in Phase 1

- review-based sorting/filtering
- distance sort
- map view

---

### 4.4 REQUEST-001 Request Posting

#### Base Structure

- product name
- category
- target production volume
- target price range
- certification requirement
- raw-material responsibility
- packaging/labeling requirement
- delivery requirement
- attachments
- notes

#### Acceptance Criteria

1. Requesters can create requests.
2. Requests can be public or directed to selected suppliers.
3. Suppliers can view relevant requests and respond.

---

### 4.5 QUOTE-001 Quotation Submission and Comparison

#### Quotation Fields

- estimated unit price
- MOQ
- lead time
- sample cost
- additional note

#### Acceptance Criteria

1. Suppliers can submit quotations to requests.
2. Requesters can compare received quotations.
3. Requesters can continue follow-up discussion with selected suppliers.

---

### 4.6 MESSAGE-001 Message Threads

#### Description

Phase 1 communication is defined as **message threads**, not guaranteed real-time chat.

#### Acceptance Criteria

1. Requesters and suppliers can exchange messages in request/quotation context.
2. Images and files can be attached.
3. Read state can be displayed.
4. Contact details can be revealed after mutual agreement.
5. Users can discover new messages from the web app.

#### Not in Phase 1

- WebSocket-backed delivery guarantees
- push notifications
- typing indicators
- voice/video calling

---

### 4.7 ADMIN-001 Admin Basics

#### Acceptance Criteria

1. Admins can view user and supplier lists.
2. Admins can review business/certification submissions.
3. Admins can change supplier state.
4. Admins can post notices.
5. Admins can view basic operational metrics.

---

## 5. Phase 2+ Candidate Scope

- reviews and ratings
- map-based discovery
- real-time communication upgrades
- OCR automation
- external verification APIs
- AI recommendation/tagging/FAQ
- payment, escrow, e-contract
- community and content features

---

## 6. Non-Functional Requirements

### 6.1 Usability

- entering the discovery flow should be easy
- food-manufacturing terms should be explainable in UI
- verification state should be clearly visible

### 6.2 Responsive Behavior

- design desktop-first, but core flows must remain usable on mobile web

### 6.3 Security

- verification documents require access control
- sensitive information requires role-based visibility
- uploaded files require type restrictions and basic validation

---

## 7. Technical Baseline

| Area | Baseline |
|------|----------|
| Frontend | React |
| Backend | Kotlin Spring Boot |
| Relational Store | MariaDB or MySQL-compatible engine |
| Query/Document Store | MongoDB |
| Design Direction | CQRS |

### Still Open

- infrastructure vendor
- file-storage vendor
- CDN
- map provider
- external verification provider
- real-time transport strategy

---

## 8. External Dependency Principle

Phase 1 must remain viable without mandatory third-party service dependencies.

The following may be added later, but are not MVP prerequisites:

- map APIs
- business-verification APIs
- OCR services
- payment services

---

## 9. Validation Scenarios

### Requester Scenario

1. requester signs up
2. requester submits business info
3. requester explores suppliers
4. requester posts a request
5. requester compares quotations
6. requester continues discussion through message threads

### Supplier Scenario

1. supplier signs up
2. supplier submits profile and verification data
3. admin reviews status
4. supplier submits quotation
5. supplier continues message exchange

### Admin Scenario

1. admin reviews submitted documents
2. admin updates state
3. admin posts notices
4. admin checks core metrics

---

## 10. References

- `1st-phase-requirements-final.md`
- `requirements-final-summary-v1.1.md`
- `.sisyphus/plans/document-structure-plan.md`
- `food2008-analysis-report.md`
- `.sisyphus/design/phase1-design-baseline.md`
- `.sisyphus/design/phase1-information-architecture-and-flows.md`
- `.sisyphus/design/phase1-permissions-and-state-model.md`
- `.sisyphus/design/phase1-domain-and-data-model.md`
- `.sisyphus/design/phase1-api-and-validation-spec.md`
- `.sisyphus/design/phase1-acceptance-scenarios-and-backlog.md`

---

## 11. Status Notes

- This is the current English PRD mirror.
- The Korean PRD remains the primary detailed source.
- If the requirements baseline changes, this file must be synchronized after the Korean PRD.
