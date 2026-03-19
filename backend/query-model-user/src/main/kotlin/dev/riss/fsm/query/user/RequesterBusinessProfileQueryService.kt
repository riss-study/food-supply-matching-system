package dev.riss.fsm.query.user

import org.springframework.stereotype.Service
import reactor.core.publisher.Mono

@Service
class RequesterBusinessProfileQueryService(
    private val repository: RequesterBusinessProfileDocumentRepository,
) {
    fun findByUserId(userId: String): Mono<RequesterBusinessProfileDocument> = repository.findByUserId(userId)
}
