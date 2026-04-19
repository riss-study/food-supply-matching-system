# API Spec

> 상태: Active Baseline
> 범위: Phase 1 API 계약 상세 정의
> 연관 문서: `system-architecture.md`, `data-model.md`, `phase1-policy-closure-log.md`

---

## 1. 목적과 범위

이 문서는 Phase 1의 외부 HTTP API 계약을 endpoint 단위로 상세히 정의한다.

이 문서의 책임:

- `api-server`와 `admin-server`의 external API surface 정의
- endpoint별 상세 request/response contract 정의
- 인증/인가 요구 및 에러 계약 정의
- validation 규칙과 상태 전이 조건 명시

이 문서는 아래 내용을 다루지 않는다:

- 시스템 구조와 모듈 경계 -> `system-architecture.md`
- entity / aggregate / read model 구조 -> `data-model.md`

---

## 2. Global Transport Contract

### 2.1 Base URLs

| 서버 | 환경 | Base URL |
|------|------|----------|
| api-server | 개발 | `<api-server-dev-base-url>` |
| api-server | 운영 | `<api-server-prod-base-url>` |
| admin-server | 개발 | `<admin-server-dev-base-url>` |
| admin-server | 운영 | `<admin-server-prod-base-url>` |

주의:

- 실제 도메인/호스트명은 배포 및 인프라 문서에서 확정한다.
- 이 문서는 API 경계와 계약만 정의한다.

### 2.2 Content Negotiation

모든 JSON endpoint:

- Request: `Content-Type: application/json`
- Response: `Content-Type: application/json`

파일 업로드 endpoint:

- Request: `Content-Type: multipart/form-data`

### 2.3 인증

인증이 필요한 endpoint:

```
Authorization: Bearer <JWT_TOKEN>
```

JWT 토큰은 로그인 응답의 `data.accessToken`에서 발급받는다.

공통 요청 헤더 기본값:

- JSON endpoint: `Accept: application/json`
- body가 있는 JSON endpoint: `Content-Type: application/json`
- 인증 필요 endpoint: `Authorization: Bearer <JWT_TOKEN>`

### 2.4 공통 성공 응답 패턴

```json
{
  "code": 100,
  "message": "Success",
  "data": { ... },
  "meta": { ... }
}
```

**Success Response Fields:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| code | integer | O | 100 = 성공 |
| message | string | O | 응답 설명 |
| data | object/array | O | 실제 응답 데이터 |
| meta | object | X | 페이지네이션 등 메타 정보 |

### 2.5 공통 에러 응답 패턴

HTTP 4xx/5xx 상태코드와 함께:

```json
{
  "code": 4001,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ],
  "traceId": "abc123-def456"
}
```

**Error Response Fields:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| code | integer | O | 에러 코드 |
| message | string | O | 에러 설명 |
| errors | array | X | 필드별 에러 상세 |
| traceId | string | X | 디버깅용 추적 ID |

`errors[]` 항목 기본 필드:

| 필드 | 타입 | 설명 |
|------|------|------|
| field | string | 입력 필드 경로 |
| message | string | 사용자 친화 메시지 |

**Code 규약**:
- 성공: `code = 100` (고정)
- 4자리 정수. 도메인별 specific code 는 §5 에 정의
- 매핑되지 않은 `ResponseStatusException` 은 fallback 으로 `HTTP status × 10`
  을 사용 (예: 404 → `4040`, 500 → `5000`). 새 도메인 code 추가 시 이 범위와
  겹치지 않도록 할당 (예: 403 대역은 `4031~4039`, fallback `4030` 은 예약).
| reason | string | 서버 검증 사유 키 또는 설명 |
| rejectedValue | any | 필요 시 잘못된 입력값 |

### 2.6 HTTP Status Code 사용 범위

| 상태코드 | 사용 상황 |
|----------|-----------|
| 200 | GET/PUT/PATCH/DELETE 성공 |
| 201 | POST로 리소스 생성 성공 |
| 400 | 요청 형식 오류, validation 실패 |
| 401 | 인증되지 않음 (토큰 없음/만료) |
| 403 | 권한 없음 (role/state 기반 접근 금지) |
| 404 | 리소스 없음 |
| 409 | 상태 충돌, 중복 제출 |
| 422 | 비즈니스 규칙 위반 |
| 500 | 서버 오류 |

규칙:

- 성공/비즈니스 결과는 body `code`로 표현한다.
- `code=100`은 성공이다.
- 인증/인가/시스템 오류는 HTTP `4xx/5xx`를 유지한다.
- 에러 body에도 app-level `code`를 포함한다.

### 2.7 페이지네이션 규칙

**Query Parameters:**

| 파라미터 | 타입 | 기본값 | 최대값 | 설명 |
|----------|------|--------|--------|------|
| page | integer | 1 | - | 1-based 페이지 번호 |
| size | integer | 20 | 100 | 페이지 크기 |
| sort | string | createdAt | - | 정렬 필드 |
| order | string | desc | - | asc/desc |

**Response Meta Fields:**

```json
{
  "meta": {
    "page": 1,
    "size": 20,
    "totalPages": 5,
    "totalElements": 100,
    "hasNext": true,
    "hasPrev": false
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| page | integer | 현재 페이지 번호 |
| size | integer | 페이지 크기 |
| totalPages | integer | 전체 페이지 수 |
| totalElements | integer | 전체 요소 수 |
| hasNext | boolean | 다음 페이지 존재 여부 |
| hasPrev | boolean | 이전 페이지 존재 여부 |

### 2.8 ID 및 경로 규칙

- 모든 ID는 서버가 생성하는 opaque string identifier를 사용한다.
- 예시에서 `usr_...`, `bprof_...` 등 prefix가 보일 수 있으나, 이는 가독성을 위한 표시일 뿐이다. 클라이언트는 ID 형식이나 prefix 패턴에 의존해서는 안 된다.
- URL path의 ID 파라미터는 `{resourceId}` 형태로 표기한다.
- Path prefix: `/api` (api-server), `/api/admin` (admin-server)

---

## 3. api-server Endpoints

### 3.1 인증 및 계정

#### POST /api/auth/signup

**설명:** 이메일 기반 회원가입

**인증:** 불필요

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "role": "requester",
  "businessName": "주식회사 예시"
}
```

**Request Body Fields:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| email | string | O | 이메일 형식, unique |
| password | string | O | 8-100자, 영문/숫자/특수문자 포함 |
| role | string | O | `requester` or `supplier` |
| businessName | string | O | 2-100자 |

**Success Response (201):**
```json
{
  "code": 100,
  "message": "Account created successfully",
  "data": {
    "userId": "usr_01HQX...",
    "email": "user@example.com",
    "role": "requester",
    "createdAt": "2026-03-12T10:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| userId | string | 생성된 사용자 ID |
| email | string | 가입 이메일 |
| role | string | 사용자 역할 |
| createdAt | string | 생성 시각 (ISO 8601) |

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 400 | 4001 | validation 실패 (email 형식, password 길이 등) |
| 409 | 4091 | 이미 존재하는 이메일 |

---

#### POST /api/auth/login

**설명:** 이메일/비밀번호 로그인

**인증:** 불필요

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Request Body Fields:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| email | string | O | 이메일 형식 |
| password | string | O | 8-100자 |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "expiresIn": 3600,
    "user": {
      "userId": "usr_01HQX...",
      "email": "user@example.com",
      "role": "requester"
    }
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| accessToken | string | API 호출용 JWT 토큰 |
| refreshToken | string | 토큰 갱신용 |
| expiresIn | integer | 토큰 만료 시간 (초) |
| user | object | 사용자 정보 |
| user.userId | string | 사용자 ID |
| user.email | string | 이메일 |
| user.role | string | 역할 |

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 401 | 4011 | 잘못된 이메일 또는 비밀번호 |

---

#### GET /api/me

**설명:** 현재 로그인한 사용자 정보 조회

**인증:** 필요

**Request Headers:**
```
Authorization: Bearer <JWT>
```

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Success",
  "data": {
    "userId": "usr_01HQX...",
    "email": "user@example.com",
    "role": "requester",
    "businessApprovalState": "approved",
    "createdAt": "2026-03-12T10:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| userId | string | 사용자 ID |
| email | string | 이메일 |
| role | string | 역할 (`requester`/`supplier`/`admin`) |
| businessApprovalState | string | 요청자 사업자 승인 상태 |
| createdAt | string | 가입 시각 (ISO 8601) |

**Error Responses:**

| HTTP | 상황 |
|------|------|
| 401 | 토큰 없음 또는 만료 |

---

### 3.2 요청자 / 사업자 프로필

#### POST /api/requester/business-profile

**설명:** 요청자 사업자 정보 제출 (승인 게이트 진입)

**인증:** 필요 (role=requester)

**Request Headers:**
```
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:**
```json
{
  "businessName": "주식회사 예시",
  "businessRegistrationNumber": "123-45-67890",
  "contactName": "홍길동",
  "contactPhone": "010-1234-5678",
  "contactEmail": "contact@example.com",
  "verificationScope": "domestic"
}
```

**Request Body Fields:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| businessName | string | O | 2-100자 |
| businessRegistrationNumber | string | O | 사업자등록번호 형식 |
| contactName | string | O | 2-50자 |
| contactPhone | string | O | 전화번호 형식 |
| contactEmail | string | O | 이메일 형식 |
| verificationScope | string | O | `domestic` or `overseas` |

**Success Response (201):**
```json
{
  "code": 100,
  "message": "Business profile submitted",
  "data": {
    "profileId": "bprof_01HQX...",
    "approvalState": "submitted",
    "submittedAt": "2026-03-12T10:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| profileId | string | 사업자 프로필 ID |
| approvalState | string | `submitted` |
| submittedAt | string | 제출 시각 (ISO 8601) |

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 400 | 4001 | validation 실패 |
| 403 | 4031 | supplier 역할로 접근 시도 |
| 409 | 4092 | 이미 제출된 사업자 정보 있음 |

---

#### GET /api/requester/business-profile

**설명:** 본인 사업자 정보 조회

**인증:** 필요 (role=requester)

**Request Headers:**
```
Authorization: Bearer <JWT>
```

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Success",
  "data": {
    "profileId": "bprof_01HQX...",
    "businessName": "주식회사 예시",
    "businessRegistrationNumber": "123-45-67890",
    "contactName": "홍길동",
    "contactPhone": "010-1234-5678",
    "contactEmail": "contact@example.com",
    "verificationScope": "domestic",
    "approvalState": "approved",
    "submittedAt": "2026-03-12T10:00:00Z",
    "approvedAt": "2026-03-13T09:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| profileId | string | 사업자 프로필 ID |
| businessName | string | 상호명 |
| businessRegistrationNumber | string | 사업자등록번호 |
| contactName | string | 담당자명 |
| contactPhone | string | 연락처 |
| contactEmail | string | 이메일 |
| verificationScope | string | 검증 범위 (`domestic`/`overseas`) |
| approvalState | string | 승인 상태 |
| submittedAt | string | 제출 시각 (ISO 8601) |
| approvedAt | string | 승인 시각 (ISO 8601, approved 상태일 때) |
| rejectedAt | string | 반려 시각 (ISO 8601, rejected 상태일 때) |
| rejectionReason | string | 반려 사유 (rejected 상태일 때) |

**Error Responses:**

| HTTP | 상황 |
|------|------|
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 사업자 정보 없음 |

---

#### PATCH /api/requester/business-profile

**설명:** 사업자 정보 수정 (submitted/rejected 상태에서만 가능)

**인증:** 필요 (role=requester)

**Request Headers:**
```
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:** (일부 필드만 포함 가능)
```json
{
  "contactPhone": "010-9876-5432",
  "contactEmail": "new@example.com"
}
```

