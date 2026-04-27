# Phase 3 Task C — 글로벌 알림 stream (사용자별)

## 메타데이터

| 항목 | 값 |
|------|-----|
| Task ID | P3-C |
| Wave | 2 (실시간 알림 확장) |
| 우선순위 | P1 |
| 기간 | 1 세션 예상 (~4h) |
| 상태 | 🔴 **Pending** |
| Blocks | Phase 3 Web Push (P3-D) — 같은 publish 채널 재활용 |
| Blocked By | Phase 3-B (SSE 채팅) — 인프라/패턴 재사용 |

## 배경 / 결정 근거

P3-B 가 끝나면서 thread 페이지 안에서는 SSE 로 메시지 받지만, **다른 페이지 (의뢰 목록, 대시보드 등) 에 있을 때 새 메시지가 와도 사용자가 모름**. 모바일 카톡으로 치면 "채팅방 안에서만 알림 보이는 상태".

해결: 사용자별 **글로벌 알림 SSE stream** 하나 더 추가. 어느 페이지에서든 활성화되어 toast 와 사이드바 unread 뱃지 띄움.

## 범위 (Phase 1)

### 포함
- 새 endpoint `/api/notifications/stream` — 사용자별 (Bearer 토큰의 userId)
- 새 메시지 발생 시 thread stream + 글로벌 알림 stream **양쪽** publish (상대방 userId 의 알림 stream 으로)
- frontend 의 어느 페이지에서든 listen 하는 글로벌 hook (`useNotificationStream`)
- 화면 우측 상단 toast (3-5초 자동 사라짐)
- 사이드바 "메시지" 메뉴의 unread 뱃지 (thread 별 unreadCount 합산)
- thread 페이지 안에서 자기 thread 의 알림은 toast 안 띄움 (이미 보고 있는 thread)

### 제외 (별도 task)
- ❌ Web Push API + Service Worker (Phase 3-D)
- ❌ 모바일 native push (APNs/FCM)
- ❌ 알림 중심 화면 (`/notifications` 라는 list 페이지) — 사이드바 카운트만으로 충분
- ❌ 사용자 알림 환경설정 (mute / 알림 종류 toggle)
- ❌ thread 외 이벤트 (새 견적, admin 공지) — sealed class 로 확장 가능하게만 두고 발행은 추후

## 아키텍처

```
[ 사용자 A 가 supplier 화면에서 "전송" 클릭 ]
        │ POST /api/threads/123/messages
        ↓
[ ThreadApplicationService.sendMessage ]
        │ 1. DB 저장
        │ 2. ThreadStreamService.publish(threadId=123, NewMessage(...))      ← 기존 (P3-B)
        │ 3. NotificationStreamService.publish(userId=상대방, NewMessage(...))  ← 신규 (P3-C)
        │
        ↓
[ NotificationStreamService ]
        │ 사용자별 Sinks.Many<NotificationEvent>
        │
        ├──→ [ 사용자 B 가 의뢰 목록 페이지 보는 중 ]
        │      ↓ /api/notifications/stream (글로벌 hook)
        │      ↓ toast: "(주)서울베이커리: 견적 문의 드립니다"
        │      ↓ 사이드바 메시지 뱃지 +1
        │
        └──→ [ 사용자 B 가 thread 페이지 보는 중 ]
               ↓ 글로벌 hook + thread hook 둘 다 listen
               ↓ thread hook 이 메시지 cache 에 추가 (그 화면 안에서 표시)
               ↓ 글로벌 hook: 자기 thread 의 알림은 toast 생략
```

## 단계별 작업

### Stage 1. 백엔드 — NotificationStreamEvent + Service (~30분)

**신규 파일**:
- `backend/api-server/src/main/kotlin/dev/riss/fsm/api/notification/NotificationStreamEvent.kt`
- `backend/api-server/src/main/kotlin/dev/riss/fsm/api/notification/NotificationStreamService.kt`

P3-B 의 `ThreadStreamEvent` / `ThreadStreamService` 와 동일 패턴, 다만 키가 `userId`.

