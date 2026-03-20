package dev.riss.fsm.command.quote

import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

interface QuoteRepository : ReactiveCrudRepository<QuoteEntity, String> {
    fun findAllByRequestId(requestId: String): Flux<QuoteEntity>
    fun findAllByRequestIdAndState(requestId: String, state: String): Flux<QuoteEntity>
    fun findAllBySupplierProfileId(supplierProfileId: String): Flux<QuoteEntity>
    fun findAllByRequestIdAndSupplierProfileId(requestId: String, supplierProfileId: String): Flux<QuoteEntity>
    fun existsByRequestIdAndSupplierProfileIdAndStateIn(requestId: String, supplierProfileId: String, states: Collection<String>): Mono<Boolean>
}
