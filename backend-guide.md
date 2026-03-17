[← Back to Development Guides](./README.md) | [← Back to Docs Root](../README.md)

# Backend Development Guide

> **프로젝트**: remote-standard 백엔드  
> **버전**: 2.0.0  
> **마지막 수정일**: 2026-03-12

---

## 관련 문서

| 문서 | 위치 | 설명 |
|------|------|------|
| **PRD** | [../02-prd/prd-v2.0-core.md](../02-prd/prd-v2.0-core.md) | 제품 요구사항 명세 |
| **Architecture** | [../03-architecture/system-architecture.md](../03-architecture/system-architecture.md) | 시스템 아키텍처 설계 |
| **Data Model** | [../03-architecture/data-model.md](../03-architecture/data-model.md) | 데이터 모델 및 ERD |
| **API Spec** | [../03-architecture/api-spec.md](../../03-architecture/api-spec.md) | API 명세 |

---

## 1. 백엔드 기술 스택

| 항목 | 선택 | 버전/설명 |
|------|------|-----------|
| **언어** | Kotlin | 2.3.x |
| **빌드 도구** | Gradle | 8.14 (wrapper) |
| **프레임워크** | Spring Boot | 4.0.2 |
| **리액티브** | Spring WebFlux | Non-blocking I/O |
| **JDK** | OpenJDK | 21+ |
| **방법론** | DDD + TDD | 도메인 주도 설계 + 테스트 주도 개발 |
| **아키텍처** | CQRS | 명령과 조회 책임 분리 |
| **쓰기 DB** | MariaDB | JPA/Hibernate |
| **읽기 DB** | MongoDB | NoSQL |
| **인증** | JWT | Stateless 인증 |

### Spring Boot 4.0 주요 변경사항
- `spring-boot-starter-webflux` 사용 (starter-web 아님)
- `@WebFluxTest` 사용 시 `spring-boot-starter-webflux-test` 의존성 필요
- `Jackson 3`: `tools.jackson.module:jackson-module-kotlin`

### 테스트
- TDD 방식: 테스트를 먼저 작성하고 구현 코드를 작성한다
- JUnit 5: Spring 통합 테스트 (`@WebFluxTest`, `@SpringBootTest` 등)
- Kotest: 순수 단위 테스트 (Kotest SpringExtension은 Spring Boot 4와 호환되지 않음)
- 에러 처리: Spring Boot 기본 에러 응답 구조 사용

---

## 2. 프로젝트 구조

### 2.1 백엔드 디렉토리 구조

```
backend/                          # 백엔드 모듈
├── buildSrc/                     # 공통 빌드 설정 (Gradle BuildSrc)
│   └── src/main/kotlin/
│       ├── conventions.kotlin-conventions.gradle.kts
│       ├── conventions.library-conventions.gradle.kts
│       └── conventions.spring-conventions.gradle.kts
│
├── lib-signaling/                # WebRTC 시그널링 라이브러리
│   - Channel 관리
│   - ICE candidate 교환 중계
│   ⚠️ 현재: WebSocket 기반
│   ⚠️ 향후: PNS 커스텀 서버로 전환
│
├── lib-chat/                     # 채팅 도메인 라이브러리
│   - 메시지 저장 (MongoDB)
│   - 채팅방 관리
│   - 메시지 브로드캐스트
│
├── lib-user/                     # 사용자 도메인 라이브러리
│   - 사용자 CRUD (MariaDB)
│   - 인증/인가 (JWT)
│   - 프로필 관리
│
├── lib-channel/                  # Channel 도메인 라이브러리
│   - Channel CRUD (MariaDB)
│   - 상담 이력 (MongoDB)
│   - Channel 상태 관리
│
├── lib-file/                     # 파일 도메인 라이브러리
│   - 파일 업로드/다운로드
│   - 파일 메타데이터 관리 (MongoDB)
│
├── api/                          # 클라이언트/상담사 API 서비스
│   - WebRTC 시그널링 API
│   - 실시간 채팅 API
│   - Channel API
│   - 파일 API
│   - 사용자 프로필 API
│
├── admin/                        # 관리자 API 서비스
│   - 사용자 관리 API
│   - 상담 이력 조회 API
│   - 통계/대시보드 API
│
├── security-tests/               # 보안 통합 테스트 모듈
│
└── core/                         # 공통 라이브러리 (코어 모듈)
    ├── common/                   # 공통 유틸리티, 예외 처리
    ├── domain/                   # 공통 도메인 모델
    └── event/                    # 이벤트 스키마, 메시지 큐
```

