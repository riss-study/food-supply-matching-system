# Phase 1 API 및 검증 스펙

> 버전: 1.0
> 상태: Active
> 상위 문서: `phase1-design-baseline.md`

---

## 1. API 그룹

- 인증 및 계정
- 사업자 / 공급자 검수
- 공급자 탐색
- 의뢰
- 견적
- 메시지 스레드 및 메시지
- 연락처 공유
- 공지
- 관리자 검수 및 통계

---

## 2. 엔드포인트 목록

### 인증 및 계정

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/me`

### 요청자 / 사업자

- `POST /api/requester/business-profile`
- `GET /api/requester/business-profile`
- `PATCH /api/requester/business-profile`

### 공급자 프로필 및 검수

- `POST /api/supplier/profile`
- `GET /api/supplier/profile`
- `PATCH /api/supplier/profile`
- `POST /api/supplier/verification-submissions`
- `GET /api/supplier/verification-submissions/latest`

### 공급자 탐색

- `GET /api/suppliers`
- `GET /api/suppliers/{supplierId}`

### 의뢰

- `POST /api/requests`
- `GET /api/requests`
- `GET /api/requests/{requestId}`
- `PATCH /api/requests/{requestId}`
- `POST /api/requests/{requestId}/close`
- `POST /api/requests/{requestId}/cancel`
- `POST /api/requests/{requestId}/threads`

### 견적

- `POST /api/requests/{requestId}/quotes`
- `GET /api/requests/{requestId}/quotes`
- `PATCH /api/quotes/{quoteId}`
- `POST /api/quotes/{quoteId}/withdraw`
- `POST /api/quotes/{quoteId}/select`
- `POST /api/quotes/{quoteId}/decline`

### 메시지 스레드

- `GET /api/threads`
- `GET /api/threads/{threadId}`
- `POST /api/threads/{threadId}/messages`
- `POST /api/threads/{threadId}/attachments`
- `POST /api/threads/{threadId}/read`

### 연락처 공유

- `POST /api/threads/{threadId}/contact-share/request`
- `POST /api/threads/{threadId}/contact-share/approve`
- `POST /api/threads/{threadId}/contact-share/revoke`

### 공지

- `GET /api/notices`
- `GET /api/notices/{noticeId}`

### 관리자

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

## 3. 검증 규칙

### 공통

- 모든 id는 서버가 생성해야 한다.
- 공개 탐색 엔드포인트를 제외한 모든 write 엔드포인트는 인증된 사용자만 접근할 수 있다.
- 권한 없는 접근은 `403`
- 잘못된 payload는 `400`
- 없는 리소스는 `404`

### 공급자 프로필

- `company_name` 필수
- `region` 필수
- category는 최소 1개 이상 필수
- `monthly_capacity`는 양수
- `moq`는 양수

### 검수 제출

- 공급자 프로필이 먼저 있어야 제출 가능
- 최소 1개 이상의 사업자 증빙 문서 필요
- 파일 형식은 허용된 MIME 목록만 가능
- 파일 크기와 개수는 서버 규칙으로 제한

### 의뢰

- title 필수
- category 필수
- desired volume은 양수
- request mode는 `public` 또는 `targeted`
- targeted 모드는 최소 1개 이상의 targeted supplier link 필요
- 요청자 사업자 상태가 `approved`여야 의뢰 생성 / 수정 가능

### 견적

- 승인된 공급자만 제출 가능
- 의뢰는 `open` 상태여야 함
- 가격과 MOQ는 입력 시 양수여야 함
- 같은 공급자는 같은 의뢰에 active 견적을 중복 제출할 수 없음
- 견적 PATCH는 `submitted` 상태에서만 가능
- PATCH는 `unit_price_estimate`, `moq`, `lead_time`, `sample_cost`, `note`만 수정 가능
- PATCH 시 수정 이력을 남겨야 함

### 스레드와 메시지

- sender는 스레드 참여자여야 함
- message body 또는 attachment 중 하나는 있어야 함
- 첨부 파일은 type/size 규칙으로 검증
- 스레드는 첫 견적 제출 또는 요청자 `상담 시작` 액션으로 생성 가능
- 수동 스레드 생성은 기존 requester-supplier-request 조합의 스레드가 있으면 재사용해야 함

### 연락처 공유

- actor는 스레드 참여자여야 함
- 연락처는 상호 동의 완료 후에만 공개
- revoke는 `requested` 또는 `one_side_approved` 상태에서만 가능
- retry는 `revoked` 이후 새로운 consent cycle을 생성하는 방식으로 허용
- 이미 `mutually_approved` 후 공개된 연락처는 revoke로 다시 숨기지 않음

---

## 4. 응답 형태 가이드

- list 엔드포인트는 pagination을 지원해야 한다.
- search 엔드포인트는 category, region, verification, capacity, MOQ, OEM, ODM query param을 지원해야 한다.
- 상태 필드는 자유 문자열이 아니라 명시적 enum이어야 한다.
- 감사용 internal note는 non-admin 호출자에게 노출되면 안 된다.

---

## 5. 에러 모델

| 코드 | 의미 |
|------|------|
| 400 | validation failure |
| 401 | unauthenticated |
| 403 | role 또는 state 기반 접근 금지 |
| 404 | resource not found |
| 409 | state conflict 또는 duplicate active submission |
