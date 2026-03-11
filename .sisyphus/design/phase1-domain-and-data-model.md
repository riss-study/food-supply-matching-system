# Phase 1 Domain and Data Model

> Version: 1.0
> Status: Active
> Parent: `phase1-design-baseline.md`

---

## 1. Domain Aggregates

### UserAccount

- id
- role
- email
- password_hash
- status
- created_at

### BusinessProfile

- id
- user_account_id
- business_name
- business_registration_number
- contact_name
- contact_phone
- contact_email
- verification_scope

### SupplierProfile

- id
- supplier_user_id
- company_name
- representative_name
- region
- categories
- equipment_summary
- monthly_capacity
- moq
- oem_available
- odm_available
- raw_material_support
- packaging_labeling_support
- introduction
- exposure_state

### VerificationSubmission

- id
- supplier_profile_id
- state
- submitted_at
- reviewed_at
- reviewed_by
- review_note_internal
- review_note_public

### CertificationRecord

- id
- supplier_profile_id
- type
- number
- file_attachment_id
- status

### Request

- id
- requester_user_id
- mode (`public` / `targeted`)
- title
- category
- desired_volume
- target_price_range
- certification_requirement
- raw_material_rule
- packaging_requirement
- delivery_requirement
- notes
- state

### TargetedSupplierLink

- id
- request_id
- supplier_profile_id

### Quote

- id
- request_id
- supplier_profile_id
- unit_price_estimate
- moq
- lead_time
- sample_cost
- note
- state

### MessageThread

- id
- request_id
- requester_user_id
- supplier_profile_id
- contact_share_state

### Message

- id
- thread_id
- sender_user_id
- body
- read_at

### Attachment

- id
- owner_type
- owner_id
- file_name
- content_type
- file_size
- storage_key

### Notice

- id
- title
- body
- state
- published_at

### AuditLog

- id
- actor_user_id
- action_type
- target_type
- target_id
- payload_snapshot
- created_at

---

## 2. Relational Ownership

### MariaDB / MySQL-Compatible Write Models

- user_account
- business_profile
- supplier_profile
- verification_submission
- certification_record
- request
- targeted_supplier_link
- quote
- message_thread
- message
- contact_share_consent
- notice
- audit_log
- attachment_metadata

These are transactional sources of truth.

### MongoDB Read Models

- supplier_search_view
- supplier_detail_view
- requester_request_summary_view
- supplier_request_feed_view
- quote_comparison_view
- thread_summary_view
- admin_review_queue_view
- stats_summary_view

These are derived read models and must never become primary write sources.

---

## 3. Relationship Summary

- one `UserAccount` may own one `BusinessProfile`
- one supplier `UserAccount` owns one `SupplierProfile`
- one `SupplierProfile` may have many `VerificationSubmission` records over time
- one `Request` belongs to one requester
- one `Request` may have many `Quote` rows
- one `Request` may target many suppliers via `TargetedSupplierLink`
- one requester-supplier-request combination has one active `MessageThread`
- one `MessageThread` has many `Message` rows

---

## 4. Recommended Keys and Uniqueness

- `user_account.email` unique
- one active supplier profile per supplier account
- one active quote per `(request_id, supplier_profile_id)`
- one active thread per `(request_id, requester_user_id, supplier_profile_id)`

---

## 5. Audit Requirements

Audit logs are required for:

- verification submissions
- admin approval/rejection/suspension
- request publication/closure/cancellation
- quote submission/withdrawal/selection/decline
- contact-share state changes

---

## 6. Search Projection Notes

Search read model should include:

- supplier id
- company name
- region
- categories
- verification state
- capacity summary
- moq
- oem/odm flags

Only approved suppliers are projected into public requester-facing search views.