### 2.2 백엔드 모듈 의존성

```
                              HTTP/WebSocket
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        백엔드 레이어                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │  api-service    │  │  admin-service  │                       │
│  │  (REST/WebSocket)│  │  (REST API)     │                       │
│  └────────┬────────┘  └─────────────────┘                       │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   라이브러리 모듈                          │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │   │
│  │  │lib-     │ │lib-     │ │lib-     │ │lib-     │  lib-  │   │
│  │  │signaling│ │  chat   │ │  user   │ │channel  │  file  │   │
│  │  │         │ │         │ │         │ │         │        │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘        │   │
│  │       └──────────┴──────────┴───────────┘               │   │
│  │                         │                               │   │
│  │                         ▼                               │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │              core/ (공통 모듈)                   │   │   │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐          │   │   │
│  │  │  │ common  │  │ domain  │  │  event  │          │   │   │
│  │  │  │(유틸리티) │  │(도메인)  │  │(이벤트)  │          │   │   │
│  │  │  └─────────┘  └─────────┘  └─────────┘          │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        데이터 레이어                             │
├─────────────────────────────┬───────────────────────────────────┤
│      MariaDB (쓰기 DB)       │       MongoDB (읽기 DB)          │
│  ┌─────────┐ ┌─────────┐   │  ┌─────────┐ ┌─────────┐          │
│  │  user   │ │channel  │   │  │  chat   │ │channel  │  file    │
│  │  (JPA)  │ │  (JPA)  │   │  │messages │ │history  │metadata  │
│  │         │ │         │   │  │         │ │         │          │
│  └─────────┘ └─────────┘   │  └─────────┘ └─────────┘          │
└─────────────────────────────┴───────────────────────────────────┘
```

#### 모듈 의존성 상세

| 모듈 | 의존 대상 | 설명 |
|------|-----------|------|
| `core` | 없음 | Foundation layer. 공통 유틸리티, 도메인 모델, 이벤트 스키마 포함 |
| `lib-user` | `core` | 사용자 도메인. MariaDB, Redis 사용 |
| `lib-channel` | `core` | Channel/Endpoint 도메인. MariaDB, MongoDB 사용 |
| `lib-signaling` | `core` | WebRTC 시그널링 로직. Redis 사용 |
| `lib-chat` | `core` | 채팅 메시지. MongoDB 사용 |
| `lib-file` | `core` | 파일 메타데이터. MariaDB, S3 사용 |
| `api` | `core`, `lib-user`, `lib-channel`, `lib-signaling`, `lib-chat`, `lib-file` | 메인 API 서비스 (port 8080) |
| `admin` | `core`, `lib-user`, `lib-channel` | 관리자 API 서비스 (port 8081) |
| `security-tests` | `api`, `admin` | 보안 통합 테스트 |

---

## 3. 아키텍처 원칙

### 3.1 CQRS (Command Query Responsibility Segregation)

CQRS 패턴은 명령(Command)과 조회(Query)의 책임을 분리하는 아키텍처 패턴입니다.

