# Backend Guide

> 상태: Active Guide
> 기준 문서: `system-architecture.md`, `data-model.md`, `api-spec.md`

---

## 1. 목적

이 문서는 Phase 1 백엔드 구현자가 따라야 할 개발 기준을 정리한다.

- 구조 기준은 `system-architecture.md`
- 데이터/도메인 기준은 `data-model.md`
- API 계약 기준은 `api-spec.md`

---

## 2. 백엔드 기술 스택

| 항목 | 선택 | 설명 |
|------|------|------|
| 언어 | Kotlin | 기본 구현 언어 |
| 빌드 도구 | Gradle | 멀티모듈 빌드 |
| 프레임워크 | Spring Boot | 서버 런타임 |
| 런타임 스타일 | Spring WebFlux | Reactive runtime |
| JDK | 21+ | 기준 런타임 |
| 방법론 | DDD + TDD | 도메인 중심 + 테스트 우선 |
| 아키텍처 | CQRS | command/query strict split |
| Write Store | MariaDB / MySQL-compatible | source of truth |
| Write Access | R2DBC | reactive relational access |
| Read Store | MongoDB | query/document store |
| 인증 | JWT | stateless auth baseline |

---

## 3. 저장소 구조

```text
backend/
├── shared-core
├── command-domain-user
├── command-domain-supplier
├── command-domain-request
├── command-domain-quote
├── command-domain-thread
├── query-model-user
├── query-model-supplier
├── query-model-request
├── query-model-quote
├── query-model-thread
├── query-model-admin-review
├── query-model-admin-stats
├── projection
├── api-server
└── admin-server
```

규칙:

- `api-server`, `admin-server`는 외부 API composition root다.
- 공통 도메인 로직을 서버 모듈 안에 직접 쌓지 않는다.
- command/query를 같은 모듈이나 같은 타입으로 섞지 않는다.

---

## 4. 패키지 규칙

base package는 `dev.riss.fsm`이다.

예시:

```text
dev.riss.fsm.shared.common
dev.riss.fsm.command.supplier
dev.riss.fsm.query.request
dev.riss.fsm.query.admin.review
dev.riss.fsm.projection.quote
dev.riss.fsm.api
dev.riss.fsm.admin
```

규칙:

- 기술보다 책임 기준으로 package를 자른다.
- `command`, `query`, `projection`, `api`, `admin` prefix를 유지한다.
- `shared-core`는 얇게 유지한다.

---

## 5. CQRS / DDD 구현 규칙

### 5.1 Command Side

- entity / aggregate / invariant enforcement는 command-domain에 둔다.
- 상태 전이와 guard rule은 aggregate가 최종 책임을 가진다.
- relational write access는 R2DBC 기반 adapter로 구현한다.

### 5.2 Query Side

- read model은 UI/조회 최적화 기준으로 비정규화할 수 있다.
- read model은 primary write source가 아니다.
- query handler는 MongoDB read model을 기준으로 동작한다.

### 5.3 Projection

- command side 이벤트를 projection 계층이 consume한다.
- projection은 Mongo read model을 갱신한다.
- eventual consistency를 허용한다.

---

## 6. 서버 경계

### api-server

- 요청자/공급자/public API 노출
- 탐색, 의뢰, 견적, 메시지, 공개 공지 담당

### admin-server

- 관리자 전용 API 노출
- 검수, 관리자 공지 관리, 통계 담당

규칙:

- 같은 command domain을 공유할 수 있어도 외부 노출 endpoint는 섞지 않는다.
- admin 전용 권한 규칙은 `admin-server`에서 강제한다.

---

## 7. 테스트 기준

- TDD를 기본값으로 사용한다.
- command aggregate는 상태 전이 / invariant 테스트를 우선한다.
- query model은 projection 결과와 조회 shape를 우선 검증한다.
- 서버 테스트는 role/state 기반 접근 제어를 포함해야 한다.

우선 검증 대상:

- requester business approval gate
- supplier verification state transitions
- quote patch/withdraw/select/decline rules
- thread creation uniqueness
- contact-share revoke / retry rules
- admin hold / reject / resubmission semantics

---

## 8. 구현 시 금지사항

- WebFlux 서버에 blocking JPA/Hibernate adapter를 기본으로 넣지 않는다.
- command entity를 read response 모델로 재사용하지 않는다.
- admin endpoint를 `api-server`에 섞지 않는다.
- read model을 write source처럼 취급하지 않는다.

---

## 9. 읽는 순서

1. `system-architecture.md`
2. `data-model.md`
3. `api-spec.md`
4. 이 문서
