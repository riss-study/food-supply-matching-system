# Data Model

> 상태: Active Baseline
> 범위: Phase 1 데이터 모델 재정의 초안
> 연관 문서: `system-architecture.md`, `api-spec.md`, `phase1-architecture-reboot.md`

---

## 1. 목적과 범위

이 문서는 Phase 1의 command/write 모델, query/read 모델, 데이터 소유권, 관계, 상태 모델, projection 대상을 정의한다.

이 문서의 책임은 아래와 같다.

- command entity / aggregate 정의
- query read model 정의
- RDB / MongoDB ownership 정의
- 상태 전이와 주요 guard rule 정의
- projection 대상과 eventual consistency 범위 정의

이 문서는 아래 내용을 상세히 다루지 않는다.

- 앱/서버/모듈 구조와 package 규칙 -> `system-architecture.md`
- 엔드포인트별 request/response 계약 -> `api-spec.md`

---

## 2. 모델링 원칙

- base package는 `dev.riss.fsm`을 사용한다.
- command와 query는 같은 도메인이라도 다른 모델로 취급한다.
- write side는 RDB(MariaDB / MySQL-compatible)를 source of truth로 사용한다.
- write side access는 `R2DBC` 기반으로 설계한다.
- read side는 MongoDB document/query store를 사용한다.
- read model은 projection 결과물이며 primary write source가 아니다.
- 상태 규칙과 권한 규칙은 command aggregate가 최종 책임을 가진다.

---

## 3. 주요 역할

- Guest
- Requester
- Supplier
- Admin

### 3.1 권한 매트릭스

| 리소스 / 액션 | Guest | Requester | Supplier | Admin |
|---------------|-------|-----------|----------|-------|
| 공개 공급자 목록 보기 | 가능 | 가능 | 가능 | 가능 |
| 승인된 공급자 상세 보기 | 제한적 가능 | 가능 | 가능 | 가능 |
| 의뢰 생성 | 불가 | 승인된 요청자만 | 불가 | 불가 |
| 본인 의뢰 수정 | 불가 | 승인된 요청자만 | 불가 | 가능 |
| open 의뢰 보기 | 불가 | 소유자 + 응답 가능 공급자 | 응답 가능 공급자 | 가능 |
| 견적 제출 | 불가 | 불가 | 승인된 공급자만 | 불가 |
| 견적 비교 | 불가 | 의뢰 소유자 | 불가 | 가능 |
| 스레드 메시지 전송 | 불가 | 스레드 참여자 | 스레드 참여자 | 감사 목적으로만 |
| 연락처 공유 요청 | 불가 | 스레드 참여자 | 스레드 참여자 | 불가 |
| 검수 승인 | 불가 | 불가 | 불가 | 가능 |
| 공급자 상태 변경 | 불가 | 불가 | 불가 | 가능 |
| 공지 관리 | 불가 | 불가 | 불가 | 가능 |

---

## 4. Command / Write Model

### 4.1 Identity & Access

#### UserAccount

- id
- role
- email
- password_hash
- status
- created_at

#### BusinessProfile

- id
- user_account_id
- business_name
- business_registration_number
- contact_name
- contact_phone
- contact_email
- verification_scope
- approval_state

### 4.2 Supplier Lifecycle

#### SupplierProfile

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

#### VerificationSubmission

- id
- supplier_profile_id
- state
- submitted_at
- reviewed_at
- reviewed_by
- review_note_internal
- review_note_public

#### CertificationRecord

- id
- supplier_profile_id
- type
- number
- file_attachment_id
- status

### 4.3 Matching & Collaboration

#### Request

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

#### TargetedSupplierLink

- id
- request_id
- supplier_profile_id

#### Quote

- id
- request_id
- supplier_profile_id
- unit_price_estimate
- moq
- lead_time
- sample_cost
- note
- state

#### MessageThread

- id
- request_id
- requester_user_id
- supplier_profile_id
- contact_share_state