```kotlin
sealed class NotificationStreamEvent {
    abstract val type: String
    abstract fun eventIdOrNull(): String?

    data class NewMessage(
        val threadId: String,
        val threadTitle: String,           // 의뢰 제목 — toast 표시 용
        val senderUserId: String,
        val senderDisplayName: String,     // "(주)서울베이커리" 등 toast 표시 용
        val preview: String,               // body 첫 60자 또는 "[이미지]" 등
        val messageId: String,
        val sentAt: Instant,
    ) : NotificationStreamEvent() {
        override val type = "NewMessage"
        override fun eventIdOrNull() = messageId
    }
    // 미래: NewQuote, ReviewApproved, AdminAnnouncement 등
}

interface NotificationStreamService {
    fun subscribe(userId: String): Flux<NotificationStreamEvent>
    fun publish(userId: String, event: NotificationStreamEvent): Mono<Void>
}

@Component
@ConditionalOnProperty(name = ["fsm.stream.backend"], havingValue = "memory", matchIfMissing = true)
class InMemoryNotificationStreamService : NotificationStreamService {
    // 사용자별 Sinks. P3-B 의 InMemoryThreadStreamService 와 동일 cleanup / capacity 정책.
}
```

### Stage 2. 백엔드 — SSE Controller (~30분)

**신규 파일**: `backend/api-server/src/main/kotlin/dev/riss/fsm/api/notification/NotificationStreamController.kt`

```kotlin
@GetMapping("/api/notifications/stream", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
fun stream(
    @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
    exchange: ServerWebExchange,
): Flux<ServerSentEvent<NotificationStreamEvent>> {
    exchange.response.headers.set("X-Accel-Buffering", "no")
    return notificationStreamService.subscribe(principal.userId)
        .map { ev ->
            val builder = ServerSentEvent.builder<NotificationStreamEvent>().event(ev.type).data(ev)
            ev.eventIdOrNull()?.let { builder.id(it) }
            builder.build()
        }
        .mergeWith(heartbeat())
}
```

권한 검증 별도 불필요 — `@AuthenticationPrincipal` 가 자동으로 본인의 userId 만 사용.

### Stage 3. 백엔드 — sendMessage 에 글로벌 publish hook 추가 (~45분)

P3-B 의 publishStep 을 확장. **상대방 userId 들** 에게 알림 발송. 두 helper 모두 **`Mono`** (reactive) 라는 점이 핵심 — DB 조회 (`requestRepository`, `supplierProfileRepository`, `businessProfileRepository`) 가 비동기.

#### Helper 1: `computeNotifyTargets`

```kotlin
private fun computeNotifyTargets(thread: MessageThreadEntity, senderUserId: String): Mono<List<String>> {
    val requesterTarget = if (thread.requesterUserId != senderUserId) Mono.just(listOf(thread.requesterUserId)) else Mono.just(emptyList())
    val supplierTarget = supplierProfileRepository.findById(thread.supplierProfileId)
        .map { profile -> if (profile.supplierUserId != senderUserId) listOf(profile.supplierUserId) else emptyList() }
        .defaultIfEmpty(emptyList())
    return Mono.zip(requesterTarget, supplierTarget).map { tuple -> tuple.t1 + tuple.t2 }
}
```

#### Helper 2: `buildNotificationEvent`

