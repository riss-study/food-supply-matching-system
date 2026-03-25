package dev.riss.fsm.query.thread

import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

interface ThreadSummaryRepository : ReactiveMongoRepository<ThreadSummaryDocument, String> {
    fun findAllByRequesterUserIdOrderByUpdatedAtDesc(requesterUserId: String): Flux<ThreadSummaryDocument>
    fun findAllBySupplierProfileIdOrderByUpdatedAtDesc(supplierProfileId: String): Flux<ThreadSummaryDocument>
}

interface ThreadDetailRepository : ReactiveMongoRepository<ThreadDetailDocument, String> {
}
