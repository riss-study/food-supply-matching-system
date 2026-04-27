# Phase 3 Task B — SSE 기반 실시간 채팅

## 메타데이터

| 항목 | 값 |
|------|-----|
| Task ID | P3-B |
| Wave | 2 (실시간 기능) |
| 우선순위 | P1 |
| 기간 | 1 세션 예상 (~5h) |
| 스토리 포인트 | 8 |
| 상태 | 🔴 **Pending** |
| Blocks | Phase 3 Phase 2 (글로벌 알림), Phase 3 Web Push |
| Blocked By | 없음 (단일 인스턴스 가정) |

## 배경 / 결정 근거

현재 thread 메시지 갱신은 React Query 의 `refetchInterval` 기반 polling. 단점:

1. **지연** — 폴링 간격만큼 메시지 도착 지연 (3-5초)
2. **불필요한 트래픽** — 새 메시지 없어도 매 N초 GET 호출
3. **확장성 제한** — 사용자 N 명 × 폴링 빈도 = 서버 부하 선형 증가

채팅 실시간성을 정석으로 해결. 3가지 옵션 검토:

| 옵션 | 채택 여부 | 이유 |
|---|---|---|
| WebSocket (raw) | ❌ | 양방향 stream 불필요 (텍스트 채팅은 보내기 = POST 1회 + 받기 = stream). 코드 복잡도 ↑ |
| RSocket | ❌ | 클라이언트 ecosystem 약함, 학습 곡선, 오버스펙 |
| STOMP over WebSocket | ❌ | WebFlux 미지원 (Servlet 전용) |
| **SSE (Server-Sent Events)** | ✅ | WebFlux native (`Flux<ServerSentEvent>`), 자동 재연결, HTTP 그대로라 프록시 친화 |

채팅 use case 특성 (텍스트 위주, 분당 0-10건, 모바일 native 앱 없음, 양방향 socket 불필요) 에 SSE 가 정확히 맞음.

## 범위

### 포함 (Phase 1)
- Thread 페이지 안에서 실시간 메시지 수신
- 자기/상대방 메시지 모두 SSE echo
- 첨부 파일 메시지 동일 처리
- 권한 검증 (thread 참여자만 subscribe)
- 자동 재연결 (브라우저 native + polyfill)
- 단일 인스턴스 in-memory `Sinks.Many`

### 제외 (별도 task)
- ❌ 다른 페이지에서 toast 알림 (Phase 3-C: 글로벌 알림 stream)
- ❌ 브라우저 닫혀있을 때 OS 알림 (Phase 3-D: Web Push API + Service Worker + VAPID)
- ❌ 다중 인스턴스 broadcast (P1 backlog: Redis pub/sub 으로 InMemoryThreadStreamService 교체)
- ❌ 모바일 native 푸시 (별도 sprint, APNs/FCM)
- ❌ 타이핑 표시 / 읽음 상태 실시간 동기화 (이벤트 타입은 추가 가능하게 sealed class 로 미리 만들지만 실제 발행은 Phase 4+)

## 아키텍처

```
[ 사용자 A 브라우저 ]                                    [ 사용자 B 브라우저 ]
        │                                                       │
        │ POST /api/threads/{id}/messages                        │ GET /api/threads/{id}/stream
        │ (메시지 보내기)                                          │ (SSE 연결 유지)
        ↓                                                       ↑
[ ThreadController.sendMessage ]                  [ ThreadStreamController.stream ]
        │                                                       │
        ↓                                                       │
[ ThreadApplicationService.sendMessage ]                        │
        │ 1. command 호출 (DB 저장)                               │
        │ 2. response 변환                                        │
        │ 3. doOnNext { ThreadStreamService.publish(...) } ──────┤
        │                                                       │
        ↓                                                       │
[ ThreadStreamService (interface) ]                             │
        ↑                                                       │
        │ in-memory: ConcurrentHashMap<threadId, Sinks.Many>     │
        │ (Phase 1) → 다중 인스턴스 시점에 Redis pub/sub 으로 교체   │
        │                                                       │
        └───────────────────────────────────────────────────────┘
                       구독자에게 fan-out
```

### 핵심 설계 원칙

