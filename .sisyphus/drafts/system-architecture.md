# System Architecture

> 상태: Active Baseline
> 범위: Phase 1 시스템 구조 기준
> 연관 문서: `data-model.md`, `api-spec.md`, `backend-guide.md`, `frontend-guide.md`, `design-system.md`

---

## 1. 목적과 범위

이 문서는 Phase 1 시스템이 어떤 구조로 조립되는지 설명하는 아키텍처 기준 문서다.

이 문서의 책임은 아래와 같다.

- frontend / backend / persistence의 전체 구조 정의
- 앱/서버 분리 기준 정의
- CQRS 책임 분리 규칙 정의
- 모듈 경계와 package 규칙 정의
- cross-cutting rule 정의

이 문서는 아래 내용을 상세히 다루지 않는다.

- 엔티티/필드/컬렉션 상세 구조 -> `data-model.md`
- 엔드포인트별 request/response 상세 계약 -> `api-spec.md`

---

## 2. 아키텍처 문서 체계

아키텍처 레이어는 아래 3문서로만 유지한다.

1. `system-architecture.md`
   - 시스템 형태, 앱/서버 분리, 모듈 구조, CQRS 규칙, package 규칙
2. `data-model.md`
   - command/write 모델, query/read 모델, 데이터 소유권, 관계, projection 대상
3. `api-spec.md`
   - 외부 계약, endpoint 그룹, 인증/인가 요구, validation, error contract

---

## 3. 핵심 아키텍처 결정

- base package는 `dev.riss.fsm`을 사용한다.
- frontend는 단일 앱이 아니라 `main-site`, `admin-site` 2개 앱으로 분리한다.
- requester / supplier는 별도 앱으로 분리하지 않고 `main-site` 내부 역할/IA 분리로 처리한다.
- frontend app framework는 `React + Vite + React Router`로 통일한다.
- frontend workspace tooling은 `Yarn 4.5.0 (Berry) + Yarn Workspaces`를 사용한다.
- frontend state baseline은 `TanStack Query + Zustand`를 사용한다.
- frontend styling baseline은 `Emotion + Radix UI + Tailwind` 조합이다.
- frontend font baseline은 `Noto Sans JP`, i18n baseline은 `i18next`다.
- frontend animation baseline은 `Lottie-web`이다.
- backend는 하나의 `backend/` 저장소 안에서 Gradle 멀티모듈 구조를 사용한다.
- backend runtime은 `api-server`와 `admin-server` 두 서버로 분리한다.
- backend runtime style은 `Reactive WebFlux`를 사용한다.
- CQRS는 strict split을 채택한다.
- write 모델은 RDB(MariaDB / MySQL-compatible)를 source of truth로 사용한다.
- write side relational access는 `R2DBC`를 사용한다.
- read 모델은 MongoDB 계열 document/query store를 사용한다.
- projection 계층이 write 변경을 read 모델로 동기화한다.

---

## 4. 시스템 컨텍스트

주요 사용자와 시스템 surface는 아래와 같다.

- 요청자 / 공급자: `main-site` 사용
- 관리자: `admin-site` 사용
- 메인 서비스 API 호출자: `api-server`
- 관리자 기능 API 호출자: `admin-server`

의미적으로는 아래와 같이 분리한다.

- `main-site`는 대외 사용자용 제품 surface다.
- `admin-site`는 내부 운영/검수 surface다.
- `api-server`는 메인 서비스 트래픽과 제품 기능을 담당한다.
- `admin-server`는 관리자 검수/운영/통계 기능을 담당한다.

---

## 5. 상위 토폴로지

```text
frontend/
├── apps/
│   ├── main-site
│   └── admin-site
└── packages/
    ├── ui
    ├── types
    ├── utils
    └── config

# total workspaces: 6

backend/
├── shared-core
├── command-domain-*
├── query-model-*
├── projection
├── api-server
└── admin-server

persistence/
├── MariaDB / MySQL-compatible   # write side
└── MongoDB                      # read side
```

---

## 6. Frontend Architecture

### 6.1 앱 분리

