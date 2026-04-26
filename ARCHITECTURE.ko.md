# FSM 아키텍처 개요 (ARCHITECTURE)

> **Food Supply Matching System** — 식품 OEM/ODM 의뢰-견적 매칭 플랫폼.
> 요청자(buyer)와 공급자(supplier)를 연결하고, 관리자가 검수·공지·모더레이션을 담당하는 B2B 트랜잭션 서비스.

**작성 기준일**: 2026-04-24
**주요 기점**: 2026-04-24 Phase 3 Task A (CQRS 롤백) 완료 — MongoDB 완전 제거, 단일 MariaDB R2DBC 아키텍처 확정.

---

## 목차

1. [리포지토리 최상위 구조](#1-리포지토리-최상위-구조)
2. [백엔드 모듈 구조 (Kotlin / Gradle)](#2-백엔드-모듈-구조-kotlin--gradle)
3. [백엔드 런타임 흐름](#3-백엔드-런타임-흐름)
4. [데이터베이스 (MariaDB) 스키마](#4-데이터베이스-mariadb-스키마)
5. [프론트엔드 구조](#5-프론트엔드-구조)
6. [인프라 / 로컬 실행](#6-인프라--로컬-실행)
7. [API 엔드포인트 카탈로그](#7-api-엔드포인트-카탈로그)
8. [프론트 라우트 흐름](#8-프론트-라우트-흐름)
9. [도메인별 유저 저니](#9-도메인별-유저-저니)
10. [보조 문서 인덱스](#10-보조-문서-인덱스)

---

## 1. 리포지토리 최상위 구조

```
food-supply-matching-system/
├── backend/                 Kotlin/Gradle 멀티모듈 (API 서버 + Admin 서버 + 7 도메인 모듈 + shared-core)
├── frontend/                Yarn 4.5 workspace (main-site + admin-site + 4 packages)
├── docs/                    설계/테스트/리팩토링 가이드 (한글)
├── .sisyphus/               세션 핸드오프, 계획서, 진행 기록
├── .github/workflows/       CI/CD — backend-ci.yml (MariaDB 단일 service)
├── local-storage/           로컬 파일 업로드 저장소 (LocalFileStorageService 타겟)
├── LOCAL-RUN-GUIDE.ko.md    로컬 기동 가이드
├── EXTERNAL-ACCESS-GUIDE.ko.md  외부 접속 (공유기 포워딩) 가이드
├── README.md                프로젝트 개요
└── ARCHITECTURE.ko.md       (본 문서)
```

### 루트 주요 문서

| 파일 | 역할 |
|------|------|
| `LOCAL-RUN-GUIDE.ko.md` | 로컬 실행: Docker compose → 시드 → bootRun → yarn dev. MariaDB 단일 DB 기준. |
| `EXTERNAL-ACCESS-GUIDE.ko.md` | 외부 네트워크에서 로컬 서버 접근 (공유기 포트 포워딩, UPnP 한계) |
| `README.md` | 프로젝트 개요, 빠른 링크 |
| `docs/REFACTORING-GUIDELINES.ko.md` | 코드 품질/SSOT/계약 우선/§8 실제 적용 사례 10건 |
| `docs/TEST-GUIDE.md` | 단위/통합/E2E 테스트 전략 |
| `.sisyphus/drafts/api-spec.md` | API 계약의 SSOT (v1.10) |

---

## 2. 백엔드 모듈 구조 (Kotlin / Gradle)

**스택**: Spring Boot 4.0.2 · Spring WebFlux (Reactive) · Kotlin 2.x · Java 21 · R2DBC · MariaDB 11.4

### 2.1 모듈 일람 (`settings.gradle.kts`)

```
:shared-core                 공통 보안/인증/에러/응답/파일 저장소
:api-server                  고객 대상 API (포트 8080)
:admin-server                관리자 API (포트 8081)
:command-domain-user         사용자 계정, 요청자 사업자 프로필
:command-domain-supplier     공급자 프로필, 인증서, 검수 제출, 감사 로그, 첨부 메타
:command-domain-request      의뢰(Request), targeted supplier 링크
:command-domain-quote        견적
:command-domain-thread       메시지 스레드, 메시지, 읽음 상태
:command-domain-notice       공지사항
:command-domain-review       공급자 리뷰
```

총 10개 모듈. **모든 데이터는 MariaDB 단일 저장소**. `query-model-*` / `projection/` 은 Phase 3 Task A 에서 전부 삭제됨.

### 2.2 의존성 그래프

```
api-server, admin-server
      │
      ├─→ shared-core
      └─→ command-domain-{user, supplier, request, quote, thread, notice, review}
                           │
                           └─→ shared-core
```

`api-server` / `admin-server` 모두 `@EnableR2dbcRepositories(basePackages = ["dev.riss.fsm.command"])` 를 선언 → 각 command-domain-* 의 Repository 인터페이스가 자동 등록됨.

### 2.3 shared-core 공통 컴포넌트

위치: `backend/shared-core/src/main/kotlin/dev/riss/fsm/shared/`

| 하위 패키지 | 대표 클래스 | 역할 |
|------------|------------|------|
| `auth` | `UserRole` (REQUESTER / SUPPLIER / ADMIN) | 역할 enum |
| `security` | `JwtTokenProvider`, `JwtAuthenticationWebFilter`, `AuthenticatedUserPrincipal`, `JwtProperties` | JWT 발급/검증, WebFlux 인증 필터, 현재 사용자 주입 |
| `api` | `ApiSuccessResponse<T>`, `ApiErrorResponse`, `PaginationMeta` | 표준 응답 포맷 (`code=100` 성공, 4자리 에러 코드) |
| `error` | `GlobalApiExceptionHandler`, 도메인별 Exception (e.g. `RequestNotFoundException`, `ReviewNotFoundException`, `ThreadAccessDeniedException`) | 전역 예외 처리, domain → HTTP 상태 매핑 |
| `file` | `FileStorageService` (interface), `StorageProperties`, `AttachmentMetadata` | 파일 업로드 추상화 (구현은 `LocalFileStorageService` @ api-server) |
| `moderation` | `ProfanityFilter` | 텍스트 욕설 필터 (리뷰/메시지) |

### 2.4 api-server (고객 API, :8080)

진입점: `backend/api-server/src/main/kotlin/dev/riss/fsm/api/ApiServerApplication.kt`

**Controllers** (14개):

| 컨트롤러 | URL 프리픽스 | 담당 도메인 |
|---------|-------------|------------|
| `ApiBootstrapController` | `/api/bootstrap/*` | 헬스/bootstrap marker |
| `ApiSwaggerUiController` | `/swagger-ui.html` | Swagger UI redirect |
| `AuthController` | `/api/auth/*` | 회원가입, 로그인 |
| `RequesterBusinessProfileController` | `/api/requester/business-profile` | 요청자 사업자 정보 |
| `SupplierProfileController` | `/api/supplier/profile`, `/api/supplier/verification-submissions` | 공급자 자신의 프로필/검수 제출 |
| `SupplierDiscoveryController` | `/api/suppliers/*` | 공급자 공개 탐색 (list/detail/categories/regions) |
| `AttachmentController` | `/api/attachments` | 파일 업로드 |
| `RequestController` | `/api/requests/*` | 의뢰 CRUD (requester) |
| `SupplierRequestController` | `/api/supplier/requests/*` | 공급자 입장의 의뢰 피드 |
| `QuoteController` | `/api/requests/{id}/quotes`, `/api/quotes/{id}/*` | 견적 제출/수정/상태 변경 |
| `SupplierQuoteController` | `/api/supplier/quotes` | 공급자 본인 견적 리스트 |
| `ThreadController` | `/api/threads/*`, `/api/requests/{id}/threads` | 메시지 스레드, 메시지, 연락처 공유 |
| `ReviewController` | `/api/requester/requests/{id}/reviews`, `/api/reviews/{id}` | 리뷰 작성/수정 (requester) |
| `SupplierReviewsController` | `/api/suppliers/{id}/reviews` | 공급자별 공개 리뷰 목록 |
| `PublicNoticeController` | `/api/notices` | 공지사항 공개 조회 |

**주요 QueryService** (R2DBC 기반 조회 전담):
- `SupplierQueryService` (Stage 2)
- `RequestQueryService`, `SupplierRequestService` (Stage 3)
- `QuoteQueryService` (Stage 4)
- `UserMeService` (Stage 5)

### 2.5 admin-server (관리자 API, :8081)

진입점: `backend/admin-server/src/main/kotlin/dev/riss/fsm/admin/AdminServerApplication.kt`

**Controllers** (7개):

| 컨트롤러 | URL 프리픽스 | 담당 |
|---------|-------------|------|
| `AdminBootstrapController` | `/api/admin/bootstrap/*` | 헬스 |
| `AdminSwaggerUiController` | `/swagger-ui.html` | Swagger UI |
| `AdminAuthController` | `/api/admin/auth/*` | 관리자 로그인 (role=ADMIN) |
| `AdminReviewController` | `/api/admin/reviews/*` | 공급자 검수 큐: 제출 리스트 / 상세 / approve / hold / reject |
| `SupplierReviewModerationController` | `/api/admin/supplier-reviews/*` | 공급자 리뷰 모더레이션 (hide / unhide / list) |
| `AdminNoticeController` | `/api/admin/notices/*` | 공지 CRUD + publish/archive + 첨부 |
| `AdminStatsController` | `/api/admin/stats/*` | 통계 요약 |

**주요 QueryService**:
- `AdminReviewQueryService` (Stage 6, R2DBC)
- `AdminStatsApplicationService` (애초부터 R2DBC 기반)
- `SupplierReviewModerationQueryService`

### 2.6 command-domain-* 모듈들 (7개)

각 모듈은 `Entity(s) + Repository(R2DBC interface) + CommandService` 3-tier 구조.

| 모듈 | 주요 Entity | Repository | 핵심 CommandService |
|------|-----------|-----------|---------------------|
| command-domain-user | `UserAccountEntity`, `BusinessProfileEntity` | `UserAccountRepository`, `BusinessProfileRepository` | `AuthCommandService`, `RequesterBusinessProfileCommandService` |
| command-domain-supplier | `SupplierProfileEntity`, `VerificationSubmissionEntity`, `CertificationRecordEntity`, `AttachmentMetadataEntity`, `AuditLogEntity` | `SupplierRepositories` (5 인터페이스 통합) | `SupplierProfileCommandService` |
| command-domain-request | `RequestEntity`, `TargetedSupplierLinkEntity` | `RequestRepository`, `TargetedSupplierLinkRepository` | `RequestCommandService` |
| command-domain-quote | `QuoteEntity` | `QuoteRepository` | `QuoteCommandService` |
| command-domain-thread | `MessageThreadEntity`, `MessageEntity`, `ThreadParticipantReadStateEntity` | `MessageThreadRepository`, `MessageRepository`, `ThreadParticipantReadStateRepository` | `ThreadCommandService` |
| command-domain-notice | `NoticeEntity` | `NoticeRepository` | `NoticeCommandService` |
| command-domain-review | `ReviewEntity` | `ReviewRepository` | `ReviewCommandService` |

---

## 3. 백엔드 런타임 흐름

### 3.1 요청 처리 파이프라인

```
HTTP Request (WebFlux Netty)
   │
   ▼
JwtAuthenticationWebFilter  ─ Authorization 헤더 파싱 → AuthenticatedUserPrincipal 주입
   │
   ▼
SecurityWebFilterChain       ─ 경로별 인증/권한 체크 (@PreAuthorize, role check)
   │
   ▼
Controller                   ─ 요청 DTO 검증 (@Valid), 응답 매핑
   │
   ▼
ApplicationService           ─ 트랜잭션 경계, 도메인 조합, 권한 세부 검증
   │
   ├─→ CommandService        ─ Entity 생성/변경 (도메인 로직)
   │
   └─→ QueryService          ─ R2DBC DatabaseClient 로 직접 SQL (복잡 join/집계)
   │
   ▼
Repository (R2DBC)           ─ MariaDB 비동기 쿼리 (Mono/Flux)
   │
   ▼
Mono<ApiSuccessResponse<T>>  ─ code=100, data, meta 직렬화 → HTTP 200
```

### 3.2 인증

- **알고리즘**: HS256 (JJWT lib)
- **Claims**: `sub` (userId), `email`, `role`, `tokenType` (access / refresh)
- **TTL**: access 1시간 기본 (설정: `SECURITY_JWT_ACCESS_TOKEN_TTL`)
- **클라이언트**: `Authorization: Bearer <token>` 헤더
- **실패 처리**: 만료/위조 → `401 Unauthorized`; 권한 부족 → `403 Forbidden`

### 3.3 조회 전략

- **간단 조회** (단일 엔티티, 단일 필드): 기존 `Repository.findById` / 파생 메서드
- **복잡 조회** (다중 테이블 JOIN, 서브쿼리, 동적 필터): `DatabaseClient` + raw SQL
  - 예: `SupplierQueryService.listApproved` — `FIND_IN_SET` (CSV 카테고리) + 서브쿼리 logo + LEFT JOIN review 집계
  - 예: `RequestQueryService.listByRequester` — `COALESCE (SELECT COUNT(*) FROM quote ...)` 로 quoteCount
- **집계 @Query**: `ReviewRepository.aggregateRatingBySupplier` — avg/count 한 번에

### 3.4 파일 저장

- 인터페이스: `FileStorageService` (shared-core)
- 구현: `LocalFileStorageService` @ api-server → `local-storage/` 디렉토리에 UUID 기반 경로로 저장
- 메타: `attachment_metadata` 테이블 (`owner_type`, `owner_id`, `attachment_kind`, `file_name`, `content_type`, `file_size`, `storage_key`)
- 스레드 첨부는 별도 owner_type="thread", 공급자 검수는 owner_type="supplier-verification" 등으로 구분

---

## 4. 데이터베이스 (MariaDB) 스키마

**스키마명**: `fsm_command`
**초기화 SQL**: `backend/docker/mariadb/init/01-schema.sql`
**시드**: `backend/docker/mariadb/init/02-mock-data.sql`

### 4.1 테이블 일람 (15개 + marker)

| 테이블 | 핵심 컬럼 | 주요 인덱스 |
|--------|----------|------------|
| `user_account` | id (PK), email (UK), password_hash, role, created_at | — |
| `business_profile` | id (PK), user_account_id (UK, FK), business_name, approval_state, submitted_at, approved_at, rejected_at, contact_*, verification_scope | — |
| `supplier_profile` | id (PK), supplier_user_id (UK), company_name, region, categories (TEXT, CSV), equipment_summary, monthly_capacity, moq, oem_available, odm_available, raw_material_support, packaging_labeling_support, introduction, verification_state, exposure_state | `idx_supplier_state(verification_state, exposure_state)` |
| `certification_record` | id (PK), supplier_profile_id, type, number, file_attachment_id, status | `idx_cert_supplier(supplier_profile_id)` |
| `verification_submission` | id (PK), supplier_profile_id, state, submitted_at, reviewed_at, reviewed_by, review_note_internal, review_note_public | — |
| `request_record` | id (PK), requester_user_id, mode (public/targeted), title, category, desired_volume, target_price_min/max, certification_requirement, raw_material_rule, packaging_requirement, delivery_requirement, notes, state (draft/open/closed/cancelled) | `idx_request_state_mode`, `idx_request_requester` |
| `targeted_supplier_link` | id (PK), request_id (FK), supplier_profile_id (FK), UNIQUE(request_id, supplier_profile_id) | `idx_targeted_supplier(supplier_profile_id)` |
| `quote` | id (PK), request_id (FK), supplier_profile_id (FK), unit_price_estimate, moq, lead_time, sample_cost, note, state (submitted/selected/declined/withdrawn), version | `idx_quote_request`, `idx_quote_supplier`, UNIQUE(request_id, supplier_profile_id, state) |
| `message_thread` | id (PK), request_id (FK), requester_user_id, supplier_profile_id, quote_id (FK), contact_share_state (not_requested / one_side_approved / mutually_approved), contact_share_* timestamps | `idx_thread_requester`, `idx_thread_supplier`, `idx_thread_message_quote`, UNIQUE(request_id, requester_user_id, supplier_profile_id) |
| `thread_message` | id (PK), thread_id (FK), sender_user_id, body (TEXT), attachment_ids (TEXT, CSV) | `idx_thread_message_thread(thread_id, created_at)` |
| `thread_participant_read_state` | id (PK), thread_id, user_id, last_read_at, UNIQUE(thread_id, user_id) | — |
| `review` | id (PK), requester_user_id, supplier_profile_id (FK), request_id (FK), quote_id (FK), rating TINYINT (1..5), text, hidden BOOL, version | `idx_review_supplier`, UNIQUE(request_id, supplier_profile_id), CHECK(rating BETWEEN 1 AND 5) |
| `attachment_metadata` | id (PK), owner_type, owner_id, attachment_kind, file_name, content_type, file_size, storage_key | `idx_attachment_owner(owner_type, owner_id)` |
| `notice` | id (PK), title, body (TEXT), state (draft/published/archived), author_id, published_at, view_count | — |
| `audit_log` | id (PK), actor_user_id, action_type, target_type, target_id, payload_snapshot (TEXT JSON) | — |

### 4.2 상태 도메인 (canonical values)

- `supplier_profile.verification_state`: `draft` / `submitted` / `approved` / `hold` / `rejected`
- `supplier_profile.exposure_state`: `hidden` / `visible` (Stage 2 에서 seed 드리프트 `'listed'` 교정)
- `request_record.mode`: `public` / `targeted`
- `request_record.state`: `draft` / `open` / `closed` / `cancelled`
- `quote.state`: `submitted` / `selected` / `declined` / `withdrawn`
- `message_thread.contact_share_state`: `not_requested` / `one_side_approved` / `mutually_approved` / `revoked`
- `verification_submission.state`: `submitted` / `approved` / `hold` / `rejected`
- `notice.state`: `draft` / `published` / `archived`
- `business_profile.approval_state`: `not_submitted` / `submitted` / `approved` / `rejected`

---

## 5. 프론트엔드 구조

### 5.1 모노레포 구성 (`frontend/`)

**패키지 매니저**: Yarn 4.5 workspace
**빌드 도구**: Vite 5.0.8
**언어**: TypeScript 5.2

```
frontend/
├── apps/
│   ├── main-site/     (요청자/공급자 대상, :5173)
│   └── admin-site/    (관리자 대상, :5174)
└── packages/
    ├── config/        공유 설정, API endpoint enum
    ├── types/         API DTO / 도메인 타입
    ├── ui/            공유 UI 컴포넌트
    └── utils/         포매팅, API client, 검증
```

### 5.2 main-site

**위치**: `frontend/apps/main-site`
**주요 기술**: React 18 · React Router 6 · React Query 5 (@tanstack/react-query) · Zustand 5 · Axios · i18next · Emotion · Tailwind CSS · Lottie

**Features** (11개, `src/features/`):
- `auth` — 로그인, 회원가입, 인증 가드 (Zustand store)
- `business-profile` — 요청자 사업자 정보 submit/조회/수정
- `discovery` — 공급자 탐색, 상세, 카테고리/지역 필터
- `supplier-profile` — 공급자 자신의 프로필 작성/검수 제출
- `request-management` — 의뢰 리스트/생성/상세 (요청자)
- `supplier-requests` — 공급자 입장의 의뢰 피드
- `quotes` — 요청자 관점 견적 비교
- `supplier-quotes` — 공급자 관점 견적 관리
- `threads` — 메시지 스레드, 채팅, 읽음 상태, 연락처 공유
- `reviews` — 리뷰 작성/별점 UI
- `notices` — 공지사항 목록/상세 (공개)

**E2E**: Playwright (main-site 전용)

### 5.3 admin-site

**위치**: `frontend/apps/admin-site`
**기술**: main-site 와 동일 (React + React Query + Zustand + i18n), Playwright 없음

**Features** (6개):
- `auth` — 관리자 로그인
- `reviews` — 공급자 검수 큐 (승인/보류/반려)
- `supplier-reviews` — 공급자 리뷰 모더레이션 (hide/unhide)
- `notices` — 공지 CRUD, 발행, 첨부 관리
- `stats` — 대시보드 통계
- `members` — 멤버 관리 (부분 구현)

### 5.4 공유 패키지

| 패키지 | 내용 |
|--------|------|
| `packages/types` | API 응답 DTO 타입 (api-spec.md 와 1:1), 도메인 모델, Role enum |
| `packages/utils` | Axios 기반 API client (interceptor: JWT 주입, 에러 code 매핑), 가격/날짜 포매터, zod 스키마 |
| `packages/ui` | 공통 컴포넌트 (button, modal, AsyncBoundary 등) |
| `packages/config` | API base URL, endpoint path enum (SSOT) |

### 5.5 상태 관리 규약

- **서버 상태**: React Query (queryKey factory 패턴, feature 별로 분리 — `docs/REFACTORING-GUIDELINES.ko.md §2.5` 참고)
- **클라이언트 상태**: Zustand (auth-store, UI preferences)
- **비동기 UI 공통 패턴**: AsyncBoundary (`packages/ui` 후보) — loading/error/empty 처리

---

## 6. 인프라 / 로컬 실행

### 6.1 Compose 파일

**유일한 파일**: `backend/compose.local.mariadb.yml`

```yaml
services:
  mariadb:
    image: mariadb:11.4
    ports: [ "13306:3306" ]
    environment:
      MARIADB_ROOT_PASSWORD: root
      MARIADB_DATABASE: fsm_command
      MARIADB_USER: fsm
      MARIADB_PASSWORD: fsm
    volumes:
      - ./docker/mariadb/init:/docker-entrypoint-initdb.d
      - backend_mariadb-data:/var/lib/mysql
```

> **MongoDB 관련 파일은 전부 삭제됨** (2026-04-24, Phase 3 Task A Stage 8). `compose.local.mongodb.yml`, `docker/mongodb/`, `scripts/local/*mongodb.sh` 는 더 이상 존재하지 않는다.

### 6.2 시드 스크립트 (`backend/scripts/local/`)

| 스크립트 | 역할 |
|---------|------|
| `init-mariadb.sh` | `01-schema.sql` 적용 (CREATE TABLE) |
| `seed-mariadb.sh` | `02-mock-data.sql` 적용 (테스트 계정/공급자/의뢰/견적 seed) |
| `seed-all.sh` | MariaDB seed 래핑 (현재 MariaDB 만) |

### 6.3 CI/CD (`.github/workflows/`)

**backend-ci.yml**:
- trigger: `push` / `pull_request` 중 `backend/**` 변경
- services: `mariadb:11.4` (13306 노출)
- steps: 스키마/시드 적용 → `./gradlew build` (test 포함) → 실패 시 test report 업로드
- **MongoDB service container 없음** (Stage 8 에서 제거)

### 6.4 로컬 기동 (4 터미널)

```bash
# ── 터미널 A: DB + 시드
cd backend
docker volume create backend_mariadb-data
docker compose -f compose.local.mariadb.yml up -d
./scripts/local/init-mariadb.sh
./scripts/local/seed-mariadb.sh

# ── 터미널 B: API 서버 (포트 8080)
cd backend
./gradlew :api-server:bootRun --args='--spring.profiles.active=local'

# ── 터미널 C: Admin 서버 (포트 8081)
cd backend
./gradlew :admin-server:bootRun --args='--spring.profiles.active=local'

# ── 터미널 D: 프론트 (main :5173 + admin :5174)
cd frontend
yarn install      # 최초 1회
yarn dev:main-site   # 또는
yarn dev:admin-site
```

### 6.5 포트 분포

| 역할 | 포트 | 비고 |
|------|------|------|
| MariaDB | 13306 (로컬) / 3306 (컨테이너 내부) | docker compose |
| API 서버 | 8080 | `/swagger-ui.html`, `/actuator/health` |
| Admin 서버 | 8081 | 동일 |
| main-site | 5173 | Vite dev server |
| admin-site | 5174 | Vite dev server (자동 할당) |

### 6.6 테스트 계정 (seed 기준)

비밀번호는 모두 `Test1234!`.

| Email | Role | 용도 |
|-------|------|------|
| `admin@test.com` | ADMIN | 관리자 |
| `buyer@test.com` | REQUESTER | 요청자 (`usr_seed_buyer01`, 사업자 승인 완료) |
| `supplier@test.com` | SUPPLIER | 공급자 (`sprof_seed_01`, approved+visible) |
| `buyer2@test.com` ~ `buyer4@test.com` | REQUESTER | 추가 요청자 |
| `supplier2@test.com` ~ `supplier8@test.com` | SUPPLIER | 다양한 상태의 공급자 (draft/submitted/hold/rejected 등) |

---

## 7. API 엔드포인트 카탈로그

**SSOT**: `.sisyphus/drafts/api-spec.md` (v1.10). 아래는 현재 반영된 경로 요약.

### 7.1 api-server (:8080)

#### Auth & Me

| 메서드 | 경로 | 권한 | 설명 |
|--------|------|------|------|
| POST | `/api/auth/signup` | — | 회원가입 (role: requester/supplier) |
| POST | `/api/auth/login` | — | 로그인 → accessToken 발급 |
| GET | `/api/me` | 인증 | 현재 사용자 (userId, email, role, businessApprovalState) |

#### 요청자 사업자 정보

| 메서드 | 경로 | 권한 | 설명 |
|--------|------|------|------|
| POST | `/api/requester/business-profile` | requester | 사업자 정보 최초 제출 |
| GET | `/api/requester/business-profile` | requester | 내 사업자 정보 조회 |
| PATCH | `/api/requester/business-profile` | requester | 수정 (submitted/rejected 상태에서만) |

#### 공급자 (본인)

| 메서드 | 경로 | 권한 | 설명 |
|--------|------|------|------|
| POST | `/api/supplier/profile` | supplier | 공급자 프로필 생성 |
| GET | `/api/supplier/profile` | supplier | 내 프로필 조회 |
| PATCH | `/api/supplier/profile` | supplier | 프로필 수정 |
| POST | `/api/supplier/verification-submissions` | supplier | 검수 서류 제출 (multipart) |
| GET | `/api/supplier/verification-submissions/latest` | supplier | 최신 검수 상태 |

#### 공급자 탐색 (공개)

| 메서드 | 경로 | 권한 | 설명 |
|--------|------|------|------|
| GET | `/api/suppliers` | — | 공급자 목록 (keyword/category/region/oem/odm/minCapacity/maxMoq/sort/order 필터) |
| GET | `/api/suppliers/{supplierId}` | — | 공급자 상세 + 최근 리뷰 3건 |
| GET | `/api/suppliers/categories` | — | 카테고리별 카운트 |
| GET | `/api/suppliers/regions` | — | 지역별 카운트 |
| GET | `/api/suppliers/{supplierId}/reviews` | — | 공급자 리뷰 공개 목록 (hidden 제외) |

#### 의뢰 (요청자)

| 메서드 | 경로 | 권한 | 설명 |
|--------|------|------|------|
| POST | `/api/requests` | requester + approved | 의뢰 생성 (mode=public/targeted) |
| GET | `/api/requests` | requester | 내 의뢰 리스트 (state 필터) |
| GET | `/api/requests/{requestId}` | 접근권한* | 의뢰 상세 (RequestAccessGuard) |
| PATCH | `/api/requests/{requestId}` | owner | 의뢰 수정 |
| POST | `/api/requests/{requestId}/publish` | owner | 발행 (draft → open) |
| POST | `/api/requests/{requestId}/close` | owner | 마감 (open → closed) |
| POST | `/api/requests/{requestId}/cancel` | owner | 취소 |

*접근권한: owner(requester) 또는 public-open 의뢰의 approved supplier, 또는 targeted 의뢰의 지정 supplier

#### 공급자 피드

| 메서드 | 경로 | 권한 | 설명 |
|--------|------|------|------|
| GET | `/api/supplier/requests` | supplier | 피드 (공개 open + 내가 targeted) + hasQuoted |
| GET | `/api/supplier/requests/{requestId}` | supplier | 피드 상세 |

#### 견적

| 메서드 | 경로 | 권한 | 설명 |
|--------|------|------|------|
| POST | `/api/requests/{requestId}/quotes` | supplier | 견적 제출 (자동 thread 생성) |
| GET | `/api/requests/{requestId}/quotes` | owner | 의뢰의 견적 비교 (sort: unitPriceEstimate/moq/leadTime/submittedAt) |
| PATCH | `/api/quotes/{quoteId}` | supplier owner | 견적 수정 (submitted 상태) |
| POST | `/api/quotes/{quoteId}/withdraw` | supplier owner | 철회 |
| POST | `/api/quotes/{quoteId}/select` | requester owner | 선택 (자동으로 request 마감) |
| POST | `/api/quotes/{quoteId}/decline` | supplier | 거절 |
| GET | `/api/supplier/quotes` | supplier | 내 제출 견적 리스트 |

#### 메시지 스레드

| 메서드 | 경로 | 권한 | 설명 |
|--------|------|------|------|
| GET | `/api/threads` | 인증 | 내가 참여 중인 스레드 리스트 (lastMessage + unreadCount) |
| GET | `/api/threads/{threadId}` | 참여자 | 스레드 상세 + 메시지 페이지 + sharedContact |
| POST | `/api/requests/{requestId}/threads` | requester | 스레드 수동 생성 |
| POST | `/api/threads/{threadId}/messages` | 참여자 | 메시지 발송 (body + attachmentIds) |
| POST | `/api/threads/{threadId}/read` | 참여자 | 읽음 처리 |
| POST | `/api/threads/{threadId}/contact-share/request` | 참여자 | 연락처 공유 요청 |
| POST | `/api/threads/{threadId}/contact-share/approve` | 참여자 | 상대 요청 승인 (→ mutually_approved 시 연락처 노출) |
| POST | `/api/threads/{threadId}/contact-share/revoke` | 참여자 | 요청 철회 |
| POST | `/api/threads/{threadId}/attachments` | 참여자 | 스레드 첨부 업로드 |
| GET | `/api/threads/{threadId}/attachments/{attachmentId}` | 참여자 | 첨부 다운로드 |

#### 리뷰

| 메서드 | 경로 | 권한 | 설명 |
|--------|------|------|------|
| POST | `/api/requester/requests/{requestId}/reviews` | requester owner + selected quote | 리뷰 작성 (rating 1~5, text) |
| PATCH | `/api/reviews/{reviewId}` | author | 리뷰 수정 |
| GET | `/api/reviews/eligibility?requestId=&supplierId=` | requester | 리뷰 작성 가능 여부 체크 |

#### 파일 업로드

| 메서드 | 경로 | 권한 | 설명 |
|--------|------|------|------|
| POST | `/api/attachments` | 인증 | 범용 파일 업로드 (owner_type 파라미터) |

#### 공지사항 (공개)

| 메서드 | 경로 | 권한 | 설명 |
|--------|------|------|------|
| GET | `/api/notices` | — | 발행된 공지 목록 |
| GET | `/api/notices/{noticeId}` | — | 공지 상세 + viewCount 증가 |

### 7.2 admin-server (:8081)

#### Auth

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/admin/auth/login` | 관리자 로그인 (role=ADMIN) |

#### 공급자 검수

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/admin/reviews` | 검수 큐 (state/날짜 필터, 정렬: submittedAt/pendingDays/state/companyName) |
| GET | `/api/admin/reviews/{reviewId}` | 검수 상세 (files + reviewHistory) |
| POST | `/api/admin/reviews/{reviewId}/approve` | 승인 → supplier_profile.verification_state=approved, exposure_state=visible |
| POST | `/api/admin/reviews/{reviewId}/hold` | 보류 (notePublic 필수) |
| POST | `/api/admin/reviews/{reviewId}/reject` | 반려 (notePublic 필수) |

#### 공급자 리뷰 모더레이션

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/admin/supplier-reviews` | 리뷰 리스트 (hidden / supplierId 필터) |
| POST | `/api/admin/supplier-reviews/{reviewId}/hide` | 리뷰 숨김 |
| POST | `/api/admin/supplier-reviews/{reviewId}/unhide` | 리뷰 다시 노출 |

#### 공지사항 관리

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/admin/notices` | 전체 공지 (state 필터) |
| POST | `/api/admin/notices` | 공지 작성 (draft) |
| GET | `/api/admin/notices/{noticeId}` | 상세 |
| PATCH | `/api/admin/notices/{noticeId}` | 수정 |
| POST | `/api/admin/notices/{noticeId}/publish` | 발행 |
| POST | `/api/admin/notices/{noticeId}/archive` | 보관 |
| POST | `/api/admin/notices/{noticeId}/attachments` | 첨부 업로드 |
| DELETE | `/api/admin/notices/{noticeId}/attachments/{attachmentId}` | 첨부 삭제 |

#### 통계

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/admin/stats/summary` | 대시보드 집계 (users / suppliersByState / reviews / requests / period) |

---

## 8. 프론트 라우트 흐름

### 8.1 main-site 라우트 (`frontend/apps/main-site/src/App.tsx`)

| 경로 | 컴포넌트 | 가드 | 설명 |
|------|---------|------|------|
| `/` | `HomePage` | — | 랜딩 |
| `/login` | `LoginPage` | — | 로그인 |
| `/signup` | `SignupPage` | — | 회원가입 (role 선택) |
| `/dashboard` | `DashboardPage` | auth | 역할별 대시보드 |
| `/suppliers` | `SupplierSearchPage` | — (공개) | 공급자 목록 (필터/검색) |
| `/suppliers/:supplierId` | `SupplierDetailPage` | — (공개) | 공급자 상세 + 리뷰 |
| `/supplier/profile` | `SupplierProfilePage` | auth + SupplierRoute | 공급자 본인 프로필/검수 |
| `/business-profile` | `BusinessProfilePage` | auth + RequesterRoute | 요청자 사업자 정보 |
| `/requests` | `RequestListPage` | auth | 내 의뢰 리스트 (요청자) |
| `/requests/new` | `RequestCreatePage` | auth + RequesterApproved | 의뢰 생성 |
| `/requests/:requestId` | `RequestDetailPage` | auth | 의뢰 상세 |
| `/requests/:requestId/quotes` | `QuoteComparisonPage` | auth + owner | 견적 비교 |
| `/supplier/requests` | `SupplierRequestFeedPage` | auth + SupplierRoute | 의뢰 피드 |
| `/supplier/requests/:requestId` | `SupplierRequestDetailPage` | auth + SupplierRoute | 피드 상세 |
| `/quotes/create` | `QuoteCreatePage` | auth + SupplierRoute | 견적 작성 |
| `/supplier/quotes` | `SupplierQuoteListPage` | auth + SupplierRoute | 내 견적 리스트 |
| `/threads` | `ThreadListPage` | auth | 스레드 리스트 |
| `/threads/:threadId` | `ThreadDetailPage` | auth | 스레드 상세 (채팅) |
| `/notices` | `NoticeListDetailPage` | — | 공지사항 |
| `*` | `Navigate to /` | — | 404 fallback |

### 8.2 admin-site 라우트 (`frontend/apps/admin-site/src/App.tsx`)

| 경로 | 컴포넌트 | 가드 | 설명 |
|------|---------|------|------|
| `/login` | `LoginPage` | — | 관리자 로그인 |
| `/` | `HomePage` | admin | 대시보드 홈 |
| `/reviews` | `ReviewQueuePage` | admin | 공급자 검수 큐 |
| `/reviews/:reviewId` | `ReviewDetailPage` | admin | 검수 상세 (approve/hold/reject) |
| `/supplier-reviews` | `SupplierReviewListPage` | admin | 공급자 리뷰 모더레이션 |
| `/notices` | `NoticeManagementPage` | admin | 공지 CRUD |
| `/stats` | `StatsDashboardPage` | admin | 통계 |
| `*` | `Navigate to /` | — | 404 fallback (인증 전엔 `/login`) |

---

## 9. 도메인별 유저 저니

### 9.1 요청자(Requester) 저니

공급자 탐색 → 의뢰 작성 → 견적 수집 → 선택 → 스레드 → 리뷰

```
[1] 회원가입
    화면: /signup (role=REQUESTER)
    API:  POST /api/auth/signup → POST /api/auth/login
         → JWT 저장

[2] 사업자 정보 제출 (필수 게이트)
    화면: /business-profile
    API:  POST /api/requester/business-profile (approval_state=submitted)
         → (관리자 승인 대기)
    검증: GET /api/me → businessApprovalState 확인

[3] 공급자 탐색
    화면: /suppliers → /suppliers/:id
    API:  GET /api/suppliers?category=&region=&keyword=
          GET /api/suppliers/:id
          GET /api/suppliers/categories, /regions

[4] 의뢰 작성
    화면: /requests/new
    API:  POST /api/requests (mode=public or targeted)
         → (선택) POST /api/requests/:id/publish (draft → open)

[5] 견적 수집 & 비교
    화면: /requests/:id → /requests/:id/quotes
    API:  GET /api/requests/:id/quotes?sort=unitPriceEstimate

[6] 스레드 + 협상
    화면: /threads → /threads/:id
    API:  견적 제출과 함께 thread 자동 생성
          POST /api/threads/:id/messages
          POST /api/threads/:id/contact-share/request
          POST /api/threads/:id/contact-share/approve
          (mutually_approved 시 sharedContact 노출)

[7] 견적 선택 + 의뢰 마감
    API:  POST /api/quotes/:quoteId/select
         → request state=closed, quote state=selected

[8] 리뷰 작성
    화면: /requests/:id (리뷰 버튼) 또는 공급자 상세 (리뷰 섹션)
    API:  GET /api/reviews/eligibility?requestId=&supplierId=
          POST /api/requester/requests/:id/reviews
```

### 9.2 공급자(Supplier) 저니

프로필 작성 → 검수 통과 → 노출 → 견적 제출 → 협상 → 선택

```
[1] 회원가입
    화면: /signup (role=SUPPLIER)

[2] 공급자 프로필 작성
    화면: /supplier/profile
    API:  POST /api/supplier/profile (verification_state=draft, exposure_state=hidden)

[3] 검수 서류 제출
    화면: /supplier/profile (verification 탭)
    API:  POST /api/supplier/verification-submissions (multipart: businessRegistrationDoc, certifications, portfolioImages)
         → verification_submission state=submitted
         → supplier_profile.verification_state=submitted

[4] (관리자 승인 대기 후) 노출 활성화
    조건: verification_state=approved && exposure_state=visible
    결과: GET /api/suppliers 목록 노출

[5] 피드 모니터링
    화면: /supplier/requests
    API:  GET /api/supplier/requests?category=
         - 공개 open 의뢰 + 내가 targeted 인 open 의뢰
         - 각 item 의 hasQuoted 표시

[6] 견적 제출
    화면: /supplier/requests/:id → /quotes/create
    API:  POST /api/requests/:id/quotes
         → quote state=submitted, 자동 thread 생성

[7] 스레드 응대
    화면: /threads/:id
    API:  POST /api/threads/:id/messages
          POST /api/threads/:id/contact-share/approve

[8] 선택 결과 확인
    화면: /supplier/quotes 또는 /threads/:id
    상태: quote state=selected | declined
```

### 9.3 관리자(Admin) 저니

검수 → 모더레이션 → 공지 → 통계

```
[1] 로그인
    화면: /login (admin-site)
    API:  POST /api/admin/auth/login

[2] 공급자 검수
    화면: /reviews → /reviews/:id
    API:  GET /api/admin/reviews?state=submitted
          GET /api/admin/reviews/:id
          POST /api/admin/reviews/:id/approve    → verification_state=approved, exposure_state=visible
          POST /api/admin/reviews/:id/hold       → verification_state=hold  (notePublic 필수)
          POST /api/admin/reviews/:id/reject     → verification_state=rejected (notePublic 필수)
    부수: audit_log 항목 추가 (action_type=review_approve/hold/reject)

[3] 리뷰 모더레이션
    화면: /supplier-reviews
    API:  GET /api/admin/supplier-reviews?hidden=false
          POST /api/admin/supplier-reviews/:id/hide  (부적절 리뷰 숨김)
          POST /api/admin/supplier-reviews/:id/unhide

[4] 공지 관리
    화면: /notices
    API:  POST /api/admin/notices (draft)
          PATCH /api/admin/notices/:id
          POST /api/admin/notices/:id/publish
          POST /api/admin/notices/:id/archive

[5] 통계
    화면: /stats
    API:  GET /api/admin/stats/summary?fromDate=&toDate=
         → users (total/requesters/suppliers/admins)
         → suppliersByState (approved/submitted/under_review/hold/rejected/suspended/draft)
         → reviews (pending, avgReviewDays, totalReviewed)
         → requests (total/open/closed/cancelled/draft)
```

---

## 10. 보조 문서 인덱스

### `.sisyphus/`

| 경로 | 역할 |
|------|------|
| `drafts/api-spec.md` (v1.10) | API 계약의 SSOT |
| `plans/phase3-subplans/phase3-task-A-cqrs-rollback.md` | Phase 3 Task A (CQRS 롤백) 9 stage 계획서 + 진행도 로그 |
| `plans/phase2-subplans-index.ko.md` | Phase 2 task 색인 |
| `open-items.md` | 미결 항목 / TODO |
| `session-handoff-*.md` | 날짜별 세션 핸드오프 (`2026-04-17` / `04-19` / `04-20` / `04-20-evening`) |
| `evidence/` | Task 완료 근거 (smoke 결과, 정책 이행 매트릭스 등) |

### `docs/`

| 경로 | 역할 |
|------|------|
| `REFACTORING-GUIDELINES.ko.md` (v1.9) | 원칙 + §8 실제 적용 사례 10건 (CQRS 롤백 포함) |
| `TEST-GUIDE.md` | 테스트 전략 (단위/통합/E2E) |
| `backend-refactor-2026-04-19.md` | 2026-04-19 리팩토링 상세 기록 |
| `design/` | ERD, 상태 다이어그램, 인증 플로우 다이어그램 |

### 루트 가이드

| 파일 | 대상 |
|------|------|
| `LOCAL-RUN-GUIDE.ko.md` | 개발자 로컬 실행 |
| `EXTERNAL-ACCESS-GUIDE.ko.md` | 외부 접속 (공유기 포워딩 / UPnP) |
| `DESIGN-BRIEF.md` | 초기 요구사항 |
| `README.md` | 프로젝트 개요 |

---

## 부록 A. 주요 아키텍처 결정 사항 (ADR 요약)

| 결정 | 이유 | 참고 |
|------|------|------|
| WebFlux (Reactive) 채택 | 다수 동시 연결 대응 + 함수형 에러 체인 | 초기 설계 |
| R2DBC + MariaDB 단일 저장소 | CQRS 복잡도 대비 읽기 패턴이 단순. YAGNI | `docs/REFACTORING-GUIDELINES.ko.md §8 사례 10` |
| JWT 단일 토큰 (refresh 없음 현재) | MVP 규모, TTL 1h 로 충분 | `shared-core/security` |
| 파일 로컬 저장 | 로컬/데모 단계. S3 등 외부 스토리지는 `FileStorageService` 인터페이스로 확장 예정 | `LocalFileStorageService` |
| DTO shape 보존 규약 | 백엔드 내부 리팩토링이 프론트 회귀를 일으키지 않도록 | CQRS 롤백 전 stage 에서 준수 |
| SSOT 계약 문서: `api-spec.md` | 백/프론트 드리프트 방지 | `§1.1`, `§1.3` 지침서 |

## 부록 B. 자주 마주치는 트러블슈팅

| 증상 | 원인 / 조치 |
|------|-----------|
| `GET /api/suppliers` 목록 비어있음 | `supplier_profile.exposure_state` 가 `'visible'` 인지 확인. seed 가 `'listed'` 로 드리프트된 경우 Stage 2 commit `1224130` 이후 자동 정상화 |
| 공급자 목록에 새 공급자 안 나옴 | 관리자 검수 승인 → verification_state=approved AND exposure_state=visible 필요 |
| Thread 응답 5xx | `contact_share_state` 값 확인. canonical: `not_requested` / `one_side_approved` / `mutually_approved` / `revoked` |
| UPnP 외부 접속 timeout | UPnP 휘발성. 공유기 정적 포워딩 + DHCP 예약 필요 (`EXTERNAL-ACCESS-GUIDE.ko.md`) |
| 외부 포트 8080 차단 | ISP 가 well-known 포트 차단. 18080 → 8080 매핑으로 우회 |
| `./gradlew test` 일부 hang | 기본적으로 H2 in-memory 로 동작. Docker / Mongo 필요 없음 |

---

**문서 버전**: 1.0 (2026-04-24)
**작성 기준 HEAD**: `d1470bb`
**향후 갱신 트리거**: 모듈 추가/삭제, API endpoint 변경, 주요 라우트 변경, 인프라 구성 변경
