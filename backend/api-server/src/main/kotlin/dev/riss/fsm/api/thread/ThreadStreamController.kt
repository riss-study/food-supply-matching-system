package dev.riss.fsm.api.thread

import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.MediaType
import org.springframework.http.codec.ServerSentEvent
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ServerWebExchange
import reactor.core.publisher.Flux
import java.time.Duration

/**
 * Thread 별 실시간 이벤트 SSE stream.
 *
 * - 권한: thread 참여자만 (ADMIN override 시 audit 자동 기록 — `loadAccessibleThread` 재사용).
 * - heartbeat: 30초마다 빈 comment frame — 프록시 idle timeout 회피.
 * - 첫 frame 검증 후 long-lived. token 만료 후엔 stream 끊지 못함 (stateless JWT 한계) — 클라이언트가 재연결 책임.
 */
@RestController
@Tag(name = "thread-stream")
@SecurityRequirement(name = "bearerAuth")
class ThreadStreamController(
    private val threadStreamService: ThreadStreamService,
    private val threadApplicationService: ThreadApplicationService,
) {

    @GetMapping("/api/threads/{threadId}/stream", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    @Operation(summary = "Thread real-time stream", description = "Server-Sent Events stream of new messages and other thread events")
    fun stream(
        @PathVariable threadId: String,
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        exchange: ServerWebExchange,
    ): Flux<ServerSentEvent<ThreadStreamEvent>> {
        // nginx/CloudFront 의 SSE buffering 회피 — frame 즉시 client 에 전달.
        exchange.response.headers.set("X-Accel-Buffering", "no")

        return threadApplicationService.ensureParticipant(principal, threadId)
            .thenMany(threadStreamService.subscribe(threadId))
            .map { event ->
                val builder = ServerSentEvent.builder<ThreadStreamEvent>()
                    .event(event.type)
                    .data(event)
                event.eventIdOrNull()?.let { builder.id(it) }
                builder.build()
            }
            .mergeWith(heartbeat())
    }

    /**
     * 30초마다 콜론 prefix comment frame — SSE 표준상 client 는 ignore.
     * id 미부여 → polyfill 의 lastEventId 갱신 안 됨 (의도). 재연결 시엔 마지막 정상 메시지의 messageId 가 Last-Event-ID 로 전송.
     */
    private fun heartbeat(): Flux<ServerSentEvent<ThreadStreamEvent>> =
        Flux.interval(Duration.ofSeconds(30))
            .map { ServerSentEvent.builder<ThreadStreamEvent>().comment("heartbeat").build() }
}
