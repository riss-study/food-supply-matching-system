package dev.riss.fsm.command.notice

import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

interface NoticeRepository : ReactiveCrudRepository<NoticeEntity, String> {
    fun findAllByStateOrderByCreatedAtDesc(state: String): Flux<NoticeEntity>
    fun findAllByOrderByCreatedAtDesc(): Flux<NoticeEntity>
}
