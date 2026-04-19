package dev.riss.fsm.command.review

import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

interface ReviewRepository : ReactiveCrudRepository<ReviewEntity, String> {
    fun existsByRequestIdAndSupplierProfileId(requestId: String, supplierProfileId: String): Mono<Boolean>
    fun findAllBySupplierProfileIdAndHiddenFalse(supplierProfileId: String): Flux<ReviewEntity>
}