```
┌─────────────────────────────────────────────────────────────┐
│                     CQRS 패턴 흐름                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   클라이언트 ───┬──► [Command] ───► Command Handler         │
│                 │       │                │                  │
│                 │       │                ▼                  │
│                 │       │         ┌─────────────┐           │
│                 │       │         │  Command    │           │
│                 │       │         │  Validator  │           │
│                 │       │         └──────┬──────┘           │
│                 │       │                │                  │
│                 │       │                ▼                  │
│                 │       │         ┌─────────────┐           │
│                 │       └────────►│   MariaDB   │           │
│                 │                 │  (쓰기 DB)   │           │
│                 │                 └──────┬──────┘           │
│                 │                        │                  │
│                 │                        ▼                  │
│                 │                 ┌─────────────┐           │
│                 │                 │   Event     │           │
│                 │                 │  Published  │           │
│                 │                 └──────┬──────┘           │
│                 │                        │                  │
│                 │                        ▼                  │
│                 │                 ┌─────────────┐           │
│                 │                 │   Read DB   │           │
│                 │                 │  Sync Job   │───►MongoDB │
│                 │                 └─────────────┘           │
│                 │                                           │
│                 └──► [Query] ─────► Query Handler           │
│                                         │                   │
│                                         ▼                   │
│                                   ┌─────────────┐           │
│                                   │   MongoDB   │           │
│                                   │  (읽기 DB)   │           │
│                                   └─────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**규칙:**
- **Command**: 데이터를 변경하는 작업 (Create, Update, Delete)
  - MariaDB에 직접 쓰기
  - 트랜잭션 보장
  - 도메인 이벤트 발행
  
- **Query**: 데이터를 조회하는 작업 (Read)
  - MongoDB에서 읽기
  - Non-blocking 조회
  - 최적화된 뷰 모델 사용

### 3.2 DDD (Domain-Driven Design)

도메인 주도 설계를 통해 비즈니스 로직을 중심으로 시스템을 구성합니다.

#### 레이어 구조

```
┌──────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│              (Controller, DTO, Validator)                │
├──────────────────────────────────────────────────────────┤
│                    Application Layer                     │
│          (Service, UseCase, Event Publisher)             │
├──────────────────────────────────────────────────────────┤
│                    Domain Layer                          │
│     (Entity, Value Object, Aggregate Root, Repository)   │
├──────────────────────────────────────────────────────────┤
│                 Infrastructure Layer                     │
│         (JPA Repository, MongoDB, External API)          │
└──────────────────────────────────────────────────────────┘
```

#### 핵심 개념

| 개념 | 설명 | 예시 |
|------|------|------|
| **Aggregate Root** | 일관성 경계 내의 엔티티 그룹 | Channel |
| **Entity** | 식별자를 가진 도메인 객체 | User, ChatMessage |
| **Value Object** | 불변의 값 객체 | ChannelId, RoomCode, Email |
| **Domain Event** | 도메인에서 발생한 사건 | ChannelStartedEvent |

### 3.3 TDD (Test-Driven Development)

테스트 주도 개발 워크플로우를 따릅니다.

```
┌─────────────────────────────────────────────────────────┐
│                  TDD 사이클 (Red-Green-Refactor)        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────┐      ┌─────────┐      ┌─────────┐        │
│   │   Red   │─────►│  Green  │─────►│Refactor │        │
│   │  실패    │      │  성공    │      │  개선    │        │
│   └────┬────┘      └────┬────┘      └────┬────┘        │
│        │                │                │              │
│        ▼                ▼                ▼              │
│   테스트 작성          최소한의         코드 개선        │
│   (실패 확인)          구현으로         (리팩토링)       │
│                       테스트 통과                        │
│                                                         │
│   ─────────────────────────────────────────────────     │
│   │  주기: 3-10분 단위로 사이클 반복                  │
│   │  원칙: 테스트 먼저, 작게 쪼개서 진행               │
│   │  목표: 커버리지 80% 이상 유지                     │
│   ─────────────────────────────────────────────────     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**규칙:**
1. 실패하는 테스트를 먼저 작성 (Red)
2. 테스트를 통과하는 최소한의 코드 작성 (Green)
3. 중복 제거 및 코드 개선 (Refactor)
4. 3-10분 단위로 사이클 반복

