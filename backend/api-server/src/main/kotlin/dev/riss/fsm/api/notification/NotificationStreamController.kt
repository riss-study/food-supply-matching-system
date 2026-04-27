package dev.riss.fsm.api.notification

import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.MediaType
import org.springframework.http.codec.ServerSentEvent
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ServerWebExchange
import reactor.core.publisher.Flux
import java.time.Duration

/**
 * 사용자별 글로벌 알림 SSE stream.
 *
 * - 권한: Bearer 토큰의 userId 기준 자동 본인 stream (별도 권한 검증 불필요).
 * - heartbeat: 30초마다 빈 comment frame.
 * - X-Accel-Buffering: no — nginx/CloudFront SSE 버퍼링 회피.
 */
@RestController
@Tag(name = "notification-stream")
@SecurityRequirement(name = "bearerAuth")
class NotificationStreamController(
    private val notificationStreamService: NotificationStreamService,
) {

    @GetMapping("/api/notifications/stream", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    @Operation(summary = "Global notification stream", description = "Server-Sent Events stream of user-scoped notifications (new messages, system events)")
    fun stream(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        exchange: ServerWebExchange,
    ): Flux<ServerSentEvent<NotificationStreamEvent>> {
        exchange.response.headers.set("X-Accel-Buffering", "no")

        return notificationStreamService.subscribe(principal.userId)
            .map { event ->
                val builder = ServerSentEvent.builder<NotificationStreamEvent>()
                    .event(event.type)
                    .data(event)
                event.eventIdOrNull()?.let { builder.id(it) }
                builder.build()
            }
            .mergeWith(heartbeat())
    }

    private fun heartbeat(): Flux<ServerSentEvent<NotificationStreamEvent>> =
        Flux.interval(Duration.ofSeconds(30))
            .map { ServerSentEvent.builder<NotificationStreamEvent>().comment("heartbeat").build() }
}
