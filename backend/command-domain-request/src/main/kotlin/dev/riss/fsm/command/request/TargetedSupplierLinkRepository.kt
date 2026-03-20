package dev.riss.fsm.command.request

import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

interface TargetedSupplierLinkRepository : ReactiveCrudRepository<TargetedSupplierLinkEntity, String> {
    fun findAllByRequestId(requestId: String): Flux<TargetedSupplierLinkEntity>
    fun findAllBySupplierProfileId(supplierProfileId: String): Flux<TargetedSupplierLinkEntity>
    fun findByRequestIdAndSupplierProfileId(requestId: String, supplierProfileId: String): Mono<TargetedSupplierLinkEntity>
    fun existsByRequestIdAndSupplierProfileId(requestId: String, supplierProfileId: String): Mono<Boolean>
    fun deleteAllByRequestId(requestId: String): Mono<Void>
}
