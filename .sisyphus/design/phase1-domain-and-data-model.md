# Phase 1 도메인 및 데이터 모델

> 버전: 1.0
> 상태: Active
> 상위 문서: `phase1-design-baseline.md`

---

## 1. 도메인 Aggregate

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

## 2. 데이터 소유 구조

### MariaDB / MySQL 호환 write 모델

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

위 테이블들은 transactional source of truth다.

### MongoDB read 모델

- supplier_search_view
- supplier_detail_view
- requester_request_summary_view
- supplier_request_feed_view
- quote_comparison_view
- thread_summary_view
- admin_review_queue_view
- stats_summary_view

위 모델들은 derived read model이며, primary write source가 되어서는 안 된다.

---

## 3. 관계 요약

- 하나의 `UserAccount`는 하나의 `BusinessProfile`을 가질 수 있다.
- 하나의 공급자 `UserAccount`는 하나의 `SupplierProfile`을 가진다.
- 하나의 `SupplierProfile`은 시간에 따라 여러 `VerificationSubmission`을 가질 수 있다.
- 하나의 `Request`는 하나의 요청자에게 속한다.
- 하나의 `Request`는 여러 `Quote`를 가질 수 있다.
- 하나의 `Request`는 `TargetedSupplierLink`를 통해 여러 공급자를 대상으로 할 수 있다.
- 하나의 requester-supplier-request 조합은 하나의 active `MessageThread`를 가진다.
- 하나의 `MessageThread`는 여러 `Message`를 가진다.

---

## 4. 권장 키와 유니크 조건

- `user_account.email` unique
- 공급자 계정당 active supplier profile 1개
- `(request_id, supplier_profile_id)`당 active quote 1개
- `(request_id, requester_user_id, supplier_profile_id)`당 active thread 1개

---

## 5. 감사 로그 요구사항

아래 이벤트는 audit log가 필요하다.

- 검수 제출
- 관리자 승인 / 반려 / 보류 / 정지
- 의뢰 게시 / 종료 / 취소
- 견적 제출 / 철회 / 선택 / 거절
- 연락처 공유 상태 변경

---

## 6. 검색 projection 메모

검색 read model에는 최소한 아래가 포함되어야 한다.

- supplier id
- company name
- region
- categories
- verification state
- capacity summary
- moq
- oem/odm flags

공개 / 요청자용 검색 뷰에는 `approved` 공급자만 projection 되어야 한다.
