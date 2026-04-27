package dev.riss.fsm.api.notification

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Component
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import reactor.core.publisher.Sinks
import reactor.core.scheduler.Schedulers
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit

/**
 * 사용자별 글로벌 알림 stream.
 *
 * P3-B 의 ThreadStreamService 와 동일 패턴 — 다만 키가 `userId` (thread 무관).
 * 같은 사용자 여러 device/탭 → 모든 탭에 fan-out (multicast).
 */
interface NotificationStreamService {
    fun subscribe(userId: String): Flux<NotificationStreamEvent>
    fun publish(userId: String, event: NotificationStreamEvent): Mono<Void>
}

@Component
@ConditionalOnProperty(name = ["fsm.stream.backend"], havingValue = "memory", matchIfMissing = true)
class InMemoryNotificationStreamService : NotificationStreamService {
    private val sinks = ConcurrentHashMap<String, Sinks.Many<NotificationStreamEvent>>()

    override fun subscribe(userId: String): Flux<NotificationStreamEvent> {
        val sink = sinks.computeIfAbsent(userId) {
            // 256: emit buffer cap (초과 시 oldest drop / backpressure 시그널)
            // false: autoCancel 비활성 — 마지막 구독자 떠나도 sink 자동 종료 안 함 (지연 cleanup)
            Sinks.many().multicast().onBackpressureBuffer<NotificationStreamEvent>(256, false)
        }
        return sink.asFlux()
            .doFinally {
                Schedulers.parallel().schedule({
                    val current = sinks[userId]
                    if (current != null && current.currentSubscriberCount() == 0) {
                        sinks.remove(userId, current)
                    }
                }, 30, TimeUnit.SECONDS)
            }
    }

    override fun publish(userId: String, event: NotificationStreamEvent): Mono<Void> {
        return Mono.fromRunnable {
            sinks[userId]?.tryEmitNext(event)
        }
    }
}
