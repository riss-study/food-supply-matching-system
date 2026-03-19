package dev.riss.fsm.command.user

import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Mono

interface UserAccountRepository : ReactiveCrudRepository<UserAccountEntity, String> {
    fun findByEmail(email: String): Mono<UserAccountEntity>
    fun existsByEmail(email: String): Mono<Boolean>
}