### 3.4 Reactive Programming (WebFlux)

Spring WebFlux를 사용한 Non-blocking Reactive 프로그래밍을 적용합니다.

**핵심 특징:**
- **Non-blocking I/O**: 스레드 블로킹 없이 요청 처리
- **Backpressure**: 생산자-소비자 간 속도 조절
- **Functional Style**: 함수형 프로그래밍 패러다임

```kotlin
// Reactive 예시
fun findChannelById(id: String): Mono<Channel> {
    return channelRepository.findById(id)
        .switchIfEmpty(Mono.error(ChannelNotFoundException(id)))
}

fun getActiveChannels(): Flux<Channel> {
    return channelRepository.findByStatus(ChannelStatus.ACTIVE)
}
```

---

## 4. 로컬 개발 환경

### 4.1 로컬 인프라 스택

Docker Compose로 제공되는 로컬 개발 인프라:

| 서비스 | 포트 | 용도 | 이미지 버전 |
|--------|------|------|-------------|
| MariaDB | 3306 | Command Store (ACID) | mariadb:11.4 |
| MongoDB | 27017 | Query Store (읽기) | mongo:4.4 |
| Redis | 6379 | Session/Cache/State | redis:7.4-alpine |
| MinIO | 9000/9001 | Object Storage (S3) | minio:RELEASE.2023-01-18T04-36-38Z |

**참고**: MongoDB와 MinIO는 CPU 아키텍처 호환성을 위해 구버전 사용 (AVX 미지원 환경 지원)

### 4.2 인프라 시작

```bash
# 모든 서비스 시작
docker compose up -d

# 서비스 상태 확인
docker compose ps

# 로그 확인
docker compose logs -f

# 서비스 중지
docker compose down

# 데이터 초기화 후 재시작
docker compose down -v
docker compose up -d
```

### 4.3 데이터베이스 스키마

MariaDB와 MongoDB는 Docker 볼륨 마운트로 자동 초기화됩니다:
- MariaDB: `docker/mariadb/init/01-schema.sql`
- MongoDB: `docker/mongodb/init/01-init-query-store.js`

---

## 5. WebRTC 시그널링 흐름

### 5.1 연결 수립 과정

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WebRTC 연결 수립 시퀀스                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   상담사(Agent)            시그널링 서버             고객(Guest)       │
│       │                          │                       │              │
│       │  1. createChannel()      │                       │              │
│       │─────────────────────────►│                       │              │
│       │                          │                       │              │
│       │◄─────────────────────────│                       │              │
│       │  channelId: "CH-123"     │                       │              │
│       │  roomCode: "123456"      │                       │              │
│       │                          │                       │              │
│       │                          │◄────── 2. joinChannel()              │
│       │                          │     roomCode: "123456"│              │
│       │                          │                       │              │
│       │◄──── 3. userJoined ─────►│                       │              │
│       │                          │                       │              │
│       │  4. createOffer()        │                       │              │
│       │  ─────(SDP Offer)───────►│                       │              │
│       │                          │────(SDP Offer)───────►│              │
│       │                          │                       │              │
│       │                          │◄────── 5. createAnswer│              │
│       │                          │       (SDP Answer)    │              │
│       │◄────(SDP Answer)─────────│                       │              │
│       │                          │                       │              │
│       │  6. ICE Candidate 교환   │                       │              │
│       │  ←──────────────────────►│←─────────────────────►│              │
│       │                          │                       │              │
│       │  7. P2P 연결 수립        │                       │              │
│       │◄════════════════════════════════════════════════►│              │
│       │       WebRTC Data Channel                        │              │
│       │       (화상/음성/화면 공유)                        │              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 시그널링 메시지 타입

| 메시지 타입 | 방향 | 설명 |
|------------|------|------|
| `createChannel` | Agent → Server | 새 Channel 생성 |
| `joinChannel` | Guest → Server | 기존 Channel 참여 (RoomCode 사용) |
| `offer` | Agent ↔ Guest | SDP Offer 교환 |
| `answer` | Agent ↔ Guest | SDP Answer 교환 |
| `ice-candidate` | Agent ↔ Guest | ICE Candidate 교환 |
| `leaveChannel` | Both → Server | Channel 퇴장 |