```kotlin
private fun buildNotificationEvent(
    thread: MessageThreadEntity,
    message: MessageEntity,
    senderUserId: String,
): Mono<NotificationStreamEvent.NewMessage> {
    val titleMono = requestRepository.findById(thread.requestId)
        .map { it.title }
        .defaultIfEmpty("의뢰")     // 의뢰 삭제/누락 시 fallback

    // 발신자 표시명: senderUserId 가 thread.requesterUserId 면 requester (BusinessProfile),
    //                그 외엔 supplier (SupplierProfile).
    val senderNameMono: Mono<String> = if (senderUserId == thread.requesterUserId) {
        businessProfileRepository.findByUserAccountId(senderUserId)
            .map { it.businessName }
            .defaultIfEmpty("(이름 미상)")
    } else {
        supplierProfileRepository.findById(thread.supplierProfileId)
            .map { it.companyName }
            .defaultIfEmpty("(이름 미상)")
    }

    // Mono.zip 의 .map { tuple -> ... } 패턴 — 코드베이스 컨벤션 (BiFunction 람다 형태는 지양).
    return Mono.zip(titleMono, senderNameMono).map { tuple ->
        NotificationStreamEvent.NewMessage(
            threadId = thread.threadId,
            threadTitle = tuple.t1,
            senderUserId = senderUserId,
            senderDisplayName = tuple.t2,
            preview = buildPreview(message),
            messageId = message.messageId,
            sentAt = message.createdAt.toInstant(ZoneOffset.UTC),
        )
    }
}

/** body 우선, 없으면 attachment placeholder. 60자 초과 시 ellipsis. */
private fun buildPreview(message: MessageEntity): String {
    val body = message.body
    if (!body.isNullOrBlank()) {
        return if (body.length <= 60) body else body.substring(0, 60) + "…"
    }
    val attachmentIds = message.getAttachmentIdList()
    return when {
        attachmentIds.isEmpty() -> ""
        attachmentIds.size == 1 -> "[파일]"   // 단일은 controller 에서 fileName 까지 조회하기 부담. 단순 placeholder.
        else -> "[첨부 ${attachmentIds.size}건]"
    }
}
```

#### `sendMessage` chain 변경

기존 publishStep 을 다음과 같이 확장:

```kotlin
val publishStep = toMessageResponse(thread, message)
    .flatMap { detail ->
        val threadPublish = threadStreamService.publish(threadId, ThreadStreamEvent.NewMessage(detail))

        val notifyStep = Mono.zip(
            computeNotifyTargets(thread, principal.userId),
            buildNotificationEvent(thread, message, principal.userId),
        ).flatMap { tuple ->
            val targets = tuple.t1
            val event = tuple.t2
            Flux.fromIterable(targets)
                .flatMap { uid -> notificationStreamService.publish(uid, event) }
                .then()
        }

        Mono.`when`(threadPublish, notifyStep)
    }
    .onErrorResume { Mono.empty() }   // best-effort. 발행 실패해도 메시지 저장 응답은 보냄.
```

**필드 접근 주의**:
- `MessageThreadEntity.supplierProfileId` 만 있음 (supplierUserId 직접 없음) → 반드시 `supplierProfileRepository.findById(...)` 통해 조회.
- `BusinessProfileEntity.businessName`, `SupplierProfileEntity.companyName` 가 표시명.

### Stage 4. 백엔드 — 단위 테스트 (~30분)

- `InMemoryNotificationStreamServiceTest`: 사용자 A 가 subscribe, 사용자 A 의 publish 받음. 사용자 B 의 publish 는 안 받음.
- `ThreadApplicationServiceTest` 의 sendMessage 시나리오에 — 글로벌 알림 publish 도 호출되는지 mock verify (발신자 제외).

### Stage 5. 프론트엔드 — 의존성 + 알림 store (~45분)

**의존성**: 이미 `@microsoft/fetch-event-source` 있음.

**신규 파일**: `frontend/apps/main-site/src/features/notifications/store/notification-store.ts`

zustand store — 받은 알림 누적 + 사이드바 unread count + toast 큐.

```ts
interface NotificationStore {
  toasts: ToastNotification[]   // 최대 5개 유지, 오래된 거 자동 제거
  unreadByThread: Record<string, number>
  totalUnread: number
  pushToast(toast: ToastNotification): void
  dismissToast(id: string): void
  markThreadAsRead(threadId: string): void
}
```

**신규 파일**: `frontend/apps/main-site/src/features/notifications/hooks/useNotificationStream.ts`