**Request Body Fields:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| contactPhone | string | X | 전화번호 형식 |
| contactEmail | string | X | 이메일 형식 |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Profile updated",
  "data": {
    "profileId": "bprof_01HQX...",
    "approvalState": "submitted",
    "updatedAt": "2026-03-12T11:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| profileId | string | 사업자 프로필 ID |
| approvalState | string | 현재 승인 상태 |
| updatedAt | string | 수정 시각 (ISO 8601) |

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 400 | 4001 | validation 실패 |
| 403 | 4032 | approved 상태에서는 수정 불가 |
| 422 | 4221 | 허용되지 않는 필드 수정 시도 |

---

### 3.3 공급자 프로필 및 검수 제출

#### POST /api/supplier/profile

**설명:** 공급자 프로필 생성

**인증:** 필요 (role=supplier)

**Request Headers:**
```
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:**
```json
{
  "companyName": "예시 식품",
  "representativeName": "김공급",
  "region": "경기도 화성시",
  "categories": ["snack", "beverage"],
  "equipmentSummary": "자동 포장기 3대",
  "monthlyCapacity": "50000",
  "moq": "1000",
  "oemAvailable": true,
  "odmAvailable": false,
  "rawMaterialSupport": true,
  "packagingLabelingSupport": true,
  "introduction": "건강한 간식을 만드는 공급자입니다."
}
```

**Request Body Fields:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| companyName | string | O | 2-100자 |
| representativeName | string | O | 2-50자 |
| region | string | O | 지역 문자열 |
| categories | array | O | 최소 1개, 카테고리 코드 |
| equipmentSummary | string | X | 0-500자 |
| monthlyCapacity | string | O | 숫자 문자열 (예: "50000") |
| moq | string | O | 숫자 문자열 (예: "1000") |
| oemAvailable | boolean | O | - |
| odmAvailable | boolean | O | - |
| rawMaterialSupport | boolean | X | - |
| packagingLabelingSupport | boolean | X | - |
| introduction | string | X | 0-2000자 |

**Success Response (201):**
```json
{
  "code": 100,
  "message": "Supplier profile created",
  "data": {
    "profileId": "sprof_01HQX...",
    "verificationState": "draft",
    "exposureState": "hidden",
    "createdAt": "2026-03-12T10:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| profileId | string | 공급자 프로필 ID |
| verificationState | string | 검수 상태 (`draft`) |
| exposureState | string | 노출 상태 (`hidden`) |
| createdAt | string | 생성 시각 (ISO 8601) |

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 400 | 4001 | validation 실패 |
| 403 | 4031 | requester 역할로 접근 시도 |
| 409 | 4092 | 이미 프로필 존재 |

---

#### GET /api/supplier/profile

**설명:** 본인 공급자 프로필 조회

**인증:** 필요 (role=supplier)

**Request Headers:**
```
Authorization: Bearer <JWT>
```

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Success",
  "data": {
    "profileId": "sprof_01HQX...",
    "companyName": "예시 식품",
    "representativeName": "김공급",
    "region": "경기도 화성시",
    "categories": ["snack", "beverage"],
    "equipmentSummary": "자동 포장기 3대",
    "monthlyCapacity": "50000",
    "moq": "1000",
    "oemAvailable": true,
    "odmAvailable": false,
    "rawMaterialSupport": true,
    "packagingLabelingSupport": true,
    "introduction": "건강한 간식을 만드는 공급자입니다.",
    "verificationState": "draft",
    "exposureState": "hidden",
    "certifications": [],
    "createdAt": "2026-03-12T10:00:00Z",
    "updatedAt": "2026-03-12T10:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| profileId | string | 공급자 프로필 ID |
| companyName | string | 회사명 |
| representativeName | string | 대표자명 |
| region | string | 지역 |
| categories | array | 카테고리 코드 목록 |
| equipmentSummary | string | 보유 설비 요약 |
| monthlyCapacity | string | 월 생산 가능량 |
| moq | string | 최소 주문 수량 |
| oemAvailable | boolean | OEM 가능 여부 |
| odmAvailable | boolean | ODM 가능 여부 |
| rawMaterialSupport | boolean | 원재료 제공 가능 여부 |
| packagingLabelingSupport | boolean | 포장/라벨링 지원 여부 |
| introduction | string | 회사 소개 |
| verificationState | string | 검수 상태 |
| exposureState | string | 노출 상태 (`hidden`/`visible`) |
| certifications | array | 인증서 목록 |
| createdAt | string | 생성 시각 (ISO 8601) |
| updatedAt | string | 수정 시각 (ISO 8601) |

---

#### PATCH /api/supplier/profile

**설명:** 공급자 프로필 수정 (draft/hold/rejected 상태에서만 가능)

**인증:** 필요 (role=supplier)

**Request Headers:**
```
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:** (일부 필드만 포함 가능)
```json
{
  "equipmentSummary": "자동 포장기 5대",
  "monthlyCapacity": "80000"
}
```

**Request Body Fields:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| companyName | string | X | 2-100자 |
| representativeName | string | X | 2-50자 |
| region | string | X | 지역 문자열 |
| categories | array | X | 최소 1개 |
| equipmentSummary | string | X | 0-500자 |
| monthlyCapacity | string | X | 숫자 문자열 |
| moq | string | X | 숫자 문자열 |
| oemAvailable | boolean | X | - |
| odmAvailable | boolean | X | - |
| rawMaterialSupport | boolean | X | - |
| packagingLabelingSupport | boolean | X | - |
| introduction | string | X | 0-2000자 |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Profile updated",
  "data": {
    "profileId": "sprof_01HQX...",
    "updatedAt": "2026-03-12T11:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| profileId | string | 공급자 프로필 ID |
| updatedAt | string | 수정 시각 (ISO 8601) |

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 403 | 4033 | approved 상태에서 수정 불가 |

---

#### POST /api/supplier/verification-submissions

**설명:** 검수 서류 제출

**인증:** 필요 (role=supplier)

**Request Headers:**
```
Authorization: Bearer <JWT>
Content-Type: multipart/form-data
```

**Request Body (multipart):**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| businessRegistrationDoc | file | O | 사업자등록증 |
| certifications | file[] | X | 인증서 파일들 |
| portfolioImages | file[] | X | 포트폴리오 이미지 |

**파일 제약:**

- 허용 형식: `image/jpeg`, `image/png`, `application/pdf`
- 최대 크기: 10MB per file
- 최대 개수: 10개 per request

**Success Response (201):**
```json
{
  "code": 100,
  "message": "Verification submitted",
  "data": {
    "submissionId": "vsub_01HQX...",
    "state": "submitted",
    "submittedAt": "2026-03-12T10:00:00Z",
    "fileCount": 3
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| submissionId | string | 제출 ID |
| state | string | `submitted` |
| submittedAt | string | 제출 시각 (ISO 8601) |
| fileCount | integer | 업로드된 파일 수 |

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 400 | 4002 | 파일 형식/크기 위반 |
| 422 | 4222 | 프로필 없이 제출 시도 |
| 409 | 4093 | 이미 검수 중인 제출 존재 |

---

#### GET /api/supplier/verification-submissions/latest

**설명:** 최신 검수 제출 상태 조회

**인증:** 필요 (role=supplier)

**Request Headers:**
```
Authorization: Bearer <JWT>
```

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Success",
  "data": {
    "submissionId": "vsub_01HQX...",
    "state": "hold",
    "submittedAt": "2026-03-12T10:00:00Z",
    "reviewedAt": "2026-03-13T14:00:00Z",
    "reviewNotePublic": "추가 서류 또는 정보 보완이 필요합니다. 내용을 보완한 뒤 다시 제출해주세요.",
    "files": [
      { "fileId": "f_01", "fileName": "business.pdf", "status": "reviewed" }
    ]
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| submissionId | string | 제출 ID |
| state | string | 제출 상태 |
| submittedAt | string | 제출 시각 (ISO 8601) |
| reviewedAt | string | 검수 시각 (ISO 8601) |
| reviewNotePublic | string | 사용자 표시용 검수 코멘트 |
| reviewNoteInternal | string | 관리자 내부용 코멘트 (관리자 조회 시) |
| files | array | 제출된 파일 목록 |
| files[].fileId | string | 파일 ID |
| files[].fileName | string | 파일명 |
| files[].status | string | 파일 상태 |

**Error Responses:**

| HTTP | 상황 |
|------|------|
| 404 | 제출 이력 없음 |

---

### 3.4 공급자 탐색

#### GET /api/suppliers

**설명:** 공개 공급자 목록 검색 (승인된 공급자만 노출)

**인증:** 선택적 (인증 시 추가 정보 제공 가능)

**Request Headers:**
```
Authorization: Bearer <JWT>  (선택)
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| keyword | string | X | 회사명 키워드 검색 |
| category | string | X | 카테고리 필터 |
| region | string | X | 지역 필터 |
| oem | boolean | X | OEM 가능 여부 |
| odm | boolean | X | ODM 가능 여부 |
| minCapacity | integer | X | 최소 생산능력 |
| maxMoq | integer | X | 최대 MOQ |
| page | integer | X | 페이지 (기본 1) |
| size | integer | X | 페이지 크기 (기본 20, 최대 100) |
| sort | string | X | 정렬 필드 (기본 createdAt) |
| order | string | X | 정렬 순서 (기본 desc) |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Success",
  "data": [
    {
      "profileId": "sprof_01",
      "companyName": "예시 식품",
      "region": "경기도 화성시",
      "categories": ["snack"],
      "monthlyCapacity": "50000",
      "moq": "1000",
      "oemAvailable": true,
      "odmAvailable": false,
      "verificationState": "approved",
      "logoUrl": "https://..."
    }
  ],
  "meta": {
    "page": 1,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Success Response Fields (data[] items):**

| 필드 | 타입 | 설명 |
|------|------|------|
| profileId | string | 공급자 프로필 ID |
| companyName | string | 회사명 |
| region | string | 지역 |
| categories | array | 카테고리 코드 목록 |
| monthlyCapacity | string | 월 생산 가능량 |
| moq | string | 최소 주문 수량 |
| oemAvailable | boolean | OEM 가능 여부 |
| odmAvailable | boolean | ODM 가능 여부 |
| verificationState | string | `approved` (목록에는 승인된 공급자만) |
| logoUrl | string | 로고 이미지 URL |

**Success Response Fields (meta):**

| 필드 | 타입 | 설명 |
|------|------|------|
| page | integer | 현재 페이지 |
| size | integer | 페이지 크기 |
| totalElements | integer | 전체 요소 수 |
| totalPages | integer | 전체 페이지 수 |
| hasNext | boolean | 다음 페이지 존재 여부 |
| hasPrev | boolean | 이전 페이지 존재 여부 |

---

#### GET /api/suppliers/{supplierId}

**설명:** 공급자 상세 정보 조회

**인증:** 선택적

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| supplierId | string | 공급자 프로필 ID |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Success",
  "data": {
    "profileId": "sprof_01HQX...",
    "companyName": "예시 식품",
    "representativeName": "김공급",
    "region": "경기도 화성시",
    "categories": ["snack", "beverage"],
    "equipmentSummary": "자동 포장기 3대",
    "monthlyCapacity": "50000",
    "moq": "1000",
    "oemAvailable": true,
    "odmAvailable": false,
    "rawMaterialSupport": true,
    "packagingLabelingSupport": true,
    "introduction": "건강한 간식을 만드는 공급자입니다.",
    "verificationState": "approved",
    "certifications": [
      { "type": "HACCP", "number": "12345", "valid": true }
    ],
    "portfolioImages": [
      { "imageId": "img_01", "url": "https://..." }
    ]
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| profileId | string | 공급자 프로필 ID |
| companyName | string | 회사명 |
| representativeName | string | 대표자명 |
| region | string | 지역 |
| categories | array | 카테고리 코드 목록 |
| equipmentSummary | string | 보유 설비 요약 |
| monthlyCapacity | string | 월 생산 가능량 |
| moq | string | 최소 주문 수량 |
| oemAvailable | boolean | OEM 가능 여부 |
| odmAvailable | boolean | ODM 가능 여부 |
| rawMaterialSupport | boolean | 원재료 제공 가능 여부 |
| packagingLabelingSupport | boolean | 포장/라벨링 지원 여부 |
| introduction | string | 회사 소개 |
| verificationState | string | 검수 상태 |
| certifications | array | 인증서 목록 |
| certifications[].type | string | 인증 유형 |
| certifications[].number | string | 인증 번호 |
| certifications[].valid | boolean | 유효 여부 |
| portfolioImages | array | 포트폴리오 이미지 목록 |
| portfolioImages[].imageId | string | 이미지 ID |
| portfolioImages[].url | string | 이미지 URL |
| logoUrl | string | 로고 이미지 URL (있는 경우) |

**Error Responses:**

| HTTP | 상황 |
|------|------|
| 404 | 공급자 없음 또는 승인되지 않음 |

---

#### GET /api/suppliers/categories

**설명:** 탐색 화면에서 사용할 공급자 카테고리 목록과 각 카테고리에 매칭되는 승인된 공급자 수를 반환

**인증:** 선택적

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Success",
  "data": [
    { "category": "snack", "supplierCount": 12 },
    { "category": "beverage", "supplierCount": 5 }
  ]
}
```

**Success Response Fields (data[] items):**

| 필드 | 타입 | 설명 |
|------|------|------|
| category | string | 카테고리 코드 |
| supplierCount | integer | 해당 카테고리에 노출되는 승인 공급자 수 |

---

#### GET /api/suppliers/regions

**설명:** 탐색 화면에서 사용할 공급자 지역 목록과 각 지역에 매칭되는 승인된 공급자 수를 반환

**인증:** 선택적

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Success",
  "data": [
    { "region": "경기 화성", "supplierCount": 8 },
    { "region": "서울 강남", "supplierCount": 3 }
  ]
}
```

**Success Response Fields (data[] items):**

| 필드 | 타입 | 설명 |
|------|------|------|
| region | string | 지역명 |
| supplierCount | integer | 해당 지역의 승인 공급자 수 |

---

### 3.5 의뢰

#### POST /api/requests

**설명:** 의뢰 생성 (승인된 요청자만 가능)

**인증:** 필요 (role=requester, approvalState=approved)

**Request Headers:**
```
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:**
```json
{
  "mode": "public",
  "title": "수제 과자 제조 의뢰",
  "category": "snack",
  "desiredVolume": "10,000개",
  "targetPriceRange": { "min": "500원/kg", "max": "1000원/kg" },
  "certificationRequirement": ["HACCP"],
  "rawMaterialRule": "supplier_provided",
  "packagingRequirement": "private_label",
  "deliveryRequirement": "2026-06-01",
  "notes": "유기농 원재료 사용 필수"
}
```

**Request Body Fields:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| mode | string | O | `public` or `targeted` |
| title | string | O | 5-200자 |
| category | string | O | 카테고리 코드 |
| desiredVolume | string | O | 자유 텍스트 (예: "10,000개") |
| targetPriceRange | object | X | {min, max} |
| targetPriceRange.min | string | X | 자유 텍스트 (예: "500원/kg") |
| targetPriceRange.max | string | X | 자유 텍스트 (예: "1000원/kg") |
| certificationRequirement | array | X | 인증 코드 목록 |
| rawMaterialRule | string | X | `requester_provided` or `supplier_provided` |
| packagingRequirement | string | X | `private_label`, `bulk`, `none` |
| deliveryRequirement | string | X | 날짜 문자열 (YYYY-MM-DD) |
| notes | string | X | 0-2000자 |

**Success Response (201):**
```json
{
  "code": 100,
  "message": "Request created",
  "data": {
    "requestId": "req_01HQX...",
    "state": "draft",
    "createdAt": "2026-03-12T10:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| requestId | string | 의뢰 ID |
| state | string | `draft` |
| createdAt | string | 생성 시각 (ISO 8601) |

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 400 | 4001 | validation 실패 |
| 403 | 4034 | 사업자 승인되지 않은 요청자 |

---

#### GET /api/requests

**설명:** 본인 의뢰 목록 조회

**인증:** 필요 (role=requester)

**Request Headers:**
```
Authorization: Bearer <JWT>
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| state | string | X | 필터: draft/open/closed/cancelled |
| page | integer | X | 페이지 번호 (기본 1) |
| size | integer | X | 페이지 크기 (기본 20, 최대 100) |
| sort | string | X | 정렬 필드 (기본 createdAt) |
| order | string | X | 정렬 순서 (기본 desc) |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Success",
  "data": [
    {
      "requestId": "req_01HQX...",
      "title": "수제 과자 제조 의뢰",
      "category": "snack",
      "state": "open",
      "mode": "public",
      "quoteCount": 3,
      "createdAt": "2026-03-12T10:00:00Z",
      "expiresAt": "2026-04-12T10:00:00Z"
    }
  ],
  "meta": { 
    "page": 1, 
    "size": 20, 
    "totalElements": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

**Success Response Fields (data[] items):**

| 필드 | 타입 | 설명 |
|------|------|------|
| requestId | string | 의뢰 ID |
| title | string | 의뢰 제목 |
| category | string | 카테고리 코드 |
| state | string | 의뢰 상태 |
| mode | string | `public` or `targeted` |
| quoteCount | integer | 받은 견적 수 |
| createdAt | string | 생성 시각 (ISO 8601) |
| expiresAt | string | 만료 예정 시각 (ISO 8601) |

---

#### GET /api/requests/{requestId}

**설명:** 의뢰 상세 조회

**인증:** 필요 (의뢰 소유자 또는 대상 공급자)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| requestId | string | 의뢰 ID |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Success",
  "data": {
    "requestId": "req_01HQX...",
    "mode": "public",
    "title": "수제 과자 제조 의뢰",
    "category": "snack",
    "desiredVolume": "10,000개",
    "targetPriceRange": { "min": "500원/kg", "max": "1000원/kg" },
    "certificationRequirement": ["HACCP"],
    "rawMaterialRule": "supplier_provided",
    "packagingRequirement": "private_label",
    "deliveryRequirement": "2026-06-01",
    "notes": "유기농 원재료 사용 필수",
    "state": "open",
    "requester": {
      "businessName": "주식회사 예시",
      "contactName": "홍길동"
    },
    "createdAt": "2026-03-12T10:00:00Z",
    "targetSuppliers": []
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| requestId | string | 의뢰 ID |
| mode | string | `public` or `targeted` |
| title | string | 의뢰 제목 |
| category | string | 카테고리 코드 |
| desiredVolume | string | 희망 생산량 |
| targetPriceRange | object | 희망 단가 범위 |
| targetPriceRange.min | string | 최소 단가 |
| targetPriceRange.max | string | 최대 단가 |
| certificationRequirement | array | 요구 인증 목록 |
| rawMaterialRule | string | 원재료 규칙 |
| packagingRequirement | string | 포장/라벨링 요구 |
| deliveryRequirement | string | 납기 요구 (YYYY-MM-DD) |
| notes | string | 비고 |
| state | string | 의뢰 상태 |
| requester | object | 요청자 정보 |
| requester.businessName | string | 상호명 |
| requester.contactName | string | 담당자명 |
| createdAt | string | 생성 시각 (ISO 8601) |
| targetSuppliers | array | 대상 공급자 목록 (targeted 모드) |

**Error Responses:**

| HTTP | 상황 |
|------|------|
| 403 | 접근 권한 없음 (타인 의뢰) |
| 404 | 의뢰 없음 |

---

#### PATCH /api/requests/{requestId}

**설명:** 의뢰 수정 (draft/open 상태에서만 가능)

**인증:** 필요 (의뢰 소유자)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| requestId | string | 의뢰 ID |

**Request Headers:**
```
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:** (일부 필드만 포함 가능)
```json
{
  "desiredVolume": "15,000개",
  "notes": "수정된 비고 내용"
}
```

**Request Body Fields:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| title | string | X | 5-200자 |
| desiredVolume | string | X | 자유 텍스트 |
| targetPriceRange | object | X | {min, max} |
| certificationRequirement | array | X | 인증 코드 목록 |
| rawMaterialRule | string | X | `requester_provided` or `supplier_provided` |
| packagingRequirement | string | X | `private_label`, `bulk`, `none` |
| deliveryRequirement | string | X | 날짜 문자열 |
| notes | string | X | 0-2000자 |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Request updated",
  "data": {
    "requestId": "req_01HQX...",
    "state": "open",
    "updatedAt": "2026-03-12T11:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| requestId | string | 의뢰 ID |
| state | string | 현재 상태 |
| updatedAt | string | 수정 시각 (ISO 8601) |

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 403 | 4035 | 소유자 아님 또는 closed/cancelled 상태 |
| 422 | 4221 | 허용되지 않는 필드 수정 시도 |

---

#### POST /api/requests/{requestId}/publish

**설명:** draft 상태의 의뢰를 공개(open)하여 공급자 피드에 노출

**인증:** 필요 (의뢰 소유자)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| requestId | string | 의뢰 ID |

**Request Headers:**
```
Authorization: Bearer <JWT>
```

**Request Body:** 없음

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Request published",
  "data": {
    "requestId": "req_01HQX...",
    "state": "open",
    "publishedAt": "2026-04-17T02:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| requestId | string | 의뢰 ID |
| state | string | `open` |
| publishedAt | string | 공개 시각 (ISO 8601) |

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 403 | 4035 | 소유자 아님 |
| 404 | 4040 | 의뢰 없음 |
| 422 | 4222 | draft가 아닌 상태 (이미 공개/종료/취소됨) |

---

#### POST /api/requests/{requestId}/close

**설명:** 의뢰 종료 (마감)

**인증:** 필요 (의뢰 소유자)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| requestId | string | 의뢰 ID |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Request closed",
  "data": {
    "requestId": "req_01HQX...",
    "state": "closed",
    "closedAt": "2026-03-12T11:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| requestId | string | 의뢰 ID |
| state | string | `closed` |
| closedAt | string | 종료 시각 (ISO 8601) |

---

#### POST /api/requests/{requestId}/cancel

**설명:** 의뢰 취소

**인증:** 필요 (의뢰 소유자)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| requestId | string | 의뢰 ID |

**Request Headers:**
```
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "프로젝트 무산"
}
```

**Request Body Fields:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| reason | string | X | 0-500자, 취소 사유 |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Request cancelled",
  "data": {
    "requestId": "req_01HQX...",
    "state": "cancelled",
    "cancelledAt": "2026-03-12T11:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| requestId | string | 의뢰 ID |
| state | string | `cancelled` |
| cancelledAt | string | 취소 시각 (ISO 8601) |

---

#### POST /api/requests/{requestId}/threads

**설명:** 의뢰에 대한 메시지 스레드 수동 생성

**인증:** 필요 (의뢰 소유자)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| requestId | string | 의뢰 ID |

**Request Headers:**
```
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:**
```json
{
  "supplierId": "sprof_01HQX..."
}
```

**Request Body Fields:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| supplierId | string | O | 대상 공급자 프로필 ID |

**Success Response (201):**
```json
{
  "code": 100,
  "message": "Thread created",
  "data": {
    "threadId": "thd_01HQX...",
    "requestId": "req_01HQX...",
    "supplierId": "sprof_01HQX...",
    "createdAt": "2026-03-12T11:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| threadId | string | 생성된 스레드 ID |
| requestId | string | 의뢰 ID |
| supplierId | string | 공급자 ID |
| createdAt | string | 생성 시각 (ISO 8601) |

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 400 | 4003 | 이미 존재하는 스레드 (동일 조합) |
| 403 | 4036 | 승인되지 않은 공급자 대상 |
| 409 | 4094 | 이미 스레드 존재 시 기존 스레드 ID 반환 |

---

#### GET /api/supplier/requests

**설명:** 공급자에게 보이는 의뢰 피드 (공개 의뢰 + 자신이 타겟으로 지정된 의뢰)

**인증:** 필요 (role=supplier, 승인된 공급자)

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| category | string | X | 카테고리 필터 |
| page | integer | X | 페이지 (기본 1) |
| size | integer | X | 페이지 크기 (기본 20) |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Success",
  "data": [
    {
      "requestId": "req_01HQX...",
      "requesterBusinessName": "주식회사 예시",
      "title": "수제 과자 제조 의뢰",
      "category": "snack",
      "desiredVolume": 10000,
      "targetPriceRange": { "min": 500, "max": 1000 },
      "certificationRequirement": ["HACCP"],
      "mode": "public",
      "hasQuoted": false,
      "createdAt": "2026-03-12T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "size": 20,
    "totalElements": 12,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

**Success Response Fields (data[] items):**

| 필드 | 타입 | 설명 |
|------|------|------|
| requestId | string | 의뢰 ID |
| requesterBusinessName | string | 요청자 상호 |
| title | string | 의뢰 제목 |
| category | string | 카테고리 코드 |
| desiredVolume | integer | 희망 생산량 |
| targetPriceRange | object | 희망 단가 범위 (min/max) |
| certificationRequirement | array | 요구 인증 목록 |
| mode | string | `public` or `targeted` |
| hasQuoted | boolean | 본인이 이미 견적 제출했는지 여부 |
| createdAt | string | 생성 시각 (ISO 8601) |

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 403 | 4036 | 승인되지 않은 공급자 |

---

#### GET /api/supplier/requests/{requestId}

**설명:** 공급자가 접근 가능한 의뢰 상세 (공개 의뢰 또는 자신이 타겟인 경우)

**인증:** 필요 (role=supplier)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| requestId | string | 의뢰 ID |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Success",
  "data": {
    "requestId": "req_01HQX...",
    "mode": "public",
    "title": "수제 과자 제조 의뢰",
    "category": "snack",
    "desiredVolume": 10000,
    "targetPriceRange": { "min": 500, "max": 1000 },
    "certificationRequirement": ["HACCP"],
    "rawMaterialRule": "supplier_provided",
    "packagingRequirement": "private_label",
    "deliveryRequirement": "2026-06-01",
    "notes": "유기농 원재료 사용 필수",
    "state": "open",
    "requesterBusinessName": "주식회사 예시",
    "hasQuoted": false,
    "createdAt": "2026-03-12T10:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| requestId | string | 의뢰 ID |
| mode | string | `public` or `targeted` |
| title | string | 의뢰 제목 |
| category | string | 카테고리 코드 |
| desiredVolume | integer | 희망 생산량 |
| targetPriceRange | object | 희망 단가 범위 |
| certificationRequirement | array | 요구 인증 목록 |
| rawMaterialRule | string | 원재료 규칙 |
| packagingRequirement | string | 포장/라벨링 요구 |
| deliveryRequirement | string | 납기 요구 |
| notes | string | 비고 |
| state | string | 의뢰 상태 |
| requesterBusinessName | string | 요청자 상호 |
| hasQuoted | boolean | 본인이 이미 견적 제출했는지 여부 |
| createdAt | string | 생성 시각 |

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 403 | 4035 | 비공개 의뢰의 비대상 공급자 접근 |
| 404 | 4040 | 의뢰 없음 |

---

### 3.6 견적

#### POST /api/requests/{requestId}/quotes

**설명:** 견적 제출 (승인된 공급자만 가능)

**인증:** 필요 (role=supplier, verificationState=approved)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| requestId | string | 의뢰 ID |

**Request Headers:**
```
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:**
```json
{
  "unitPriceEstimate": "800",
  "moq": "2000",
  "leadTime": "30",
  "sampleCost": "50000",
  "note": "대량 주문 시 추가 할인 가능"
}
```

**Request Body Fields:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| unitPriceEstimate | string | O | 숫자 문자열, 양수 (원 단위) |
| moq | string | O | 숫자 문자열, 양수 |
| leadTime | string | O | 숫자 문자열, 양수 (일) |
| sampleCost | string | X | 숫자 문자열, 0 이상 |
| note | string | X | 0-1000자 |

**Success Response (201):**
```json
{
  "code": 100,
  "message": "Quote submitted",
  "data": {
    "quoteId": "quo_01HQX...",
    "state": "submitted",
    "threadId": "thd_01HQX...",
    "createdAt": "2026-03-12T11:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| quoteId | string | 견적 ID |
| state | string | `submitted` |
| threadId | string | 자동 생성된 메시지 스레드 ID |
| createdAt | string | 제출 시각 (ISO 8601) |

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 403 | 4037 | 미승인 공급자 또는 closed 의뢰 |
| 409 | 4095 | 같은 의뢰에 이미 active 견적 존재 |

---

#### GET /api/requests/{requestId}/quotes

**설명:** 의뢰에 대한 견적 목록 조회 (의뢰 소유자만)

**인증:** 필요 (의뢰 소유자)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| requestId | string | 의뢰 ID |

**Request Headers:**
```
Authorization: Bearer <JWT>
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| state | string | X | 필터: submitted/selected/withdrawn/declined |
| page | integer | X | 페이지 번호 (기본 1) |
| size | integer | X | 페이지 크기 (기본 20) |
| sort | string | X | 정렬 필드 (기본 submittedAt) |
| order | string | X | 정렬 순서 (기본 desc) |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Success",
  "data": [
    {
      "quoteId": "quo_01HQX...",
      "supplierId": "sprof_01",
      "companyName": "예시 식품",
      "unitPriceEstimate": "800",
      "moq": "2000",
      "leadTime": "30",
      "sampleCost": "50000",
      "state": "submitted",
      "submittedAt": "2026-03-12T11:00:00Z"
    }
  ],
  "meta": { 
    "page": 1, 
    "size": 20, 
    "totalElements": 3,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

**Success Response Fields (data[] items):**

| 필드 | 타입 | 설명 |
|------|------|------|
| quoteId | string | 견적 ID |
| supplierId | string | 공급자 프로필 ID |
| companyName | string | 회사명 |
| unitPriceEstimate | string | 예상 단가 (숫자 문자열, 원 단위) |
| moq | string | 최소 주문 수량 (숫자 문자열) |
| leadTime | string | 납기 (숫자 문자열, 일) |
| sampleCost | string | 샘플 비용 (숫자 문자열, 원 단위) |
| state | string | 견적 상태 |
| submittedAt | string | 제출 시각 (ISO 8601) |

---

#### PATCH /api/quotes/{quoteId}

**설명:** 견적 수정 (submitted 상태에서만 가능)

**인증:** 필요 (견적 제출자)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| quoteId | string | 견적 ID |

**Request Headers:**
```
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:** (수정 가능 필드만)
```json
{
  "unitPriceEstimate": "750",
  "moq": "1500",
  "leadTime": "25",
  "sampleCost": "40000",
  "note": "조건 수정"
}
```

**Request Body Fields:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| unitPriceEstimate | string | X | 숫자 문자열, 양수 |
| moq | string | X | 숫자 문자열, 양수 |
| leadTime | string | X | 숫자 문자열, 양수 (일) |
| sampleCost | string | X | 숫자 문자열, 0 이상 |
| note | string | X | 0-1000자 |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Quote updated",
  "data": {
    "quoteId": "quo_01HQX...",
    "state": "submitted",
    "version": 2,
    "updatedAt": "2026-03-12T12:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| quoteId | string | 견적 ID |
| state | string | `submitted` |
| version | integer | 수정 버전 (1부터 시작) |
| updatedAt | string | 수정 시각 (ISO 8601) |

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 403 | 4038 | selected/declined/withdrawn 상태 |
| 422 | 4223 | 수정 불가 필드 포함 |

---

#### POST /api/quotes/{quoteId}/withdraw

**설명:** 견적 철회

**인증:** 필요 (견적 제출자)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| quoteId | string | 견적 ID |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Quote withdrawn",
  "data": {
    "quoteId": "quo_01HQX...",
    "state": "withdrawn",
    "withdrawnAt": "2026-03-12T12:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| quoteId | string | 견적 ID |
| state | string | `withdrawn` |
| withdrawnAt | string | 철회 시각 (ISO 8601) |

---

#### POST /api/quotes/{quoteId}/select

**설명:** 견적 선택 (의뢰 종료 및 공급자 확정)

**인증:** 필요 (의뢰 소유자)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| quoteId | string | 견적 ID |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Quote selected",
  "data": {
    "quoteId": "quo_01HQX...",
    "state": "selected",
    "requestState": "closed",
    "selectedAt": "2026-03-12T12:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| quoteId | string | 견적 ID |
| state | string | `selected` |
| requestState | string | 관련 의뢰 상태 (`closed`) |
| selectedAt | string | 선택 시각 (ISO 8601) |

---

#### POST /api/quotes/{quoteId}/decline

**설명:** 견적 거절

**인증:** 필요 (의뢰 소유자)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| quoteId | string | 견적 ID |

**Request Headers:**
```
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "예산 초과"
}
```

**Request Body Fields:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| reason | string | X | 0-500자, 거절 사유 |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Quote declined",
  "data": {
    "quoteId": "quo_01HQX...",
    "state": "declined",
    "declinedAt": "2026-03-12T12:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| quoteId | string | 견적 ID |
| state | string | `declined` |
| declinedAt | string | 거절 시각 (ISO 8601) |

---

#### GET /api/supplier/quotes

**설명:** 현재 공급자가 제출한 견적 목록 조회

**인증:** 필요 (role=supplier, 승인된 공급자)

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| page | integer | X | 페이지 (기본 1) |
| size | integer | X | 페이지 크기 (기본 20) |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Success",
  "data": [
    {
      "quoteId": "qte_01HQX...",
      "requestId": "req_01HQX...",
      "requestTitle": "수제 과자 제조 의뢰",
      "unitPrice": 800,
      "leadTimeDays": 30,
      "state": "submitted",
      "submittedAt": "2026-03-13T09:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "size": 20,
    "totalElements": 4,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

**Success Response Fields (data[] items):**

| 필드 | 타입 | 설명 |
|------|------|------|
| quoteId | string | 견적 ID |
| requestId | string | 연결된 의뢰 ID |
| requestTitle | string | 의뢰 제목 (sample) |
| unitPrice | integer | 제출한 단가 |
| leadTimeDays | integer | 제시한 납기 (일) |
| state | string | `submitted`, `withdrawn`, `selected`, `declined` |
| submittedAt | string | 제출 시각 (ISO 8601) |

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 403 | 4036 | 승인되지 않은 공급자 |

---

### 3.7 메시지 스레드

#### GET /api/threads

**설명:** 참여 중인 메시지 스레드 목록

**인증:** 필요

**Request Headers:**
```
Authorization: Bearer <JWT>
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| unreadOnly | boolean | X | 읽지 않은 스레드만 |
| page | integer | X | 페이지 번호 (기본 1) |
| size | integer | X | 페이지 크기 (기본 20) |
| sort | string | X | 정렬 필드 (기본 lastMessageAt) |
| order | string | X | 정렬 순서 (기본 desc) |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Success",
  "data": [
    {
      "threadId": "thd_01HQX...",
      "requestId": "req_01HQX...",
      "requestTitle": "수제 과자 제조 의뢰",
      "otherParty": {
        "type": "supplier",
        "name": "예시 식품"
      },
      "lastMessage": {
        "body": "견적 확인했습니다.",
        "sentAt": "2026-03-12T11:00:00Z",
        "read": false
      },
      "unreadCount": 2,
      "contactShareState": "mutually_approved"
    }
  ],
  "meta": { 
    "page": 1, 
    "size": 20, 
    "totalElements": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

**Success Response Fields (data[] items):**

| 필드 | 타입 | 설명 |
|------|------|------|
| threadId | string | 스레드 ID |
| requestId | string | 관련 의뢰 ID |
| requestTitle | string | 의뢰 제목 |
| otherParty | object | 상대방 정보 |
| otherParty.type | string | `requester` or `supplier` |
| otherParty.name | string | 상대방 이름/상호 |
| lastMessage | object | 마지막 메시지 요약 |
| lastMessage.body | string | 메시지 내용 (최대 100자) |
| lastMessage.sentAt | string | 전송 시각 (ISO 8601) |
| lastMessage.read | boolean | 읽음 여부 |
| unreadCount | integer | 읽지 않은 메시지 수 |
| contactShareState | string | 연락처 공유 상태 |

---

#### GET /api/threads/{threadId}

**설명:** 스레드 상세 및 메시지 목록

**인증:** 필요 (스레드 참여자)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| threadId | string | 스레드 ID |

**Request Headers:**
```
Authorization: Bearer <JWT>
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| page | integer | X | 1 | 메시지 페이지 |
| size | integer | X | 20 | 메시지 개수 (최대 100) |
| sort | string | X | sentAt | 정렬 필드 |
| order | string | X | desc | 정렬 순서 |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Success",
  "data": {
    "threadId": "thd_01HQX...",
    "requestId": "req_01HQX...",
    "requestTitle": "수제 과자 제조 의뢰",
    "otherParty": {
      "type": "supplier",
      "name": "예시 식품"
    },
    "contactShareState": "mutually_approved",
    "contactShareRequestedByRole": "requester",
    "requesterApproved": true,
    "supplierApproved": true,
    "sharedContact": {
      "requester": {
        "name": "홍길동",
        "phone": "010-1111-2222",
        "email": "requester@example.com"
      },
      "supplier": {
        "name": "김공급",
        "phone": "010-1234-5678",
        "email": "supplier@example.com"
      }
    },
    "messages": [
      {
        "messageId": "msg_01HQX...",
        "senderType": "requester",
        "body": "안녕하세요",
        "attachments": [],
        "sentAt": "2026-03-12T10:00:00Z",
        "readAt": "2026-03-12T10:05:00Z"
      }
    ],
    "meta": { 
      "page": 1, 
      "size": 20,
      "totalElements": 15,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| threadId | string | 스레드 ID |
| requestId | string | 관련 의뢰 ID |
| requestTitle | string | 의뢰 제목 |
| otherParty | object | 상대방 정보 |
| otherParty.type | string | 상대방 역할 |
| otherParty.name | string | 상대방 이름/상호 |
| contactShareState | string | 연락처 공유 상태 |
| contactShareRequestedByRole | string | 현재 cycle 요청자 역할 |
| requesterApproved | boolean | 요청자 승인 여부 |
| supplierApproved | boolean | 공급자 승인 여부 |
| sharedContact | object | 공유된 연락처 (mutually_approved 상태에서만) |
| sharedContact.requester | object | 요청자 연락처 |
| sharedContact.requester.name | string | 이름 |
| sharedContact.requester.phone | string | 전화번호 |
| sharedContact.requester.email | string | 이메일 |
| sharedContact.supplier | object | 공급자 연락처 |
| sharedContact.supplier.name | string | 이름 |
| sharedContact.supplier.phone | string | 전화번호 |
| sharedContact.supplier.email | string | 이메일 |
| messages | array | 메시지 목록 |
| messages[].messageId | string | 메시지 ID |
| messages[].senderType | string | `requester` or `supplier` |
| messages[].body | string | 메시지 내용 |
| messages[].attachments | array | 첨부 파일 ID 목록 |
| messages[].sentAt | string | 전송 시각 (ISO 8601) |
| messages[].readAt | string | 읽은 시각 (ISO 8601, 읽지 않으면 null) |
| meta | object | 페이지네이션 메타 |

---

#### POST /api/threads/{threadId}/messages

**설명:** 메시지 전송

**인증:** 필요 (스레드 참여자)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| threadId | string | 스레드 ID |

**Request Headers:**
```
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:**
```json
{
  "body": "견적 확인했습니다.",
  "attachmentIds": ["att_01", "att_02"]
}
```

**Request Body Fields:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| body | string | 조건부 | 1-2000자 (attachmentIds 없을 때는 필수) |
| attachmentIds | array | X | 첨부 파일 ID 목록, 최대 10개 |

**Success Response (201):**
```json
{
  "code": 100,
  "message": "Message sent",
  "data": {
    "messageId": "msg_01HQX...",
    "sentAt": "2026-03-12T12:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| messageId | string | 생성된 메시지 ID |
| sentAt | string | 전송 시각 (ISO 8601) |

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 400 | 4004 | body와 attachment 둘 다 없음 |

---

#### POST /api/threads/{threadId}/attachments

**설명:** 첨부 파일 업로드 (메시지용)

**인증:** 필요 (스레드 참여자)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| threadId | string | 스레드 ID |

**Request Headers:**
```
Authorization: Bearer <JWT>
Content-Type: multipart/form-data
```

**Request Body (multipart):**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| file | file | O | max 10MB, 이미지/문서 |

**파일 제약:**

- 허용 형식: `image/jpeg`, `image/png`, `image/gif`, `application/pdf`
- 최대 크기: 10MB

**Success Response (201):**
```json
{
  "code": 100,
  "message": "File uploaded",
  "data": {
    "attachmentId": "att_01HQX...",
    "fileName": "spec.pdf",
    "fileSize": 1024000,
    "contentType": "application/pdf",
    "url": "https://..."
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| attachmentId | string | 첨부 파일 ID |
| fileName | string | 파일명 |
| fileSize | integer | 파일 크기 (바이트) |
| contentType | string | MIME 타입 |
| url | string | 파일 접근 URL |

---

#### POST /api/threads/{threadId}/read

**설명:** 스레드 읽음 처리

**인증:** 필요 (스레드 참여자)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| threadId | string | 스레드 ID |

**Request Headers:**
```
Authorization: Bearer <JWT>
```

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Marked as read",
  "data": {
    "threadId": "thd_01HQX...",
    "readAt": "2026-03-12T12:00:00Z",
    "unreadCount": 0
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| threadId | string | 스레드 ID |
| readAt | string | 읽음 처리 시각 (ISO 8601) |
| unreadCount | integer | 읽지 않은 메시지 수 (0) |

---

### 3.8 연락처 공유

#### POST /api/threads/{threadId}/contact-share/request

**설명:** 연락처 공유 요청

**인증:** 필요 (스레드 참여자)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| threadId | string | 스레드 ID |

**Request Headers:**
```
Authorization: Bearer <JWT>
```

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Contact share requested",
  "data": {
    "threadId": "thd_01HQX...",
    "contactShareState": "requested",
    "requestedBy": "requester",
    "requestedAt": "2026-03-12T12:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| threadId | string | 스레드 ID |
| contactShareState | string | `requested` |
| requestedBy | string | 요청자 역할 (`requester` or `supplier`) |
| requestedAt | string | 요청 시각 (ISO 8601) |

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 409 | 4096 | 이미 요청됨 또는 이미 승인됨 |

---

#### POST /api/threads/{threadId}/contact-share/approve

**설명:** 연락처 공유 승인

**인증:** 필요 (스레드 참여자, 현재 cycle에서 아직 승인하지 않은 쪽)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| threadId | string | 스레드 ID |

**Request Headers:**
```
Authorization: Bearer <JWT>
```

**Success Response (200) - 단방향 승인:**
```json
{
  "code": 100,
  "message": "Contact share approved",
  "data": {
    "threadId": "thd_01HQX...",
    "contactShareState": "one_side_approved",
    "approvedAt": "2026-03-12T12:00:00Z"
  }
}
```

**Success Response (200) - 양방향 승인:**
```json
{
  "code": 100,
  "message": "Contact share mutually approved",
  "data": {
    "threadId": "thd_01HQX...",
    "contactShareState": "mutually_approved",
    "sharedContact": {
      "requester": {
        "name": "홍길동",
        "phone": "010-1111-2222",
        "email": "requester@example.com"
      },
      "supplier": {
        "name": "김공급",
        "phone": "010-1234-5678",
        "email": "supplier@example.com"
      }
    }
  }
}
```

**Success Response Fields (one_side_approved):**

| 필드 | 타입 | 설명 |
|------|------|------|
| threadId | string | 스레드 ID |
| contactShareState | string | `one_side_approved` |
| approvedAt | string | 승인 시각 (ISO 8601) |

**Success Response Fields (mutually_approved):**

| 필드 | 타입 | 설명 |
|------|------|------|
| threadId | string | 스레드 ID |
| contactShareState | string | `mutually_approved` |
| sharedContact | object | 공유된 연락처 정보 |
| sharedContact.requester | object | 요청자 연락처 |
| sharedContact.requester.name | string | 이름 |
| sharedContact.requester.phone | string | 전화번호 |
| sharedContact.requester.email | string | 이메일 |
| sharedContact.supplier | object | 공급자 연락처 |
| sharedContact.supplier.name | string | 이름 |
| sharedContact.supplier.phone | string | 전화번호 |
| sharedContact.supplier.email | string | 이메일 |

---

#### POST /api/threads/{threadId}/contact-share/revoke

**설명:** 연락처 공유 요청 철회

**인증:** 필요 (요청자)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| threadId | string | 스레드 ID |

**Request Headers:**
```
Authorization: Bearer <JWT>
```

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Contact share request revoked",
  "data": {
    "threadId": "thd_01HQX...",
    "contactShareState": "revoked",
    "revokedAt": "2026-03-12T12:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| threadId | string | 스레드 ID |
| contactShareState | string | `revoked` |
| revokedAt | string | 철회 시각 (ISO 8601) |

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 409 | 4099 | mutually_approved 상태에서는 철회 불가 |

---

### 3.9 공개 공지

#### GET /api/notices

**설명:** 공개 공지 목록 조회

**인증:** 불필요

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| page | integer | X | 페이지 번호 (기본 1) |
| size | integer | X | 페이지 크기 (기본 20, 최대 50) |
| sort | string | X | 정렬 필드 (기본 publishedAt) |
| order | string | X | 정렬 순서 (기본 desc) |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Success",
  "data": [
    {
      "noticeId": "ntc_01HQX...",
      "title": "시스템 점검 안내",
      "excerpt": "3월 15일 오전 2시부터...",
      "publishedAt": "2026-03-12T00:00:00Z"
    }
  ],
  "meta": { 
    "page": 1, 
    "size": 20, 
    "totalElements": 10,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

**Success Response Fields (data[] items):**

| 필드 | 타입 | 설명 |
|------|------|------|
| noticeId | string | 공지 ID |
| title | string | 제목 |
| excerpt | string | 요약 (최대 200자) |
| publishedAt | string | 게시 시각 (ISO 8601) |

---

#### GET /api/notices/{noticeId}

**설명:** 공지 상세 조회

**인증:** 불필요

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| noticeId | string | 공지 ID |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Success",
  "data": {
    "noticeId": "ntc_01HQX...",
    "title": "시스템 점검 안내",
    "body": "3월 15일 오전 2시부터 4시까지 시스템 점검이 예정되어 있습니다.",
    "publishedAt": "2026-03-12T00:00:00Z",
    "attachments": [
      {
        "attachmentId": "att_01",
        "fileName": "notice.pdf",
        "fileSize": 102400,
        "url": "/api/notices/ntc_01HQX.../attachments/att_01"
      }
    ]
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| noticeId | string | 공지 ID |
| title | string | 제목 |
| body | string | 본문 |
| publishedAt | string | 게시 시각 (ISO 8601) |
| attachments | array | 첨부 파일 목록 |
| attachments[].attachmentId | string | 첨부 ID |
| attachments[].fileName | string | 파일명 |
| attachments[].fileSize | long | 파일 크기 (바이트) |
| attachments[].url | string | 첨부파일 다운로드 상대 경로 |

---

#### GET /api/notices/{noticeId}/attachments/{attachmentId}

**설명:** 공개 공지 첨부파일 다운로드

**인증:** 불필요

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| noticeId | string | 공지 ID |
| attachmentId | string | 첨부파일 ID |

**Success Response (200):**

바이너리 파일 스트림 (`Content-Disposition: attachment; filename="..."`)

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 404 | 4040 | 공지 또는 첨부파일을 찾을 수 없음 |

---

### 3.10 첨부파일

#### POST /api/attachments

**설명:** 공통(generic) 첨부파일 업로드. 도메인별 전용 업로드 엔드포인트가 아닌, 임의 owner type/id에 대한 파일 업로드용.

**인증:** 필요

**Request Headers:**
```
Authorization: Bearer <JWT>
Content-Type: multipart/form-data
```

**Request Parts:**

| 파트 | 타입 | 필수 | 설명 |
|------|------|------|------|
| ownerType | string | O | 첨부 대상 타입 (예: `supplier_profile`, `notice`, `request`) |
| ownerId | string | O | 첨부 대상 ID |
| file | file | O | 업로드 파일 |

**Success Response (201):**
```json
{
  "code": 100,
  "message": "Attachment uploaded",
  "data": {
    "attachmentId": "att_01HQX...",
    "ownerType": "supplier_profile",
    "ownerId": "sprof_01HQX...",
    "fileName": "haccp.pdf",
    "contentType": "application/pdf",
    "fileSize": 102400,
    "storageKey": "attachments/2026/04/att_01HQX...",
    "createdAt": "2026-04-17T02:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| attachmentId | string | 첨부파일 ID |
| ownerType | string | 요청 시 전달한 owner type |
| ownerId | string | 요청 시 전달한 owner id |
| fileName | string | 원본 파일명 |
| contentType | string | MIME 타입 |
| fileSize | integer | 파일 크기 (bytes) |
| storageKey | string | 저장소 내부 키 |
| createdAt | string | 업로드 시각 (ISO 8601) |

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 400 | 4001 | 파일 누락 또는 ownerType/ownerId 형식 오류 |
| 413 | 4131 | 허용 용량 초과 |
| 415 | 4151 | 허용되지 않는 MIME 타입 |

---

### 3.11 공급자 리뷰 (요청자)

리뷰는 **요청자가 완료된 거래 상대 공급자에 대해 남기는 평점+짧은 텍스트**.
검수(Verification Submission) 를 뜻하는 `/api/admin/reviews` 와 혼동되지 않도록,
본 도메인은 api-server 에서 `/api/reviews`, admin-server 에서 `/api/admin/supplier-reviews` 로 분리한다.

#### POST /api/reviews

**설명:** 리뷰 작성. 작성 자격은 `request.state=closed` + 호출자가 `request.requesterUserId` + `(request, supplier)` 쌍의 quote 가 `selected` 상태 일 때만. 쌍당 1회.

**인증:** 필요 (role=requester)

**Request Headers:**
```
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:**
```json
{
  "requestId": "req_01HQX...",
  "supplierId": "sprof_01HQX...",
  "rating": 5,
  "text": "품질·납기 모두 만족스러웠습니다."
}
```

**Request Body Fields:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| requestId | string | O | 대상 의뢰 ID |
| supplierId | string | O | 대상 공급자 프로필 ID (외부 명칭, 내부 `supplierProfileId` 와 동치) |
| rating | integer | O | 1..5 정수 |
| text | string | X | 0-500자. 금칙어 포함 시 거부 |

**Success Response (201):**
```json
{
  "code": 100,
  "message": "Review created",
  "data": {
    "reviewId": "rev_01HQX...",
    "rating": 5,
    "text": "품질·납기 모두 만족스러웠습니다.",
    "createdAt": "2026-04-20T12:00:00Z"
  }
}
```

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 400 | 4000 | rating 범위 위반 / text 길이 초과 / 필드 누락 |
| 403 | 4036 | 자격 미달 (request 미종료 / 비소유자 / selected quote 없음) |
| 404 | 4041 | requestId 에 해당하는 의뢰 없음 |
| 409 | 4094 | 이미 해당 (request, supplier) 쌍에 리뷰 존재 |
| 422 | 4222 | 금칙어 포함 등 모더레이션 위반 |

---

#### PATCH /api/reviews/{reviewId}

**설명:** 리뷰 수정. **작성 후 7일 이내, hidden=false, 본인만** 수정 가능. partial update.

**인증:** 필요 (role=requester, 리뷰 작성자)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| reviewId | string | 리뷰 ID |

**Request Body:**
```json
{
  "rating": 4,
  "text": "추가 주문 후에도 품질 유지됨."
}
```

**Request Body Fields:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| rating | integer | X | 1..5 정수 |
| text | string\|null | X | 0-500자. null 로 설정 시 본문 삭제 |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Review updated",
  "data": {
    "reviewId": "rev_01HQX...",
    "rating": 4,
    "text": "추가 주문 후에도 품질 유지됨.",
    "createdAt": "2026-04-20T12:00:00Z",
    "updatedAt": "2026-04-21T09:00:00Z"
  }
}
```

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 400 | 4000 | rating 범위 / text 길이 위반 |
| 403 | 4031 | 본인 아님 / 7일 경과 / hidden 상태 |
| 404 | 4041 | 리뷰 없음 |
| 422 | 4222 | 금칙어 포함 등 모더레이션 위반 |

---

#### GET /api/reviews/eligibility

**설명:** 리뷰 작성 가능 여부 미리 조회. UI 가 CTA 비활성화를 판단하는 데 사용.

**인증:** 필요 (role=requester)

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| requestId | string | O | 대상 의뢰 ID |
| supplierId | string | O | 대상 공급자 프로필 ID |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Eligibility resolved",
  "data": {
    "eligible": false,
    "reason": "no_selected_quote"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| eligible | boolean | 작성 가능 여부 |
| reason | string\|null | 불가 사유 (eligible=true 면 null) |

**reason 값**: `request_not_closed`, `not_request_owner`, `no_selected_quote`, `already_reviewed`

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 404 | 4041 | requestId 또는 supplierId 에 해당 리소스 없음 |

---

#### GET /api/suppliers/{supplierId}/reviews

**설명:** 공급자 상세에 노출할 리뷰 목록. `hidden=true` 인 리뷰는 제외. 작성자 회사명은 마스킹된 표시명으로 내려간다.

**인증:** 불필요 (공개)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| supplierId | string | 공급자 프로필 ID |

**Query Parameters:** (§2.7 페이지네이션 규약 준수)

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| page | integer | X | 1 | 1-based 페이지 번호 |
| size | integer | X | 20 | 페이지 크기 (1-100) |
| sort | string | X | `createdAt` | 정렬 필드 (현재는 `createdAt` 만 허용) |
| order | string | X | `desc` | `asc` / `desc` |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Reviews listed",
  "data": [
    {
      "reviewId": "rev_01HQX...",
      "rating": 5,
      "text": "품질·납기 모두 만족스러웠습니다.",
      "authorDisplayName": "(주)달*****",
      "createdAt": "2026-04-20T12:00:00Z",
      "updatedAt": "2026-04-20T12:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

**Success Response Fields (item):**

| 필드 | 타입 | 설명 |
|------|------|------|
| reviewId | string | 리뷰 ID |
| rating | integer | 1..5 |
| text | string\|null | 본문 (선택) |
| authorDisplayName | string | 작성자 회사명 마스킹 결과 (P3). 규칙: 법인 접두어 (`(주)` / `㈜` / `주식회사 ` 등) 유지 + 첫 1음절 + `*****`. 예: `(주)달콤베이커리` → `(주)달*****` |
| createdAt | string | 작성 시각 |
| updatedAt | string | 최종 수정 시각 |

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 404 | 4041 | supplier 없음 |

---

## 4. admin-server Endpoints

### 4.0 관리자 인증

#### POST /api/admin/auth/login

**설명:** 관리자 전용 로그인 (admin 역할만 허용)

**인증:** 불필요

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "SecurePass123!"
}
```

**Request Body Fields:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| email | string | O | 이메일 형식 |
| password | string | O | 8-100자 |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "expiresIn": 3600,
    "user": {
      "userId": "usr_admin01",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| accessToken | string | API 호출용 JWT 토큰 |
| refreshToken | string | 토큰 갱신용 |
| expiresIn | integer | 토큰 만료 시간 (초) |
| user | object | 사용자 정보 |
| user.userId | string | 사용자 ID |
| user.email | string | 이메일 |
| user.role | string | `admin` |

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 401 | 4011 | 잘못된 이메일 또는 비밀번호 |
| 403 | 4030 | 관리자 계정이 아닌 사용자 로그인 시도 |

---

### 4.1 관리자 검수

#### GET /api/admin/reviews

**설명:** 검수 큐 목록 조회

**인증:** 필요 (role=admin)

**Request Headers:**
```
Authorization: Bearer <JWT>
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| state | string | X | `submitted`, `under_review`, `hold`, `rejected` |
| fromDate | string | X | 제출일 시작 (ISO8601) |
| toDate | string | X | 제출일 종료 (ISO8601) |
| page | integer | X | 페이지 번호 (기본 1) |
| size | integer | X | 페이지 크기 (기본 20, 최대 100) |
| sort | string | X | 정렬 필드 (기본 submittedAt) |
| order | string | X | 정렬 순서 (기본 desc) |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Success",
  "data": [
    {
      "reviewId": "rev_01HQX...",
      "submissionId": "vsub_01HQX...",
      "supplierId": "sprof_01HQX...",
      "companyName": "예시 식품",
      "state": "submitted",
      "submittedAt": "2026-03-12T10:00:00Z",
      "pendingDays": 2
    }
  ],
  "meta": { 
    "page": 1, 
    "size": 20, 
    "totalElements": 25,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Success Response Fields (data[] items):**

| 필드 | 타입 | 설명 |
|------|------|------|
| reviewId | string | 검수 ID |
| submissionId | string | 제출 ID |
| supplierId | string | 공급자 프로필 ID |
| companyName | string | 회사명 |
| state | string | 검수 상태 |
| submittedAt | string | 제출 시각 (ISO 8601) |
| pendingDays | integer | 대기 일수 |

---

#### GET /api/admin/reviews/{reviewId}

**설명:** 검수 상세 조회

**인증:** 필요 (role=admin)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| reviewId | string | 검수 ID |

**Request Headers:**
```
Authorization: Bearer <JWT>
```

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Success",
  "data": {
    "reviewId": "rev_01HQX...",
    "submissionId": "vsub_01HQX...",
    "supplier": {
      "profileId": "sprof_01HQX...",
      "companyName": "예시 식품",
      "representativeName": "김공급",
      "region": "경기도 화성시",
      "categories": ["snack"],
      "monthlyCapacity": "50000",
      "moq": "1000",
      "oemAvailable": true,
      "odmAvailable": false
    },
    "state": "under_review",
    "submittedAt": "2026-03-12T10:00:00Z",
    "files": [
      {
        "fileId": "f_01",
        "fileName": "business.pdf",
        "contentType": "application/pdf",
        "url": "https://..."
      }
    ],
    "reviewHistory": [
      {
        "action": "submit",
        "actor": "supplier",
        "timestamp": "2026-03-12T10:00:00Z"
      }
    ],
    "reviewNoteInternal": "",
    "reviewNotePublic": ""
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| reviewId | string | 검수 ID |
| submissionId | string | 제출 ID |
| supplier | object | 공급자 정보 |
| supplier.profileId | string | 공급자 프로필 ID |
| supplier.companyName | string | 회사명 |
| supplier.representativeName | string | 대표자명 |
| supplier.region | string | 지역 |
| supplier.categories | array | 카테고리 목록 |
| supplier.monthlyCapacity | string | 생산능력 |
| supplier.moq | string | 최소 주문 수량 |
| supplier.oemAvailable | boolean | OEM 가능 여부 |
| supplier.odmAvailable | boolean | ODM 가능 여부 |
| state | string | 검수 상태 |
| submittedAt | string | 제출 시각 (ISO 8601) |
| files | array | 제출된 파일 목록 |
| files[].fileId | string | 파일 ID |
| files[].fileName | string | 파일명 |
| files[].contentType | string | MIME 타입 |
| files[].url | string | 파일 URL |
| reviewHistory | array | 검수 이력 |
| reviewHistory[].action | string | 액션 유형 |
| reviewHistory[].actor | string | 수행자 |
| reviewHistory[].timestamp | string | 시각 (ISO 8601) |
| reviewNoteInternal | string | 내부용 검수 메모 |
| reviewNotePublic | string | 공개용 검수 메모 |

---

#### POST /api/admin/reviews/{reviewId}/approve

**설명:** 검수 승인

**인증:** 필요 (role=admin)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| reviewId | string | 검수 ID |

**Request Headers:**
```
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:**
```json
{
  "noteInternal": "모든 서류 확인 완료",
  "notePublic": ""
}
```

**Request Body Fields:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| noteInternal | string | X | 0-1000자, 내부용 메모 |
| notePublic | string | X | 0-1000자, 공개용 메모 |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Review approved",
  "data": {
    "reviewId": "rev_01HQX...",
    "state": "approved",
    "supplierState": "approved",
    "reviewedAt": "2026-03-12T14:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| reviewId | string | 검수 ID |
| state | string | `approved` |
| supplierState | string | 공급자 상태 (`approved`) |
| reviewedAt | string | 검수 시각 (ISO 8601) |

---

#### POST /api/admin/reviews/{reviewId}/reject

**설명:** 검수 반려

**인증:** 필요 (role=admin)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| reviewId | string | 검수 ID |

**Request Headers:**
```
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:**
```json
{
  "noteInternal": "사업자등록증 확인 불가",
  "notePublic": "이번 제출은 승인되지 않았습니다. 내용을 수정한 뒤 다시 제출해주세요.",
  "reasonCode": "INVALID_DOCUMENT"
}
```

**Request Body Fields:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| noteInternal | string | X | 0-1000자, 내부용 메모 |
| notePublic | string | O | 0-1000자, 사용자 표시용 안내 |
| reasonCode | string | O | 반려 사유 코드 |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Review rejected",
  "data": {
    "reviewId": "rev_01HQX...",
    "state": "rejected",
    "supplierState": "rejected",
    "reviewedAt": "2026-03-12T14:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| reviewId | string | 검수 ID |
| state | string | `rejected` |
| supplierState | string | 공급자 상태 (`rejected`) |
| reviewedAt | string | 검수 시각 (ISO 8601) |

---

#### POST /api/admin/reviews/{reviewId}/hold

**설명:** 검수 보류 (추가 서류 요청)

**인증:** 필요 (role=admin)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| reviewId | string | 검수 ID |

**Request Headers:**
```
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:**
```json
{
  "noteInternal": "인증서 추가 필요",
  "notePublic": "추가 서류 또는 정보 보완이 필요합니다. 내용을 보완한 뒤 다시 제출해주세요."
}
```

**Request Body Fields:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| noteInternal | string | X | 0-1000자, 내부용 메모 |
| notePublic | string | O | 0-1000자, 보류 안내 메시지 |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Review held",
  "data": {
    "reviewId": "rev_01HQX...",
    "state": "hold",
    "supplierState": "hold",
    "reviewedAt": "2026-03-12T14:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| reviewId | string | 검수 ID |
| state | string | `hold` |
| supplierState | string | 공급자 상태 (`hold`) |
| reviewedAt | string | 검수 시각 (ISO 8601) |

---

### 4.2 관리자 공지

#### GET /api/admin/notices

**설명:** 공지 관리 목록

**인증:** 필요 (role=admin)

**Request Headers:**
```
Authorization: Bearer <JWT>
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| state | string | X | `draft`, `published`, `archived` |
| fromDate | string | X | 조회 시작일 (YYYY-MM-DD) |
| toDate | string | X | 조회 종료일 (YYYY-MM-DD), 최대 3개월 |
| page | integer | X | 페이지 번호 (기본 1) |
| size | integer | X | 페이지 크기 (기본 20, 최대 100) |
| sort | string | X | 정렬 필드 (기본 createdAt) |
| order | string | X | 정렬 순서 (기본 desc) |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Success",
  "data": [
    {
      "noticeId": "ntc_01HQX...",
      "title": "시스템 점검 안내",
      "state": "published",
      "author": "관리자",
      "publishedAt": "2026-03-12T00:00:00Z",
      "viewCount": 150
    }
  ],
  "meta": { 
    "page": 1, 
    "size": 20, 
    "totalElements": 20,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

**Success Response Fields (data[] items):**

| 필드 | 타입 | 설명 |
|------|------|------|
| noticeId | string | 공지 ID |
| title | string | 제목 |
| state | string | 공지 상태 |
| author | string | 작성자 |
| publishedAt | string | 게시 시각 (ISO 8601) |
| viewCount | integer | 조회수 |

---

#### POST /api/admin/notices

**설명:** 공지 생성

**인증:** 필요 (role=admin)

**Request Headers:**
```
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "신규 기능 안내",
  "body": "새로운 기능이 추가되었습니다.",
  "state": "draft",
  "publishImmediately": false
}
```

**Request Body Fields:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| title | string | O | 5-200자 |
| body | string | O | 10-5000자 |
| state | string | O | `draft` or `published` |
| publishImmediately | boolean | X | true 시 즉시 게시 |

**Success Response (201):**
```json
{
  "code": 100,
  "message": "Notice created",
  "data": {
    "noticeId": "ntc_01HQX...",
    "state": "draft",
    "createdAt": "2026-03-12T14:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| noticeId | string | 공지 ID |
| state | string | `draft` |
| createdAt | string | 생성 시각 (ISO 8601) |

---

#### PATCH /api/admin/notices/{noticeId}

**설명:** 공지 수정/상태 변경

**인증:** 필요 (role=admin)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| noticeId | string | 공지 ID |

**Request Headers:**
```
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Request Body:** (일부 필드만 포함 가능)
```json
{
  "title": "수정된 제목",
  "state": "published"
}
```

**Request Body Fields:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| title | string | X | 5-200자 |
| body | string | X | 10-5000자 |
| state | string | X | `draft`, `published`, `archived` |

**Notice State Transitions:**

모든 상태 간 전환이 허용된다. `archived` -> `published` 전환도 지원한다.

- `draft` -> `published`: 게시 (publishedAt 설정)
- `published` -> `archived`: 보관
- `archived` -> `published`: 재게시 (publishedAt 갱신)
- `published` -> `draft`: 게시 취소 (publishedAt 제거)
- 기타 조합도 PATCH로 전환 가능

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Notice updated",
  "data": {
    "noticeId": "ntc_01HQX...",
    "state": "published",
    "publishedAt": "2026-03-12T15:00:00Z"
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| noticeId | string | 공지 ID |
| state | string | 변경된 상태 |
| publishedAt | string | 게시 시각 (ISO 8601, published 상태일 때) |
| updatedAt | string | 수정 시각 (ISO 8601) |

---

#### POST /api/admin/notices/{noticeId}/attachments

**설명:** 공지 첨부파일 업로드

**인증:** 필요 (role=admin)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| noticeId | string | 공지 ID |

**Request Headers:**
```
Authorization: Bearer <JWT>
Content-Type: multipart/form-data
```

**Request Body:** (multipart/form-data)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| file | file | O | 업로드할 파일 |

**Success Response (201):**
```json
{
  "code": 100,
  "message": "Attachment uploaded",
  "data": {
    "attachmentId": "att_01HQX...",
    "fileName": "사업자등록증.pdf",
    "contentType": "application/pdf",
    "fileSize": 102400,
    "url": "/api/admin/notices/ntc_01/attachments/att_01HQX...",
    "createdAt": "2026-03-12T15:00:00Z"
  }
}
```

**Error Responses:**

| HTTP | code | 설명 |
|------|------|------|
| 404 | 4040 | 공지를 찾을 수 없음 |

---

#### DELETE /api/admin/notices/{noticeId}/attachments/{attachmentId}

**설명:** 공지 첨부파일 삭제

**인증:** 필요 (role=admin)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| noticeId | string | 공지 ID |
| attachmentId | string | 첨부파일 ID |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Attachment deleted",
  "data": {
    "attachmentId": "att_01HQX..."
  }
}
```

**Error Responses:**

| HTTP | code | 설명 |
|------|------|------|
| 404 | 4040 | 첨부파일을 찾을 수 없음 |

---

#### GET /api/admin/notices/{noticeId}/attachments/{attachmentId}/download

**설명:** 관리자 공지 첨부파일 다운로드

**인증:** 필요 (role=admin)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| noticeId | string | 공지 ID |
| attachmentId | string | 첨부파일 ID |

**Request Headers:**
```
Authorization: Bearer <JWT>
```

**Success Response (200):**

바이너리 파일 스트림 (`Content-Disposition: attachment; filename="..."`)

**Error Responses:**

| HTTP | code | 설명 |
|------|------|------|
| 404 | 4040 | 첨부파일을 찾을 수 없음 |

---

### 4.3 관리자 통계

#### GET /api/admin/stats/summary

**설명:** 운영 통계 요약

**인증:** 필요 (role=admin)

**Request Headers:**
```
Authorization: Bearer <JWT>
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| fromDate | string | X | 조회 시작일 (YYYY-MM-DD) |
| toDate | string | X | 조회 종료일 (YYYY-MM-DD) |

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Success",
  "data": {
    "users": {
      "total": 150,
      "requesters": 80,
      "suppliers": 70
    },
    "suppliersByState": {
      "approved": 45,
      "submitted": 10,
      "under_review": 5,
      "hold": 3,
      "rejected": 4,
      "suspended": 3
    },
    "reviews": {
      "pending": 8,
      "avgReviewDays": 2.5
    },
    "requests": {
      "open": 25,
      "closed": 100
    },
    "period": {
      "from": "2026-03-01",
      "to": "2026-03-12"
    }
  }
}
```

**Success Response Fields:**

| 필드 | 타입 | 설명 |
|------|------|------|
| users | object | 사용자 통계 |
| users.total | integer | 전체 사용자 수 |
| users.requesters | integer | 요청자 수 |
| users.suppliers | integer | 공급자 수 |
| suppliersByState | object | 공급자 상태별 통계 |
| suppliersByState.approved | integer | 승인된 공급자 수 |
| suppliersByState.submitted | integer | 제출된 공급자 수 |
| suppliersByState.under_review | integer | 검수 중인 공급자 수 |
| suppliersByState.hold | integer | 보류 중인 공급자 수 |
| suppliersByState.rejected | integer | 반려된 공급자 수 |
| suppliersByState.suspended | integer | 정지된 공급자 수 |
| reviews | object | 검수 통계 |
| reviews.pending | integer | 대기 중인 검수 수 |
| reviews.avgReviewDays | number | 평균 검수 소요 일수 |
| requests | object | 의뢰 통계 |
| requests.open | integer | 진행 중인 의뢰 수 |
| requests.closed | integer | 종료된 의뢰 수 |
| period | object | 조회 기간 |
| period.from | string | 시작일 (YYYY-MM-DD) |
| period.to | string | 종료일 (YYYY-MM-DD) |

---

### 4.4 관리자 공급자 리뷰 모더레이션

요청자가 남긴 공급자 리뷰의 가시성 토글. 검수(Verification) 리뷰 큐인 `/api/admin/reviews/*` 와 분리하기 위해 `/api/admin/supplier-reviews/*` 경로를 사용한다. 동작은 멱등 (이미 같은 상태면 변경 없이 현재값 반환).

#### POST /api/admin/supplier-reviews/{reviewId}/hide

**설명:** 리뷰를 숨김 처리. `hidden=true` 인 리뷰는 공개 목록과 `ratingAvg` 집계에서 제외된다.

**인증:** 필요 (role=admin)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| reviewId | string | 리뷰 ID |

**Request Body:** 없음

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Review hidden",
  "data": {
    "reviewId": "rev_01HQX...",
    "hidden": true,
    "updatedAt": "2026-04-20T14:00:00Z"
  }
}
```

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 404 | 4041 | 리뷰 없음 |

---

#### POST /api/admin/supplier-reviews/{reviewId}/unhide

**설명:** 숨김 해제. 멱등.

**인증:** 필요 (role=admin)

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| reviewId | string | 리뷰 ID |

**Request Body:** 없음

**Success Response (200):**
```json
{
  "code": 100,
  "message": "Review unhidden",
  "data": {
    "reviewId": "rev_01HQX...",
    "hidden": false,
    "updatedAt": "2026-04-20T14:05:00Z"
  }
}
```

**Error Responses:**

| HTTP | code | 상황 |
|------|------|------|
| 404 | 4041 | 리뷰 없음 |

---

## 5. Error Code Reference

### 5.1 Common Error Codes (4xxx)

| 코드 | 의미 | 사용 상황 |
|------|------|-----------|
| 4001 | Validation failed | 요청 데이터 형식/값 오류 |
| 4002 | Invalid file | 파일 형식/크기 위반 |
| 4003 | Thread already exists | 스레드 중복 생성 시도 |
| 4004 | Empty message | body와 attachment 둘 다 없음 |
| 4011 | Invalid credentials | 로그인 실패 |
| 4031 | Review update forbidden | 리뷰 본인 아님 / 7일 경과 / hidden 상태 |
| 4032 | Cannot modify approved profile | approved 상태 수정 시도 |
| 4033 | Cannot modify approved supplier | approved 공급자 수정 시도 |
| 4034 | Business approval required | 요청자 사업자 승인 필요 |
| 4035 | Not owner or wrong state | 의뢰 수정 권한/상태 위반 |
| 4036 | Review eligibility failed | 리뷰 작성 자격 미달 (request 미종료 / 비소유자 / selected quote 없음) |
| 4037 | Quote permission denied | 견적 제출 권한 없음 |
| 4038 | Cannot modify quote state | 견적 상태로 인한 수정 불가 |
| 4039 | Thread access denied | 스레드 비참여자 접근 |
| 4041 | Resource not found | 리소스 없음 |
| 4091 | Duplicate email | 이미 존재하는 이메일 |
| 4092 | Profile exists | 이미 존재하는 프로필 |
| 4093 | Active submission exists | 이미 검수 중인 제출 |
| 4094 | Review already exists | 같은 (request, supplier) 쌍에 리뷰 중복 |
| 4095 | Active quote exists | 같은 의뢰에 active 견적 존재 |
| 4096 | Already requested/approved | 연락처 공유 이미 요청/승인됨 |
| 4099 | Cannot revoke after approval | mutually_approved 후 철회 시도 |
| 4221 | Invalid field modification | 허용되지 않은 필드 수정 |
| 4222 | Review content violation | 금칙어 포함 등 모더레이션 위반 |
| 4223 | Non-patchable field | 수정 불가 필드 포함 |

### 5.2 System Error Codes (5xxx)

| 코드 | 의미 |
|------|------|
| 5001 | Internal server error |
| 5002 | Database error |
| 5003 | External service error |

---

## 6. Data Type Reference

### 6.1 Enums

| Enum | 값 목록 |
|------|---------|
| User Role | `requester`, `supplier`, `admin` |
| Requester Approval State | `not_submitted`, `submitted`, `approved`, `rejected` |
| Supplier Verification State | `draft`, `submitted`, `under_review`, `approved`, `hold`, `rejected`, `suspended` |
| Supplier Exposure State | `hidden`, `visible` |
| Request State | `draft`, `open`, `closed`, `cancelled` |
| Request Mode | `public`, `targeted` |
| Quote State | `submitted`, `selected`, `withdrawn`, `declined` |
| Contact Share State | `not_requested`, `requested`, `one_side_approved`, `mutually_approved`, `revoked` |
| Notice State | `draft`, `published`, `archived` |

### 6.2 Common Field Constraints

| 필드 | 타입 | 제약 |
|------|------|------|
| ID | string | 서버 생성 opaque identifier, 형식은 클라이언트가 의존하지 않음 |
| email | string | RFC 5322 기본 형식 |
| phone | string | 한국 전화번호 형식 |
| timestamp | string | ISO 8601 (YYYY-MM-DDTHH:mm:ssZ) |
| price | string | 숫자 문자열, 양수 |
| quantity | string | 숫자 문자열, 양수 |
| date | string | YYYY-MM-DD 형식 |

---

## 7. Document History

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2026-03-12 | Phase 1 상세 API 계약 정의 |
| 1.1 | 2026-03-12 | Field-schema-level consistency 적용 |
| 1.2 | 2026-03-16 | Terminology consistency pass: ID rule clarity, state/action naming alignment, typo fix (server-side validation wording) |
| 1.3 | 2026-04-02 | Public notice attachment: fileSize 필드 추가, 다운로드 엔드포인트 추가. Admin notice attachment download 엔드포인트 추가. Notice 상태 전이 규칙 명시 (archived -> published 포함). |
| 1.4 | 2026-04-16 | 타입 일관성 패스: desiredVolume, targetPriceRange.min/max를 string으로 변경. 견적 필드(unitPriceEstimate, moq, leadTime, sampleCost)를 string으로 변경. 공급자 프로필 monthlyCapacity, moq를 string으로 변경. POST /api/admin/auth/login 엔드포인트 추가. Data Type Reference price/quantity 타입 string으로 변경. |
| 1.5 | 2026-04-17 | 코드-문서 audit 보강: GET /api/suppliers/categories, /api/suppliers/regions, POST /api/requests/{id}/publish, GET /api/supplier/requests, GET /api/supplier/requests/{id}, GET /api/supplier/quotes 신규 섹션 추가. 3.10 첨부파일 섹션 추가 (POST /api/attachments). GET /api/suppliers/{id} 응답에 logoUrl 명시. |
| 1.6 | 2026-04-20 | Phase 2 Task 06 계약 선반영: §3.11 Review API (POST/PATCH/eligibility/list), §4.4 admin 공급자 리뷰 모더레이션 (hide/unhide) 신규. §5.1 코드 재의미 부여: 4031=Review update forbidden, 4036=Review eligibility failed, 4094=Review already exists, 4222=Review content violation (Phase 1 draft 예약 의미는 실제 구현 없어 폐기). admin 모더레이션은 기존 `/api/admin/reviews/*` (검수 큐) 와 분리하기 위해 `/api/admin/supplier-reviews/*` 경로 사용. |
| 1.7 | 2026-04-20 | v1.6 자체 검증 후 수정: (1) POST /api/reviews body 의 `supplierProfileId` 를 `supplierId` 로 변경 (외부 명칭 일관성, 기존 `/api/suppliers/{supplierId}` 경로와 동일). (2) GET /api/suppliers/{supplierId}/reviews 페이지네이션이 §2.7 규약을 어기고 있어 1-based / max size 100 / sort·order 분리 형태로 정정. Pre-existing drift (§5.1 4001/4002/4003) 는 DOC-2 open-item 으로 분리. |

---

## 8. Out of Scope

- WebSocket / 실시간 계약
- 이벤트 버스 payload 상세
- OpenAPI YAML/JSON 명세
- SDK/client library 생성 규칙