### 5.3 미디어 서버 (Janus)

```
┌─────────────────────────────────────────────────────────┐
│                   Janus 미디어 서버 아키텍처             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────────┐          ┌─────────────────────────┐ │
│   │  Signaling  │◄────────►│      Janus Gateway      │ │
│   │   Server    │ WebSocket│    (WebRTC Media Server) │ │
│   └──────┬──────┘          │  ┌───────────────────┐  │ │
│          │                 │  │   Plugins         │  │ │
│          ▼                 │  │  ┌─────────────┐  │ │
│   ┌─────────────┐          │  │  │ VideoRoom   │  │ │
│   │   MariaDB   │          │  │  │ Plugin      │  │ │
│   │   MongoDB   │          │  │  │ (SFU/MCU)   │  │ │
│   └─────────────┘          │  │  └─────────────┘  │ │
│                            │  │  ┌─────────────┐  │ │
│   ┌─────────────┐          │  │  │ Streaming   │  │ │
│   │   Agent     │◄────────►│  │  │ Plugin      │  │ │
│   │  (WebRTC)   │          │  │  └─────────────┘  │ │
│   └─────────────┘          │  └───────────────────┘  │ │
│                            └─────────────────────────┘ │
│   ┌─────────────┐                                       │
│   │   Guest     │◄─────────────────────────────────────►│
│   │  (WebRTC)   │                                       │
│   └─────────────┘                                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 6. AI Service 연동

> **⚠️ v2.1 예정**
> 
> AI Service는 v2.1 (AI Basic) 단계에서 도입됩니다. v2.0 Core에서는 Rule-based 상담 지원 기능만 제공합니다.

### 6.1 AI Service 개요

| 항목 | 사양 |
|------|------|
| **언어** | Python 3.11+ |
| **프레임워크** | FastAPI |
| **통신** | gRPC / HTTP REST |
| **주요 기능** | 음성-텍스트 변환(STT), 상담 요약, 감성 분석 |

### 6.2 연동 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    AI Service 연동 (v2.1)               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────────┐         gRPC/HTTP        ┌─────────┐ │
│   │   backend   │◄───────────────────────►│ AI Svc  │ │
│   │   (Kotlin)  │                         │(Python) │ │
│   │             │    1. STT 요청           │         │ │
│   │             │◄───────────────────────►│         │ │
│   │             │    2. 상담 요약 요청      │         │ │
│   │             │◄───────────────────────►│         │ │
│   │             │    3. 감성 분석 요청      │         │ │
│   └─────────────┘                         └─────────┘ │
│                                                         │
│   데이터 흐름:                                          │
│   Channel 오디오 ──► AI Service ──► 분석 결과 ──► DB   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 6.3 v2.1 AI 기능 목록

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 실시간 STT | WebRTC 오디오 스트림 → 텍스트 변환 | P0 |
| 상담 요약 | 대화 내용 자동 요약 생성 | P1 |
| 감성 분석 | 고객 감정 상태 분석 | P1 |
| 키워드 추출 | 중요 키워드 자동 추출 | P2 |

---

## 7. Kotlin 코딩 규칙

**기본 원칙:**
- **Kotlin 공식 코딩 컨벤션 준수 (https://kotlinlang.org/docs/coding-conventions.html)**
- **네이밍**:
  - 변수/함수: `camelCase`
  - 클래스: `PascalCase`
  - 상수: `UPPER_SNAKE_CASE`
  - JSON 필드: `camelCase`
  - REST API URL 경로: `kebab-case` (예: /blog-posts, /user-profiles) 
- **공통**
  - 와일드카드 import 금지: import * 절대 사용하지 않는다. 모든 import는 명시적으로 작성한다
  - import 정렬: 린터 자동 정렬에 위임 (ktlint)

**클래스 구조:**

```kotlin
// 상수
private const val MAX_RETRY_COUNT = 3