1. **interface 추상화**: `ThreadStreamService` 가 추상. 시작은 `InMemoryThreadStreamService`. 다중 인스턴스 시점에 `RedisThreadStreamService` 로 교체 (DI 만 변경).
2. **publish 는 best-effort**: `doOnNext` 안에서 호출 → publish 실패해도 메시지 저장은 성공. 정합성 우선.
3. **이벤트 타입 sealed class**: `NewMessage` 만 시작, 향후 `TypingIndicator` / `ContactShareUpdate` 등 추가 시 클라이언트 호환 보장.
4. **자기 메시지 dedup**: 보낸 사람의 SSE 도 echo 받음 → frontend 가 messageId 로 dedup.

## 단계별 작업

### Stage 1. 백엔드 — 도메인 이벤트 + Stream 서비스 추상화 (~30분)

**신규 파일**:
- `backend/api-server/src/main/kotlin/dev/riss/fsm/api/thread/ThreadStreamEvent.kt`
- `backend/api-server/src/main/kotlin/dev/riss/fsm/api/thread/ThreadStreamService.kt`

```kotlin
sealed class ThreadStreamEvent {
    abstract val type: String
    /** SSE id 헤더 용. NewMessage 면 messageId, heartbeat 등 dedup 무관 이벤트는 null. */
    abstract fun eventIdOrNull(): String?

    data class NewMessage(
        // 코드 베이스의 실제 DTO 명칭 (ThreadDtos.kt:84). MessageResponse 가 아님.
        val message: ThreadMessageResponse,
    ) : ThreadStreamEvent() {
        override val type = "NewMessage"
        override fun eventIdOrNull() = message.messageId
    }
    // 미래 확장: TypingIndicator, ContactShareUpdate 등
}

/**
 * publish 가 Mono<Void> 인 이유:
 *   InMemoryThreadStreamService 는 sync (Sinks.tryEmitNext) 라 즉시 완료.
 *   향후 RedisThreadStreamService 로 교체 시 redis publish 가 비동기 → 동일 시그니처 유지로 caller 변경 불필요.
 */
interface ThreadStreamService {
    fun subscribe(threadId: String): Flux<ThreadStreamEvent>
    fun publish(threadId: String, event: ThreadStreamEvent): Mono<Void>
}

@Component
@ConditionalOnProperty(name = ["fsm.stream.backend"], havingValue = "memory", matchIfMissing = true)
class InMemoryThreadStreamService : ThreadStreamService {
    private val sinks = ConcurrentHashMap<String, Sinks.Many<ThreadStreamEvent>>()

    override fun subscribe(threadId: String): Flux<ThreadStreamEvent> {
        val sink = sinks.computeIfAbsent(threadId) {
            // 256: emit buffer cap (초과 시 oldest drop 또는 backpressure 시그널).
            // false: autoCancel 비활성 — 마지막 구독자 떠나도 sink 가 자동 종료되지 않음
            //   (지연 cleanup 코드가 직접 정리. 짧은 재연결 갭 보호).
            Sinks.many().multicast().onBackpressureBuffer<ThreadStreamEvent>(256, false)
        }
        return sink.asFlux()
            .doFinally {
                // 마지막 구독자 떠난 후 30초 지연 cleanup (재연결 짧은 갭 보호).
                // Schedulers.parallel() 에서 sinks 의 currentSubscriberCount 검사.
                Schedulers.parallel().schedule({
                    sinks[threadId]?.let { s -> if (s.currentSubscriberCount() == 0) sinks.remove(threadId) }
                }, 30, TimeUnit.SECONDS)
            }
    }

    override fun publish(threadId: String, event: ThreadStreamEvent): Mono<Void> {
        return Mono.fromRunnable { sinks[threadId]?.tryEmitNext(event) }
    }
}
```

### Stage 2. 백엔드 — SSE Controller + 권한 검증 (~30분)

**신규 파일**: `backend/api-server/src/main/kotlin/dev/riss/fsm/api/thread/ThreadStreamController.kt`