#### Message

- id
- thread_id
- sender_user_id
- body
- read_at

#### ContactShareConsent

- id
- thread_id
- state
- requested_by
- approved_by_requester_at
- approved_by_supplier_at
- revoked_by
- revoked_at

### 4.4 Operations

#### Notice

- id
- title
- body
- state
- published_at

#### Attachment

- id
- owner_type
- owner_id
- file_name
- content_type
- file_size
- storage_key

#### AuditLog

- id
- actor_user_id
- action_type
- target_type
- target_id
- payload_snapshot
- created_at

---

## 5. Aggregate Boundary

### 5.1 Identity / Access Aggregate

- `UserAccount`
- `BusinessProfile`

주요 책임:

- 가입 / 로그인 / 계정 상태 관리
- 요청자 사업자 승인 게이트 유지

### 5.2 Supplier Lifecycle Aggregate

- `SupplierProfile`
- `VerificationSubmission`
- `CertificationRecord`

주요 책임:

- 공급자 프로필 유지
- 검수 제출 / 승인 / 보류 / 반려 / 재제출 / 정지 규칙 유지
- 검색 노출 가능 상태 관리

### 5.3 Matching Aggregate

- `Request`
- `TargetedSupplierLink`
- `Quote`

주요 책임:

- 의뢰 생성 / 수정 / 종료 / 취소
- targeted supplier 연결 유지
- 견적 제출 / 수정 / 철회 / 선택 / 거절 규칙 유지

### 5.4 Collaboration Aggregate

- `MessageThread`
- `Message`
- `ContactShareConsent`

주요 책임:

- 스레드 생성 규칙 유지
- 메시지 참여자 제한 유지
- 연락처 공유 상태 머신 유지

### 5.5 Operations Aggregate

- `Notice`
- `AuditLog`

주요 책임:

- 공지 게시 / 보관 관리
- 감사 추적 이벤트 기록

---

## 6. Write Store Ownership

### 6.1 Relational Write Tables

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

규칙:

- 위 테이블은 transactional source of truth다.
- command side 상태 변경은 이 저장소를 기준으로 발생한다.
- `R2DBC` adapter가 relational write access를 담당한다.

---

## 7. Query / Read Model

### 7.1 Mongo Read Models

- supplier_search_view
- supplier_detail_view
- requester_request_summary_view
- supplier_request_feed_view
- quote_comparison_view
- thread_summary_view
- thread_detail_view
- admin_review_queue_view
- admin_review_detail_view
- admin_notice_management_view
- stats_summary_view

규칙:

- read model은 UI/조회 최적화를 위해 비정규화될 수 있다.
- read model은 command entity와 동일한 필드 구조를 강제하지 않는다.
- read model은 primary write source가 되면 안 된다.

### 7.2 Projection Ownership

- supplier lifecycle 변경 -> supplier search/detail, admin review queue/detail projection 갱신
- request / quote 변경 -> requester request summary, supplier request feed, quote comparison projection 갱신
- thread / contact-share 변경 -> thread summary/detail projection 갱신
- notice 변경 -> public notice / admin notice management projection 갱신
- 운영 이벤트 -> stats summary projection 갱신

---

## 8. 상태 모델

### 8.1 Requester Business Approval

**상태 값:** `not_submitted` | `submitted` | `approved` | `rejected`

**상태 전이:**

```
not_submitted --[submit]--> submitted
submitted --[approve]--> approved
submitted --[reject]--> rejected
```

규칙:

- `approved` 상태인 요청자만 의뢰 생성 / 수정 / 게시 가능
- `submitted`, `rejected` 상태의 요청자는 탐색과 계정 관리만 가능

**용어 정의:**

- `submit`: 사용자가 사업자 정보를 제출하는 행위
- `approve`: 관리자가 제출을 승인하는 행위
- `reject`: 관리자가 제출을 반려하는 행위

### 8.2 Supplier Verification

