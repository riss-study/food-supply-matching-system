package dev.riss.fsm.query.request

import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import org.springframework.stereotype.Repository
import reactor.core.publisher.Flux

@Repository
interface RequesterRequestSummaryRepository : ReactiveMongoRepository<RequesterRequestSummaryDocument, String> {
    fun findAllByRequesterUserId(requesterUserId: String): Flux<RequesterRequestSummaryDocument>
    fun findAllByRequesterUserIdAndState(requesterUserId: String, state: String): Flux<RequesterRequestSummaryDocument>
}