// 클래스 선언
class ChannelService(
    private val repository: ChannelRepository,
    private val eventPublisher: EventPublisher
) {
    // 프로퍼티
    private val logger = LoggerFactory.getLogger(javaClass)
    
    // public 함수
    fun createChannel(request: CreateChannelRequest): Mono<Channel> {
        return validate(request)
            .flatMap { saveChannel(it) }
            .doOnSuccess { publishEvent(it) }
    }
    
    // private 함수
    private fun validate(request: CreateChannelRequest): Mono<CreateChannelRequest> {
        // 검증 로직
    }
}
```

**함수 작성 규칙:**
- 함수는 한 가지 일만 수행
- 매개변수는 4개 이하로 제한
- 긴 파라미터 목록은 빌더 패턴 사용

**Reactive 코드 스타일:**

```kotlin
// Good: 체이닝을 활용한 가독성
fun getActiveChannels(): Flux<Channel> {
    return channelRepository.findByStatus(ChannelStatus.ACTIVE)
        .filter { it.participants.isNotEmpty() }
        .sort(compareBy { it.createdAt })
        .take(100)
}

// Good: 에러 처리 명시
fun findChannelById(id: String): Mono<Channel> {
    return channelRepository.findById(id)
        .switchIfEmpty(Mono.error(ChannelNotFoundException(id)))
        .onErrorMap { ex -> 
            ChannelServiceException("Failed to find channel: ${ex.message}", ex) 
        }
}
```

---

## 8. 백엔드 명령어

### 8.1 빌드 명령어

```bash
# 프로젝트 빌드
./gradlew clean build

# 특정 모듈 빌드
./gradlew :api:build
./gradlew :admin:build
./gradlew :lib-channel:build

# 테스트 실행
./gradlew test

# 특정 모듈 테스트
./gradlew :lib-channel:test
./gradlew :lib-user:test

# 코드 커버리지 리포트
./gradlew jacocoTestReport

# 의존성 트리 확인
./gradlew dependencies

# Kotlin 코드 스타일 체크
./gradlew ktlintCheck

# Kotlin 코드 스타일 자동 수정
./gradlew ktlintFormat
```

### 8.2 애플리케이션 실행

```bash
# ⚠️ 현재 blocked - 애플리케이션 진입점이 구현되지 않음
# ./gradlew :api:run
# ./gradlew :admin:run
#
# 상세:
# - ApiApplicationKt (com.rsupport.remote.api) 미구현
# - AdminApplicationKt (com.rsupport.remote.admin) 미구현
# - 따라서 DB 연결 검증도 현재 불가
```

**현재 상태:**
| 기능 | 상태 | 비고 |
|------|------|------|
| `./gradlew build` | ✅ 작동 | 모든 모듈 빌드 성공 |
| `./gradlew test` | ✅ 작동 | 테스트 실행 가능 |
| `./gradlew ktlintCheck` | ✅ 작동 | 코드 스타일 검사 |
| `./gradlew ktlintFormat` | ✅ 작동 | 자동 코드 정렬 |
| `./gradlew :api:run` | ❌ 차단 | ApiApplicationKt 미구현 |
| `./gradlew :admin:run` | ❌ 차단 | AdminApplicationKt 미구현 |

후속 구현 이후 실제 앱 레벨 DB 연결 검증 절차는
`../05-implementation/backend-db-connection-followup.md` 문서를 따릅니다.

### 8.3 테스트 실행

```bash
# 모든 테스트 실행
./gradlew test

# 특정 모듈 테스트
./gradlew :core:test
./gradlew :lib-user:test
./gradlew :lib-channel:test
./gradlew :lib-chat:test
./gradlew :lib-signaling:test
./gradlew :lib-file:test

# 테스트 리포트 확인
./gradlew jacocoTestReport
# 리포트 위치: {module}/build/reports/jacoco/test/html/index.html

