package dev.riss.fsm.query.quote

import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import reactor.core.publisher.Flux

interface QuoteComparisonRepository : ReactiveMongoRepository<QuoteComparisonDocument, String> {
    fun findAllByRequestId(requestId: String): Flux<QuoteComparisonDocument>
    fun findAllBySupplierProfileId(supplierProfileId: String): Flux<QuoteComparisonDocument>
}