```ts
export function useNotificationStream() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const pushToast = useNotificationStore((s) => s.pushToast)
  const incrementUnread = useNotificationStore((s) => s.incrementUnread)
  const location = useLocation()

  useEffect(() => {
    if (!accessToken || !user) return
    const ctrl = new AbortController()

    fetchEventSource("/api/notifications/stream", {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: ctrl.signal,
      openWhenHidden: true,
      onmessage(ev) {
        const event = JSON.parse(ev.data)
        if (event.type === "NewMessage") {
          // 자기가 지금 보고 있는 thread 의 알림이면 toast 생략 (이미 화면에 보임)
          const onThisThread = location.pathname === `/threads/${event.threadId}`
          if (!onThisThread) {
            pushToast({ ... })
          }
          incrementUnread(event.threadId)
        }
      },
      // ...
    })
    return () => ctrl.abort()
  }, [accessToken, user, ...])
}
```

### Stage 6. 프론트엔드 — Toast UI 컴포넌트 + App 레벨 hook 호출 (~45분)

**신규 컴포넌트**: `frontend/apps/main-site/src/features/notifications/components/ToastContainer.tsx`

화면 우측 상단 fixed position. 최대 5개 stack. 각 toast 클릭하면 thread 페이지로 이동.

**selector 정책**: 기존 e2e 가 `data-testid` 미사용이지만, toast 같은 단명 / 자동 사라지는 요소는 의미 기반 selector (`getByRole`/`getByText`) 만으로는 다른 alert 와 충돌 가능. 안정성 차원에서 `<div role="alert" className="toast-notification">` 으로 두 가지 selector 모두 호환되게 만듦. e2e 는 `getByRole("alert")` 우선 사용.

#### 정확한 mount 위치

`App.tsx` 가 별도 Layout 분리 없이 main-shell + header + nav + Routes 모두 포함하는 단일 파일.

- **`useNotificationStream()` 호출**: App 컴포넌트 본문 상단 (Routes 보다 위, hook 규칙 위반 안 되게 conditional 안 됨 → hook 내부에서 `if (!accessToken || !user) return` 단락).
- **`<ToastContainer />` mount**: `<main className="main-content">` 직전 (header 다음). fixed positioning 이라 위치 영향 적지만 z-index 충돌 방지 + 명확성.
- **Sidebar unread 뱃지**: App.tsx 의 `requesterNav` / `supplierNav` 배열 안 `t("nav.messages")` Link 옆. 별도 `<MessagesNavLink>` 컴포넌트로 추출 (zustand store 의 `totalUnread` 구독). 단순 렌더링이라 React.memo 불필요.

#### thread 진입 시 unread reset

`ThreadDetailPage` 의 mount effect 에서 `markThreadAsRead` mutation 성공 후 store 의 `clearUnread(threadId)` 호출. 또는 `useThreadDetail` 의 query success effect 에서. 결정: **`ThreadDetailPage` 의 mount effect** — markThreadAsRead 와 한 곳에서 일관 처리.

### Stage 7. 프론트엔드 — 단위 테스트 (~30분)

- `notification-store.test.ts`: store 의 push/dismiss/markRead 동작
- `useNotificationStream.test.tsx`: mock fetchEventSource → store 갱신 검증
- 같은 thread 페이지에선 toast 안 뜨는 분기 검증

### Stage 8. e2e Playwright 검증 (~30분)

신규 spec: `e2e/notification-stream.spec.ts`

`ToastContainer` 의 toast 요소에 `data-testid="toast-notification"` 부여 — Playwright selector 안정성.

시나리오:

1. **다른 페이지에서 toast** — supplier 가 dashboard 보는 중 buyer 가 메시지
   ```ts
   await expect(supplierPage.getByTestId("toast-notification")).toBeVisible({ timeout: 5000 })
   ```
2. **thread 페이지 안에선 toast 생략** — supplier 가 그 thread 안에 있을 때 buyer 메시지
   ```ts
   // thread 메시지 자체는 표시 (P3-B 동작)
   await expect(supplierPage.getByText(uniqueText)).toBeVisible({ timeout: 5000 })
   // toast 는 5초 내 안 뜸 (negative assertion)
   await expect(supplierPage.getByTestId("toast-notification")).toHaveCount(0, { timeout: 3000 })
   ```
3. **자기 메시지엔 알림 없음** — buyer 가 다른 페이지에서 자기 메시지 발송
   ```ts
   await sendMessageViaApi(buyerToken, threadId, ...)   // backend POST 직접
   // 자기 brower 에 toast 안 옴
   await expect(buyerPage.getByTestId("toast-notification")).toHaveCount(0, { timeout: 3000 })
   ```