# CI 빌드 스크립트 사용
../scripts/build-backend.sh
```

### 8.4 CI 빌드 스크립트

```bash
# 루트 디렉토리에서 실행
./scripts/build-backend.sh
```

스크립트 실행 내용:
1. Gradle wrapper 검증
2. ktlint 체크
3. 전체 빌드 (`./gradlew build`)
4. 테스트 실행

---

## 9. 자주 발생하는 문제

| 문제 | 원인 | 해결책 |
|------|------|--------|
| **MongoDB 조회 지연** | 인덱스 부재 | 적절한 인덱스 생성 |
| **메모리 누수** | Reactive Stream 미종료 | `Disposable` 정리 |
| **빌드 실패** | Gradle 캐시 | `./gradlew clean` 후 재시도 |
| **CORS 오류** | 허용 오리진 설정 | `application.yml` 확인 |

### 9.1 MongoDB 조회 지연

**증상:** 쿼리 응답 시간이 예상보다 오래 걸림

**원인:**
- 적절한 인덱스가 없는 경우
- 대량의 데이터 스캔

**해결책:**
```bash
# 인덱스 생성 예시
db.chat_messages.createIndex({ channelId: 1, createdAt: -1 })

# 쿼리 실행 계획 확인
.EXPLAIN("executionStats")
```

### 9.2 메모리 누수 (Reactive Stream)

**증상:** 장시간 실행 후 메모리 사용량 증가

**원인:**
- `Disposable` 객체가 해제되지 않음
- 무한 스트림에서 take() 미사용

**해결책:**
```kotlin
// Good: Disposable 관리
val disposable = service.findAll()
    .take(100)  // 반드시 limit 설정
    .subscribe()

// 컴포넌트 종료 시 정리
disposable.dispose()
```

### 9.3 빌드 실패 (Gradle 캐시)

**증상:** 이상하게도 빌드가 실패하거나 클래스를 찾을 수 없음

**해결책:**
```bash
# Gradle 캐시 정리
./gradlew clean

# 완전한 재빌드
./gradlew clean build --refresh-dependencies
```

### 9.4 CORS 오류

**증상:** 프론트엔드에서 API 호출 시 CORS 에러 발생

**원인:**
- `application.yml`의 CORS 설정 누락
- 잘못된 allowed-origins 설정

**해결책:**
```yaml
# application.yml
cors:
  allowed-origins:
    - http://localhost:3000
    - https://your-domain.com
  allowed-methods: GET, POST, PUT, DELETE, OPTIONS
  allowed-headers: "*"
  allow-credentials: true
```

---

## 10. 용어 표준 (Glossary)

| 용어 | 정의 | 사용 맥락 |
|------|------|-----------|
| **Channel** | 실시간 상담이 이루어지는 세션 공간 | Aggregate Root |
| **RoomCode** | 6자리 숫자 코드 (예: 123456) | Value Object, 입장용 |
| **Session** | Channel의 활성 상태 | 상태 관리 |
| **Consultation** | 상담 이력/기록 | Query Model (MongoDB) |
| **Endpoint** | Channel 참여자 (Agent/Guest) | WebRTC 용어 |

> **참고**: 기존 문서의 "Room", "ConsultationSession" 등은 모두 "Channel"로 통일되었습니다.

---

## 11. 알려진 제한사항

| 제한사항 | 설명 | 해결 예정 |
|----------|------|-----------|
| **애플리케이션 실행 불가** | `api`와 `admin` 서비스의 진입점 클래스가 미구현되어 `./gradlew :api:run`, `./gradlew :admin:run` 실패 | v2.0 개발 진행 시 해결 |
| **DB 연결 검증 불가** | 애플리케이션 실행이 차단되어 런타임 DB 연결 검증 불가 | 진입점 구현 후 가능 |

---

> **문서 버전**: 2.0.1  
> **마지막 업데이트**: 2026-03-12
