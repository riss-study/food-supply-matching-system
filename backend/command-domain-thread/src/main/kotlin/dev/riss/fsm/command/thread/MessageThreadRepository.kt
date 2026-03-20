package dev.riss.fsm.command.thread

import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Mono

interface MessageThreadRepository : ReactiveCrudRepository<MessageThreadEntity, String> {
    fun findByRequestIdAndSupplierProfileId(requestId: String, supplierProfileId: String): Mono<MessageThreadEntity>
}
