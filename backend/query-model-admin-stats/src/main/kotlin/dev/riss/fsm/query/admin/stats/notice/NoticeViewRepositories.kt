package dev.riss.fsm.query.admin.stats.notice

import org.springframework.data.domain.Pageable
import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

interface AdminNoticeViewRepository : ReactiveMongoRepository<AdminNoticeViewDocument, String> {
    fun findAllByOrderByCreatedAtDesc(): Flux<AdminNoticeViewDocument>
    fun findAllByStateOrderByCreatedAtDesc(state: String): Flux<AdminNoticeViewDocument>
    fun findAllByStateOrderByCreatedAtDesc(state: String, pageable: Pageable): Flux<AdminNoticeViewDocument>
}

interface PublicNoticeViewRepository : ReactiveMongoRepository<PublicNoticeViewDocument, String> {
    fun findAllByOrderByPublishedAtDesc(pageable: Pageable): Flux<PublicNoticeViewDocument>
}