**선결 작업** (같은 Stage 안 미니 step):
- `ThreadApplicationService` 의 `loadAccessibleThread` 가 `private` 라 외부 호출 불가 (`ThreadApplicationService.kt:411`).
- 두 옵션 중 택일:
  - **(a) 가시성 변경**: `private fun loadAccessibleThread(...)` → `internal fun loadAccessibleThread(...)`.
  - **(b) public 헬퍼 신규 추가** (권고):
    ```kotlin
    /** Stream / 신규 endpoint 등 외부에서 권한만 검증하고 싶을 때. ADMIN override 시 audit 자동. */
    fun ensureParticipant(principal: AuthenticatedUserPrincipal, threadId: String): Mono<Void> =
        loadAccessibleThread(principal, threadId).then()
    ```
  → (b) 채택. controller 가 `Mono<Void>` 받아 `.thenMany(stream)` 으로 chain.

권한 검증 (참여자 only, ADMIN override 시 audit) 은 기존 `loadAccessibleThread` 재사용:

```kotlin
@RestController
@SecurityRequirement(name = "bearerAuth")
class ThreadStreamController(
    private val threadStreamService: ThreadStreamService,
    private val threadApplicationService: ThreadApplicationService,
) {
    @GetMapping("/api/threads/{threadId}/stream", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun stream(
        @PathVariable threadId: String,
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        exchange: ServerWebExchange,
    ): Flux<ServerSentEvent<ThreadStreamEvent>> {
        // nginx/CloudFront 의 SSE buffering 회피 — 프록시 단에서 frame 쌓아두지 않게.
        exchange.response.headers.set("X-Accel-Buffering", "no")

        return threadApplicationService.ensureParticipant(principal, threadId)   // 비참여자 → ThreadAccessDeniedException(403)
            .thenMany(threadStreamService.subscribe(threadId))
            .map { event ->
                ServerSentEvent.builder<ThreadStreamEvent>()
                    .id(event.eventIdOrNull())   // NewMessage 면 messageId, 그 외 null (Last-Event-ID 용)
                    .event(event.type)
                    .data(event)
                    .build()
            }
            .mergeWith(heartbeat())
    }

    /** 30초마다 콜론 prefix 의 comment frame — SSE 표준상 client 는 ignore. id 미부여 → polyfill 의 lastEventId 갱신 안 됨 (의도). */
    private fun heartbeat(): Flux<ServerSentEvent<ThreadStreamEvent>> =
        Flux.interval(Duration.ofSeconds(30))
            .map { ServerSentEvent.builder<ThreadStreamEvent>().comment("heartbeat").build() }
}
```

**주의**: `ensureParticipant` 는 기존 `loadAccessibleThread` (`ThreadApplicationService.kt:411`) 재사용 — `Mono<MessageThreadEntity>` 를 받아 인증 통과 시 stream 으로 전환. 비참여자는 `ThreadAccessDeniedException` 던져 GlobalExceptionHandler 가 4039/403 응답.

### Stage 3. 백엔드 — sendMessage 후 publish hook (~20분)

**파일**: `backend/api-server/src/main/kotlin/dev/riss/fsm/api/thread/ThreadApplicationService.kt`

**현재 chain 구조 (`ThreadApplicationService.kt:206-235`)**:

```kotlin
fun sendMessage(...): Mono<SendThreadMessageResponse> {
    return loadParticipantContext(principal)
        .flatMap { context ->
            loadAccessibleThread(principal, threadId).flatMap { _ ->
                validateAttachmentIds(threadId, request.attachmentIds.orEmpty())
                    .then(threadCommandService.sendMessage(SendMessageCommand(...)))
            }
        }
        .map { message ->
            SendThreadMessageResponse(messageId = ..., threadId = ..., createdAt = ...)
        }
}
```

**변경 — 외곽 chain 그대로 유지, 두 군데만 손봄**:

1. inner `loadAccessibleThread.flatMap { _ -> ... }` 의 underscore 를 `thread` 로 (publish 시 toMessageResponse 의 첫 인자로 필요).
2. 마지막 `.map { ... → response }` 를 `.flatMap { ... → publishStep.then(Mono.just(response)) }` 로 교체.

