package dev.riss.fsm.command.request

import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Flux

interface RequestRepository : ReactiveCrudRepository<RequestEntity, String> {
    fun findAllByRequesterUserId(requesterUserId: String): Flux<RequestEntity>
}