- `apps/main-site`
  - 요청자/공급자 대상 메인 서비스 사이트
  - 역할별 진입과 IA는 분리하지만 같은 앱 안에서 관리
  - `React + Vite + React Router` 기반 앱으로 설계
  - 공개 페이지와 로그인 후 작업 영역을 같은 앱 안 route 체계로 관리
- `apps/admin-site`
  - 관리자 검수, 운영, 공지, 통계 전용 사이트
  - `React + Vite + React Router` 기반 운영 앱으로 설계

### 6.2 공통 패키지

- `packages/ui`: 공통 UI 컴포넌트, 토큰, 테마, layout primitive
- `packages/types`: API DTO, frontend shared type, view model type
- `packages/utils`: API client, query helper, formatting, frontend utility
- `packages/config`: Vite / lint / tsconfig / env preset 등 공통 설정

### 6.3 스타일 레이어 규칙

- `Radix UI`는 접근성 기반 primitive/component foundation으로 사용한다.
- `Tailwind`는 layout, spacing, responsive utility, 빠른 시각 조합을 담당한다.
- `Emotion`은 theme token binding, component-level dynamic styling, Tailwind로 다루기 불편한 상태 기반 스타일에 사용한다.
- 구체적인 혼용 규칙은 `frontend-guide.md`, `design-system.md`에 이미 반영된 기준을 따른다.

### 6.4 분리 원칙

- `main-site`와 `admin-site`는 build/runtime 엔트리를 분리한다.
- 공통 코드는 앱 간 copy-paste 하지 않고 `packages/*`로 끌어올린다.
- admin용 화면 규칙은 `main-site` 내부 hidden mode로 구현하지 않는다.
- workspace 안에서 `main-site`와 `admin-site`는 같은 app framework를 사용한다.
- 두 앱 모두 client-rendered React app이다.

---

## 7. Backend Architecture

### 7.1 서버 분리

- `api-server`
  - 요청자/공급자/public 기능 노출
  - 메인 비즈니스 API 담당
- `admin-server`
  - 관리자 전용 기능 노출
  - 검수/운영/통계 API 담당

### 7.2 모듈 구조

```text
backend/
├── shared-core
│   ├── common
│   ├── ids
│   ├── enums
│   ├── errors
│   └── event-contracts
│
├── command-domain-user
├── command-domain-supplier
├── command-domain-request
├── command-domain-quote
├── command-domain-thread
│
├── query-model-user
├── query-model-supplier
├── query-model-request
├── query-model-quote
├── query-model-thread
├── query-model-admin-review
├── query-model-admin-stats
│
├── projection
├── api-server
└── admin-server
```

### 7.3 모듈 의미

- `shared-core`
  - 공통 식별자, enum, 예외, event contract 같은 얇은 공통 커널
  - 무거운 도메인 로직은 두지 않는다.
- `command-domain-*`
  - write side 도메인 모듈
  - entity, aggregate, command, command handler, reactive write repository port 포함
- `query-model-*`
  - read side 모델 모듈
  - read model, query, query handler, read repository port 포함
- `projection`
  - command side 변경 이벤트를 읽어 MongoDB read model 갱신
- `api-server`
  - main-site가 사용하는 API composition root
- `admin-server`
  - admin-site가 사용하는 API composition root

---

## 8. CQRS Rules

### 8.1 기본 원칙

- command와 query는 같은 도메인이라도 다른 책임으로 취급한다.
- command side 클래스와 query side 클래스는 같은 파일/같은 타입으로 합치지 않는다.
- write side는 transaction consistency를 우선한다.
- read side는 조회 최적화와 화면 친화적 구조를 우선한다.
- reactive rule을 깨는 blocking persistence adapter는 구조에 포함하지 않는다.

### 8.2 write side

- write 모델은 RDB를 source of truth로 사용한다.
- entity / aggregate / invariant enforcement는 command-domain 모듈에 둔다.
- command handler는 상태 변경과 이벤트 발행 책임을 가진다.
- relational write adapter는 `R2DBC` 기반으로 설계한다.

### 8.3 read side

- read 모델은 MongoDB를 기본 query store로 사용한다.
- read 모델은 UI/조회 시나리오에 맞게 비정규화될 수 있다.
- read 모델은 primary write source가 되면 안 된다.

### 8.4 projection