```kotlin
fun sendMessage(...): Mono<SendThreadMessageResponse> {
    return loadParticipantContext(principal)
        .flatMap { context ->
            loadAccessibleThread(principal, threadId).flatMap { thread ->     // _ → thread
                validateAttachmentIds(threadId, request.attachmentIds.orEmpty())
                    .then(threadCommandService.sendMessage(SendMessageCommand(...)))
                    .flatMap { message ->                                     // .map → .flatMap
                        // SSE event 용 상세 response 만들고 publish (best-effort)
                        val publishStep = toMessageResponse(thread, message)
                            .flatMap { detail ->
                                threadStreamService.publish(threadId, ThreadStreamEvent.NewMessage(detail))
                            }
                            .onErrorResume { Mono.empty() }   // publish 실패해도 저장 응답은 보내야 함

                        // 기존 controller 응답 (간단 3필드) 만들고 publish 끝난 뒤 반환
                        publishStep.then(Mono.just(SendThreadMessageResponse(
                            messageId = message.messageId,
                            threadId = message.threadId,
                            createdAt = message.createdAt.toInstant(ZoneOffset.UTC),
                        )))
                    }
            }
        }
}
```

**검증 포인트**:
- 권한 검증 (`loadAccessibleThread`) / 첨부 검증 (`validateAttachmentIds`) 그대로 유지 → 회귀 0.
- `Mono<Void>.then(Mono<T>): Mono<T>` 시그니처라 `publishStep.then(Mono.just(...))` 정상.
- publish 가 실패해도 `Mono.empty()` 로 흡수되어 controller 응답은 정상 반환.

### Stage 4. (Stage 2 에 흡수)

권한 검증은 Stage 2 의 controller 안에서 `ThreadApplicationService.ensureParticipant` 호출로 이미 처리. 별도 Stage 불필요.

### Stage 5. 프론트엔드 — 의존성 + 훅 (~45분)

**의존성**:
```bash
yarn workspace @fsm/main-site add @microsoft/fetch-event-source
```

이유: native `EventSource` 가 Authorization 헤더 못 보냄. Microsoft 공식 polyfill 이 fetch API 기반이라 헤더/abort/재연결 모두 지원.

**신규 파일**: `frontend/apps/main-site/src/features/threads/hooks/useThreadStream.ts`

핵심 패턴:
- 기존 `useThreadDetail.ts` 의 **`addMessageToCache(message)` 재사용** — dedup + `updatedAt` 갱신이 한 곳에서 일관 처리됨.
- `addMessageToCache` 가 `useCallback` 으로 안정 reference 라 useEffect deps 에 안전히 포함 가능.

**선결 작업** (Stage 5 의 첫 단계): `useThreadDetail.ts:16-28` 의 `addMessageToCache` 는 현재 `messages: [...old.messages, message]` 로 **dedup 없이 단순 append**. SSE echo 가 자기 메시지 send POST 의 onSuccess 와 충돌하면 중복 표시 발생. **dedup 가드 추가 필수**:

```ts
const addMessageToCache = useCallback(
  (message: ThreadMessage) => {
    queryClient.setQueryData<ThreadDetail>(threadKeys.detail(threadId), (old) => {
      if (!old) return old
      // dedup: 같은 messageId 이미 있으면 무시 (자기 메시지 echo / 재연결 시 중복 수신 방지)
      if (old.messages.some((m) => m.messageId === message.messageId)) return old
      return {
        ...old,
        messages: [...old.messages, message],
        updatedAt: message.createdAt,
      }
    })
  },
  [queryClient, threadId],
)
```

이 한 번 변경 후 `addMessageToCache` 는 send POST onSuccess + SSE echo 양쪽에서 안전히 사용 가능.

```ts
import { useEffect } from "react"
import { fetchEventSource } from "@microsoft/fetch-event-source"
import { useAuthStore } from "../../auth/store/auth-store"
import type { ThreadMessage } from "@fsm/types"

export function useThreadStream(
    threadId: string,
    addMessageToCache: (msg: ThreadMessage) => void,   // useThreadDetail 에서 받아옴
) {
    const accessToken = useAuthStore((s) => s.accessToken)

    useEffect(() => {
        if (!threadId || !accessToken) return
        const ctrl = new AbortController()

        fetchEventSource(`/api/threads/${threadId}/stream`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: ctrl.signal,
            openWhenHidden: true,
            async onopen(res) {
                if (res.ok && res.headers.get("content-type")?.includes("text/event-stream")) return
                throw new Error(`SSE open failed: ${res.status}`)
            },
            onmessage(ev) {
                if (!ev.data) return
                const event = JSON.parse(ev.data)
                if (event.type === "NewMessage") {
                    addMessageToCache(event.message as ThreadMessage)   // dedup + updatedAt 갱신은 helper 내부에서
                }
            },
            onerror(err) {
                if (ctrl.signal.aborted) throw err   // 의도적 abort 면 종료. 그 외 자동 재연결.
            },
        })

        return () => ctrl.abort()
    }, [threadId, accessToken, addMessageToCache])
}
```

