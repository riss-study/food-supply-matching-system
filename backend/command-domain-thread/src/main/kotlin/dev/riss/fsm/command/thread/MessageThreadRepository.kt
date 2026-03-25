package dev.riss.fsm.command.thread

import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.time.LocalDateTime

interface MessageThreadRepository : ReactiveCrudRepository<MessageThreadEntity, String> {
    fun findByRequestIdAndRequesterUserIdAndSupplierProfileId(
        requestId: String,
        requesterUserId: String,
        supplierProfileId: String,
    ): Mono<MessageThreadEntity>
    fun findAllByRequestId(requestId: String): Flux<MessageThreadEntity>
    fun findAllByRequesterUserId(requesterUserId: String): Flux<MessageThreadEntity>
    fun findAllBySupplierProfileId(supplierProfileId: String): Flux<MessageThreadEntity>
}

interface MessageRepository : ReactiveCrudRepository<MessageEntity, String> {
    fun findAllByThreadIdOrderByCreatedAtDesc(threadId: String): Flux<MessageEntity>
    fun findAllByThreadIdOrderByCreatedAtAsc(threadId: String): Flux<MessageEntity>
    fun countByThreadIdAndCreatedAtAfter(threadId: String, createdAt: LocalDateTime): Mono<Long>
    fun countByThreadIdAndSenderUserIdNotAndCreatedAtAfter(threadId: String, senderUserId: String, createdAt: LocalDateTime): Mono<Long>
}

interface ThreadParticipantReadStateRepository : ReactiveCrudRepository<ThreadParticipantReadStateEntity, String> {
    fun findByThreadIdAndUserId(threadId: String, userId: String): Mono<ThreadParticipantReadStateEntity>
    fun findAllByThreadId(threadId: String): Flux<ThreadParticipantReadStateEntity>
}