**상태 값:** `draft` | `submitted` | `under_review` | `hold` | `rejected` | `approved` | `suspended`

**상태 전이:**

```
draft --[submit]--> submitted
submitted --[start_review]--> under_review
under_review --[approve]--> approved
under_review --[hold]--> hold
hold --[resubmit]--> submitted
under_review --[reject]--> rejected
rejected --[resubmit]--> submitted
approved --[suspend]--> suspended
suspended --[resume_review]--> under_review
```

**상태 의미:**

| 상태 | 의미 | 노출 | 참여 |
|------|------|------|------|
| `draft` | 작성 중 | 숨김 | 불가 |
| `submitted` | 제출됨, 대기 중 | 숨김 | 불가 |
| `under_review` | 검수 중 | 숨김 | 불가 |
| `hold` | 추가 정보 필요 | 숨김 | 불가 |
| `rejected` | 반려됨 | 숨김 | 불가 |
| `approved` | 승인됨 | 노출 | 가능 |
| `suspended` | 활동 정지 | 숨김 | 불가 |

**용어 정의:**

- `submit`: 사용자가 검수 서류를 제출하는 행위
- `start_review`: 관리자가 검수를 시작하는 행위
- `approve`: 관리자가 승인하는 행위
- `hold`: 관리자가 보류하는 행위
- `reject`: 관리자가 반려하는 행위
- `resubmit`: 사용자가 수정 후 다시 제출하는 행위
- `suspend`: 관리자가 활동을 정지하는 행위
- `resume_review`: 관리자가 정지를 해제하고 검수를 재개하는 행위

### 8.2.1 관리자 검수 결정 입력

관리자가 검수 결정 시 필요한 필드:

| 필드 | 설명 | 용도 |
|------|------|------|
| decision | 결정 유형 | `approve`, `hold`, `reject`, `suspend` 중 하나 |
| reviewer_id | 검수자 식별자 | 감사 추적용 |
| reviewed_at | 검수 시각 | 감사 추적용 |
| internal_note | 내부용 메모 | 관리자 간 참고용 |
| public_note | 사용자 표시용 메모 | `hold` 또는 `rejected` 시 사용자에게 노출 |

### 8.2.2 사용자 표시 문구

API 응답의 `reviewNotePublic` 필드에 표시되는 기본 문구:

- `hold` 상태: `추가 서류 또는 정보 보완이 필요합니다. 내용을 보완한 뒤 다시 제출해주세요.`
- `rejected` 상태: `이번 제출은 승인되지 않았습니다. 내용을 수정한 뒤 다시 제출해주세요.`

### 8.3 Request State

**상태 값:** `draft` | `open` | `closed` | `cancelled`

**상태 전이:**

```
draft --[publish]--> open
draft --[cancel]--> cancelled
open --[close]--> closed
open --[cancel]--> cancelled
```

**용어 정의:**

- `publish`: 의뢰를 공개 등록하는 행위
- `close`: 의뢰를 마감하는 행위
- `cancel`: 의뢰를 취소하는 행위

### 8.4 Quote State

**상태 값:** `submitted` | `selected` | `withdrawn` | `declined`

**상태 전이:**

```
submitted --[select]--> selected
submitted --[withdraw]--> withdrawn
submitted --[decline]--> declined
```

**용어 정의:**

- `submit`: 공급자가 견적을 제출하는 행위
- `select`: 요청자가 견적을 선택하는 행위
- `withdraw`: 공급자가 견적을 철회하는 행위
- `decline`: 요청자가 견적을 거절하는 행위

### 8.5 Contact Share State

**상태 값:** `not_requested` | `requested` | `one_side_approved` | `mutually_approved` | `revoked`

**상태 전이:**

```
not_requested --[request]--> requested
requested --[approve_by_requester]--> one_side_approved
requested --[approve_by_supplier]--> one_side_approved
one_side_approved --[approve_by_other]--> mutually_approved
requested --[revoke]--> revoked
one_side_approved --[revoke]--> revoked
revoked --[request_new]--> requested (새 cycle)
```