**ThreadDetailPage 사용 형태 (Stage 6)**:
```ts
const { data, addMessageToCache } = useThreadDetail(threadId, params)
useThreadStream(threadId, addMessageToCache)
```

**accessToken 갱신 시 자동 재연결**: useEffect 의 deps 에 `accessToken` 포함. refresh 후 새 토큰으로 자동 abort + 재연결 → 토큰 만료 처리 자연스럽게 됨.

### Stage 6. 프론트엔드 — ThreadDetailPage 적용 (~30분)

**파일**: `frontend/apps/main-site/src/features/threads/pages/ThreadDetailPage.tsx`

- 기존 `useThreadMessages` 의 `refetchInterval` 옵션 제거 (or 비상용으로 30s 유지)
- 컴포넌트 안에 `useThreadStream(threadId)` 호출 추가
- 메시지 보내기 mutation 의 onSuccess 는 그대로 (자기 메시지는 SSE 로도 echo, dedup 으로 처리)

### Stage 7. 백엔드 단위 테스트 (~45분)

- `InMemoryThreadStreamServiceTest`:
  - subscribe 후 publish → 받음
  - 다수 구독자 → 모두 받음 (multicast)
  - 구독자 0 → publish 무사고 (drop OK)
  - **마지막 구독자 unsubscribe 후 30s 지연 → sink cleanup** (StepVerifier 의 virtual time)
  - **buffer 초과 (257번째 publish 까지 backpressure 시 drop 정책 검증)**
  - 동일 thread 의 여러 구독자가 같은 sink 공유 (메모리 효율)
- `ThreadStreamControllerTest` (WebTestClient):
  - 비참여자 → 403/4039
  - 미인증 → 401/4011
  - 잘못된 threadId → 404/4041
  - 참여자 → 200 + content-type `text/event-stream` + `X-Accel-Buffering: no` 헤더
  - publish 후 client 가 event 수신 (StepVerifier)

### Stage 8. 프론트엔드 테스트 (~30분)

- `useThreadStream.test.tsx`:
  - mock fetchEventSource 의 onmessage 콜백 강제 호출 → React Query cache 업데이트 확인
  - dedup: 같은 messageId 두 번 → 한 번만 추가 (자기 메시지 echo + 재연결 후 첫 GET 중복 시나리오)
  - accessToken 변경 시 abort + 재구독 (useEffect deps 재발화)
  - cleanup: unmount 시 AbortController.abort 호출
- 기존 ThreadDetailPage 통합 테스트는 그대로

### Stage 9. smoke 검증 (~30분)

- 두 브라우저 (buyer / supplier 로그인) → 한 쪽 메시지 발송 → 다른 쪽 화면 1초 이내 표시
- 첨부 파일 메시지 동일
- 비참여자 (다른 buyer) 가 stream 접근 → 403
- 네트워크 끊고 재연결 → 자동 재연결, 끊긴 동안 메시지는 첫 GET 으로 복구
- 페이지 떠나기 → connection cancel (Network 탭 확인)

## 위험 / 주의사항

