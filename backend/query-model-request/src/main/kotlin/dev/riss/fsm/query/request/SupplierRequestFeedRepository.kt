package dev.riss.fsm.query.request

import org.springframework.data.mongodb.repository.ReactiveMongoRepository
import org.springframework.stereotype.Repository
import reactor.core.publisher.Flux

@Repository
interface SupplierRequestFeedRepository : ReactiveMongoRepository<SupplierRequestFeedDocument, String> {
    fun findAllByMode(mode: String): Flux<SupplierRequestFeedDocument>
    fun findAllByModeAndIsTargeted(mode: String, isTargeted: Boolean): Flux<SupplierRequestFeedDocument>
    fun findAllByModeAndRequestIdIn(mode: String, requestIds: List<String>): Flux<SupplierRequestFeedDocument>
}