**용어 정의:**

- `request`: 한쪽이 연락처 공유를 요청하는 행위
- `approve_by_requester`: 요청자가 동의하는 행위
- `approve_by_supplier`: 공급자가 동의하는 행위
- `approve_by_other`: 다른 쪽이 동의하여 상호 승인에 도달하는 행위
- `revoke`: 승인 전에 요청을 철회하는 행위
- `request_new`: 철회 후 새로운 공유 cycle을 시작하는 행위

규칙:

- 외부 연락처는 `mutually_approved`에서만 공개
- `revoked` 이후 새 동의 cycle 생성 가능
- 이미 공개된 연락처는 revoke로 다시 숨기지 않음

---

## 9. 주요 권한 / 노출 규칙

- 미승인 공급자는 검색에 나타나면 안 된다.
- 미승인 공급자는 견적을 제출하면 안 된다.
- 요청자는 자기 의뢰의 견적만 비교할 수 있다.
- 메시지 스레드는 참여자와 감사 목적으로 접근하는 관리자만 볼 수 있다.
- 관리자 반려에는 사유 코드 또는 설명 메모가 필요하다.
- `suspended` 공급자는 즉시 노출과 견적 참여 권한을 잃는다.

### 9.1 공급자 노출 규칙

| 검수 상태 | 검색 노출 | 공급자 상세 노출 | 견적 참여 가능 |
|-----------|-----------|------------------|----------------|
| draft | 숨김 | 본인 / 관리자만 | 불가 |
| submitted | 숨김 | 본인 / 관리자만 | 불가 |
| under_review | 숨김 | 본인 / 관리자만 | 불가 |
| hold | 숨김 | 본인 / 관리자만 | 불가 |
| approved | 노출 | 공개 / 요청자 노출 | 가능 |
| rejected | 숨김 | 본인 / 관리자만 | 불가 |
| suspended | 숨김 | 본인 / 관리자만 | 불가 |

---

## 10. 관계 및 유니크 조건

### 10.1 관계 요약

- 하나의 `UserAccount`는 하나의 `BusinessProfile`을 가질 수 있다.
- 하나의 공급자 `UserAccount`는 하나의 `SupplierProfile`을 가진다.
- 하나의 `SupplierProfile`은 시간에 따라 여러 `VerificationSubmission`을 가질 수 있다.
- 하나의 `Request`는 하나의 요청자에게 속한다.
- 하나의 `Request`는 여러 `Quote`를 가질 수 있다.
- 하나의 `Request`는 `TargetedSupplierLink`를 통해 여러 공급자를 대상으로 할 수 있다.
- 하나의 requester-supplier-request 조합은 하나의 active `MessageThread`를 가진다.
- 하나의 `MessageThread`는 여러 `Message`를 가진다.

### 10.2 유니크 조건

- `user_account.email` unique
- 공급자 계정당 active supplier profile 1개
- `(request_id, supplier_profile_id)`당 active quote 1개
- `(request_id, requester_user_id, supplier_profile_id)`당 active thread 1개

---

## 11. Audit / Projection Notes

### 11.1 Audit 대상 이벤트

- 검수 제출
- 관리자 승인 / 반려 / 보류 / 정지
- 의뢰 게시 / 종료 / 취소
- 견적 제출 / 철회 / 선택 / 거절
- 연락처 공유 상태 변경

### 11.2 Search Projection 최소 필드

- supplier id
- company name
- region
- categories
- verification state
- capacity summary
- moq
- oem/odm flags

규칙:

- 공개 / 요청자용 검색 뷰에는 `approved` 공급자만 projection 되어야 한다.

---

## 12. Out of Scope for This Doc

- SQL table DDL 상세
- Mongo index 상세
- 이벤트 payload 스키마 상세
- endpoint request/response payload 상세