| 위험 | 가능성 | 대응 |
|---|---|---|
| Sinks 메모리 leak (구독자 0 후 sink 잔존) | 중 | 마지막 unsubscribe 시 일정 시간 후 sink 제거 (지연 cleanup) |
| WebFlux netty 의 connection 한도 | 낮 | netty non-blocking 이라 수만 OK. 운영 가서 부하 모니터링 |
| 다중 인스턴스 broadcast 안 됨 | 중 | Phase 1 가정 단일. 운영 다중화 시점에 Redis pub/sub 교체 (P1 backlog) |
| nginx/CloudFront idle timeout (60s 기본) | 중 | heartbeat 30s + 운영 reverse proxy `proxy_read_timeout 24h` 설정 |
| 같은 사용자 여러 탭 동시 stream | 낮 | 각 탭 별 connection. 정상 (둘 다 받음) |
| 자기 메시지 SSE echo 중복 표시 | 중 | messageId 기반 dedup |
| 인증 만료 시 stream 안 끊김 (stateless JWT) | 중 | 최초 연결 시점에만 Bearer 검증. stream 진행 중 토큰 만료/로그아웃이 즉시 끊지 못함. 클라이언트가 access token 갱신 시 useEffect deps 재발화로 자동 abort + 재연결. 운영 보안 강화 시 BE 측 `Mono.delay(tokenExpiresAt - now).then(close)` 추가 검토 (별도 backlog). |
| 브라우저 EventSource 호환 | 0 | polyfill `@microsoft/fetch-event-source` 사용. 모든 모던 브라우저 OK |
| **메시지 ordering 비결정** | 낮 | 두 사용자 동시 send 시 Sinks 의 emit 순서와 client 도착 순서는 backend 단일 thread 가정 유지 시 OK. **frontend 가 `createdAt` + `messageId` 로 정렬 보강** 권고 (Stage 6 에 명시). |
| **동일 사용자 무한 connection (DoS)** | 중 | 한 토큰으로 1000+ SSE connection 가능 → JVM heap / file descriptor 압박. 운영 reverse proxy 단에서 IP/사용자 별 connection 수 제한 (nginx `limit_conn`). 추가로 백엔드 측 per-user connection 카운터도 검토 (별도 backlog). |
| **JVM graceful shutdown** | 낮 | 활성 SSE 가 수십~수백 시 SIGTERM 받으면 connection close → 클라이언트 자동 재연결. spring-boot 의 `server.shutdown=graceful` + `spring.lifecycle.timeout-per-shutdown-phase=30s` 설정 권고. |
| **Sinks 자체 heap 사용** | 낮 | thread N개 × `Sinks.many()` × buffer 256 → 활성 thread 1만 시 약 ~100MB 추정. 운영 가서 측정 후 maxBufferSize 조정 또는 Redis 이전. |

## 결정 사항

1. **인증**: native EventSource 대신 `@microsoft/fetch-event-source` polyfill 사용 (헤더 인증 그대로) ✅
2. **dedup**: messageId 기반 (별도 client tempId 불필요) ✅
3. **이벤트 타입**: sealed class (`NewMessage` 만 시작, 미래 확장 대비) ✅
4. **commit 단위**: backend (Stage 1-4, 7) + frontend (Stage 5, 6, 8) 두 개 commit 또는 한 번에. **한 번 권고**

## 작업 시간 추정

| Stage | 시간 |
|---|---|
| 1. 도메인 + 서비스 추상화 (interface Mono<Void>, Sinks cleanup) | 30m |
| 2. SSE Controller + 권한 검증 (Stage 4 흡수) | 30m |
| 3. publish hook (toMessageResponse 재사용 + flatMap + onErrorResume) | 20m |
| ~~4~~ | ~~흡수~~ |
| 5. FE 의존성 + 훅 (threadKeys.detail + addMessageToCache 패턴) | 45m |
| 6. FE 페이지 적용 + ordering 보강 (createdAt sort) | 35m |
| 7. BE test (cleanup, buffer overflow, 다양 권한) | 45m |
| 8. FE test (dedup, accessToken 갱신, cleanup) | 30m |
| 9. smoke 검증 (두 브라우저, 재연결, 첨부) | 30m |
| **합계** | **~4h 25m** |

## 후속 task (Phase 3 다음)

- **Phase 3-C**: 글로벌 알림 SSE stream (`/api/notifications/stream`) — 다른 페이지에서 toast
- **Phase 3-D**: Web Push API + Service Worker + VAPID — 브라우저 닫혀있을 때 OS 알림
- **운영 직전**: `InMemoryThreadStreamService` → `RedisThreadStreamService` 교체 + nginx `proxy_read_timeout`

## DoD (Done 기준)

- [ ] 단위 테스트 통과 (backend + frontend)
- [ ] 4 smoke 회귀 (131/131 PASS 유지)
- [ ] 두 브라우저 직접 검증 (1초 이내 메시지 echo)
- [ ] 비참여자 stream 접근 403 확인
- [ ] 네트워크 끊김 후 자동 재연결 확인
- [ ] git commit + push
- [ ] api-spec.md SSE 섹션 업데이트