- command side 상태 변화는 event contract를 통해 projection 계층으로 전달한다.
- projection은 MongoDB read model을 갱신한다.
- read/write 모델 간 필드 구조 차이는 허용한다.

---

## 9. Package Convention

base package는 `dev.riss.fsm`이다.

예시:

```text
dev.riss.fsm.shared.common
dev.riss.fsm.command.supplier
dev.riss.fsm.command.request
dev.riss.fsm.query.supplier
dev.riss.fsm.query.admin.review
dev.riss.fsm.projection.supplier
dev.riss.fsm.api
dev.riss.fsm.admin
```

규칙:

- package는 기술보다 책임 기준으로 자른다.
- `command`와 `query`는 package prefix 수준에서도 구분한다.
- server entry package는 `api`, `admin`을 분리한다.

---

## 10. Communication Pattern

```text
main-site  -> api-server   -> command-domain-* -> RDB
main-site  -> api-server   -> query-model-*    -> MongoDB

admin-site -> admin-server -> command-domain-* -> RDB
admin-site -> admin-server -> query-model-admin-* -> MongoDB

command-domain-* -> event-contracts -> projection -> query-model-* / MongoDB
```

해석:

- `api-server`와 `admin-server`는 동일한 command domain을 공유할 수 있다.
- 하지만 외부로 노출하는 API surface와 auth boundary는 분리한다.
- admin 전용 조회 모델은 `query-model-admin-*` 계열로 별도 최적화할 수 있다.

---

## 11. Cross-cutting Rules

### 11.1 인증/인가 경계

- `api-server`와 `admin-server`는 인증 정책의 공통 기반을 공유할 수 있다.
- 그러나 admin role 검증 규칙과 admin 전용 endpoint 노출 규칙은 별도 서버 경계에서 강제한다.

### 11.2 검증

- input validation은 API contract와 application service 경계에서 수행한다.
- 도메인 invariant는 command aggregate가 최종 책임을 가진다.

### 11.3 트랜잭션

- write side 트랜잭션은 command 처리 단위로 관리한다.
- projection은 eventual consistency를 허용한다.

### 11.4 에러 처리

- 외부 에러 계약은 `api-spec.md`에서 정의한다.
- 내부 예외 계층과 변환 규칙은 `shared-core`와 각 서버 composition root에서 관리한다.

### 11.5 관측성

- 서버별 로그, trace, metric 경계는 분리한다.
- admin 기능은 감사 추적 요구를 우선한다.

---

## 12. Runtime / Deployment View

- `main-site`와 `admin-site`는 별도 배포 단위로 본다.
- `api-server`와 `admin-server`는 별도 실행 프로세스/서비스로 본다.
- 정확한 인프라 토폴로지, 네트워크, 배포 파이프라인은 현재 문서 범위 밖이다.

---

## 13. Dependency Rules

- `api-server`와 `admin-server`는 `shared-core`, `command-domain-*`, `query-model-*`, `projection`에 의존할 수 있다.
- `command-domain-*`는 `query-model-*`에 직접 의존하지 않는다.
- `query-model-*`는 write entity를 source of truth로 사용하지 않는다.
- `projection`만이 command side 이벤트와 query side read model 갱신을 연결한다.
- WebFlux runtime을 사용하는 서버는 blocking JPA/Hibernate adapter를 기본 dependency로 채택하지 않는다.
- frontend apps는 공통 패키지에 의존할 수 있지만, 앱끼리 직접 의존하지 않는다.

---

## 14. Non-goals

- requester-site / supplier-site까지 앱을 더 쪼개는 것
- `api-server` / `admin-server`를 별도 저장소로 분리하는 것
- CQRS를 package 이름만 나누고 사실상 혼합 구현하는 것
- data field detail이나 endpoint detail을 이 문서에 중복 작성하는 것

---

## 15. Follow-up to Other Docs

- `data-model.md`에는 command entity, aggregate, read model, projection target, RDB/Mongo ownership을 적는다.
- `api-spec.md`에는 `api-server`와 `admin-server`가 노출하는 endpoint contract를 적는다.
- role-specific guide 문서는 `backend-guide.md`, `frontend-guide.md`, `design-system.md`를 참고한다.
