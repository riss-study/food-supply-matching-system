package dev.riss.fsm.query.user

import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Mono

interface RequesterBusinessProfileDocumentRepository : ReactiveMongoRepository<RequesterBusinessProfileDocument, String> {
    fun findByUserId(userId: String): Mono<RequesterBusinessProfileDocument>
}
