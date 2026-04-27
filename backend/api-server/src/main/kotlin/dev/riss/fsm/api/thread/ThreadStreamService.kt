package dev.riss.fsm.api.thread

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Component
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import reactor.core.publisher.Sinks
import reactor.core.scheduler.Schedulers
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit

/**
 * Thread 별 실시간 이벤트 stream 추상화.
 *
 * publish 가 `Mono<Void>` 인 이유:
 *   InMemoryThreadStreamService 는 동기 (`Sinks.tryEmitNext`) 라 즉시 완료.
 *   향후 RedisThreadStreamService (다중 인스턴스) 로 교체 시 redis publish 가 비동기 →
 *   동일 시그니처 유지로 caller 변경 불필요.
 */
interface ThreadStreamService {
    fun subscribe(threadId: String): Flux<ThreadStreamEvent>
    fun publish(threadId: String, event: ThreadStreamEvent): Mono<Void>
}

/**
 * 단일 인스턴스 in-memory 구현. 다중 인스턴스 시점에 RedisThreadStreamService 로 교체.
 *
 * `fsm.stream.backend=memory` (기본) 일 때 활성. 미래에 `redis` 로 분기 가능.
 */
@Component
@ConditionalOnProperty(name = ["fsm.stream.backend"], havingValue = "memory", matchIfMissing = true)
class InMemoryThreadStreamService : ThreadStreamService {
    private val sinks = ConcurrentHashMap<String, Sinks.Many<ThreadStreamEvent>>()

    override fun subscribe(threadId: String): Flux<ThreadStreamEvent> {
        val sink = sinks.computeIfAbsent(threadId) {
            // 256: emit buffer cap (초과 시 oldest drop / backpressure 시그널)
            // false: autoCancel 비활성 — 마지막 구독자 떠나도 sink 자동 종료 안 함
            //   (지연 cleanup 가 직접 정리. 짧은 재연결 갭 보호)
            Sinks.many().multicast().onBackpressureBuffer<ThreadStreamEvent>(256, false)
        }
        return sink.asFlux()
            .doFinally {
                // 마지막 구독자 떠난 후 30초 지연 cleanup. 그 사이 재구독 들어오면 sink 유지.
                Schedulers.parallel().schedule({
                    val current = sinks[threadId]
                    if (current != null && current.currentSubscriberCount() == 0) {
                        sinks.remove(threadId, current)
                    }
                }, 30, TimeUnit.SECONDS)
            }
    }

    override fun publish(threadId: String, event: ThreadStreamEvent): Mono<Void> {
        return Mono.fromRunnable {
            // 구독자 0 면 sink 자체 없음 — emit drop OK (best-effort)
            sinks[threadId]?.tryEmitNext(event)
        }
    }
}