### Stage 9. smoke regression + commit + push

기존 4 smoke 131/131 유지 확인. 새 endpoint 추가만이라 회귀 영향 없음.

## 위험 / 주의사항

| 위험 | 대응 |
|---|---|
| 글로벌 stream + thread stream 중복 listen 시 메시지 중복 표시 | thread hook 만 cache 에 message 추가, 글로벌 hook 은 toast 만 (역할 분리) |
| 자기 메시지 자기에게 알림 | computeNotifyTargets 가 발신자 userId 제외 |
| 자기가 보고 있는 thread 의 toast | location.pathname 으로 분기. URL 변경 시 자동 |
| Notification stream 다중 인스턴스 | P3-B 와 동일 — Redis pub/sub 이전 (P1 backlog) |
| BusinessProfile/SupplierProfile 조회 비용 (메시지마다) | thread 객체에 사전 조회된 senderDisplayName 캐시 또는 메시지 발송 chain 안에서 한 번 조회 |
| 발신자/의뢰 정보 조회 실패 (없음) | `defaultIfEmpty("(이름 미상)")` / `defaultIfEmpty("의뢰")` 로 fallback. publishStep 자체는 `.onErrorResume(Mono.empty())` 로 메시지 저장 응답 보호. |
| Sinks 메모리 — P3-B + P3-C 합산 | thread 별 sink (P3-B) + 사용자 별 sink (P3-C). 활성 사용자 N + 활성 thread M 합산. JVM heap 으로 통상 5,000명 동시까지 무리 없음. 임계 도달 시 Redis pub/sub 으로 이전 (P1 backlog 우선순위 상향). |
| sendMessage 응답 시간 미세 증가 (~10ms, DB 조회 3건 추가) | reactive 라 thread block 없음. 기존 timing-sensitive 테스트 영향 없는지 Stage 4 단위 테스트로 회귀 확인. |
| toast 폭주 (스팸 메시지) | store 의 max 5개 유지 + 같은 thread 의 toast 는 합치기 (선택, MVP 에서는 단순 큐) |
| logout 시 stream cleanup | accessToken null → useEffect cleanup → AbortController.abort |
| 페이지 떠날 때 unread 갱신 안 됨 | 페이지 진입 시 markRead. 글로벌 stream 은 페이지 무관이라 OK |

## 결정 사항

1. **Stream 분리 vs 통합**: thread stream (P3-B) + 알림 stream (P3-C) **두 개 모두 유지**. ThreadDetailPage 는 양쪽 listen, 알림 hook 이 location 기반 toast 분기. 단순함.
2. **알림 페이로드**: 글로벌은 thread title / senderDisplayName / preview 포함 (toast 표시 용). thread stream 은 full ThreadMessageResponse.
3. **unread 카운트 방식**: frontend 측 derive (zustand). backend `markThreadAsRead` (기존) 후 thread 진입 시 store 의 unreadByThread 갱신.
4. **toast 라이프사이클**: 5초 자동 사라짐, 클릭 시 thread 이동, 최대 5개 stack.

## 작업 시간 추정

| Stage | 시간 |
|---|---|
| 1. 백엔드 도메인 + 서비스 | 30m |
| 2. SSE Controller | 30m |
| 3. sendMessage publish hook 확장 + helpers | 30m |
| 4. BE test | 30m |
| 5. FE store + hook | 45m |
| 6. FE Toast UI + App 적용 | 45m |
| 7. FE test | 30m |
| 8. e2e Playwright | 30m |
| 9. smoke + commit | 20m |
| **합계** | **~4h 30m** |

## DoD

- [ ] 단위 테스트 PASS (backend + frontend)
- [ ] e2e PASS — toast 다른 페이지에서, thread 페이지 안에선 toast 생략, 자기 메시지엔 알림 없음
- [ ] 4 smoke 131/131 유지
- [ ] api-spec.md §3.7 또는 새 §3.x 에 `/api/notifications/stream` 추가
- [ ] commit + push
