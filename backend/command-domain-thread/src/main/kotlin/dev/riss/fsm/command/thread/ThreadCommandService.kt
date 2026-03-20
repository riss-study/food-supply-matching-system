package dev.riss.fsm.command.thread

import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.LocalDateTime
import java.util.UUID

@Service
class ThreadCommandService(
    private val messageThreadRepository: MessageThreadRepository,
) {
    fun createThread(command: CreateThreadCommand): Mono<MessageThreadEntity> {
        return messageThreadRepository.findByRequestIdAndSupplierProfileId(command.requestId, command.supplierProfileId)
            .switchIfEmpty(
                Mono.defer {
                    messageThreadRepository.save(
                        MessageThreadEntity(
                            threadId = "thd_${UUID.randomUUID()}",
                            requestId = command.requestId,
                            requesterUserId = command.requesterUserId,
                            supplierProfileId = command.supplierProfileId,
                            quoteId = command.quoteId,
                            createdAt = LocalDateTime.now(),
                        ).apply { newEntity = true }
                    )
                }
            )
    }
}

data class CreateThreadCommand(
    val requestId: String,
    val requesterUserId: String,
    val supplierProfileId: String,
    val quoteId: String,
)
