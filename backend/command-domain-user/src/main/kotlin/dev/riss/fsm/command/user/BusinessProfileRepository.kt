package dev.riss.fsm.command.user

import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Mono

interface BusinessProfileRepository : ReactiveCrudRepository<BusinessProfileEntity, String> {
    fun findByUserAccountId(userAccountId: String): Mono<BusinessProfileEntity>
    fun existsByUserAccountId(userAccountId: String): Mono<Boolean>
}
