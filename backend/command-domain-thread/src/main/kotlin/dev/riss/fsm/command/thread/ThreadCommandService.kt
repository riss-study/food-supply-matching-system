package dev.riss.fsm.command.thread

import dev.riss.fsm.shared.error.ThreadAccessDeniedException
import dev.riss.fsm.shared.error.ThreadNotFoundException
import dev.riss.fsm.shared.error.ContactShareAlreadyRequestedException
import dev.riss.fsm.shared.error.ContactShareApprovalConflictException
import dev.riss.fsm.shared.error.ContactShareNotRequestedException
import dev.riss.fsm.shared.error.ContactShareRevokeForbiddenException
import dev.riss.fsm.shared.error.MessageContentRequiredException
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.LocalDateTime
import java.util.UUID

@Service
class ThreadCommandService(
    private val messageThreadRepository: MessageThreadRepository,
    private val messageRepository: MessageRepository,
    private val readStateRepository: ThreadParticipantReadStateRepository,
) {
    fun createThread(command: CreateThreadCommand): Mono<CreateThreadResult> {
        return messageThreadRepository.findByRequestIdAndRequesterUserIdAndSupplierProfileId(
            command.requestId,
            command.requesterUserId,
            command.supplierProfileId,
        )
            .map { thread -> CreateThreadResult(thread, isNew = false) }
            .switchIfEmpty(
                Mono.defer {
                    val thread = MessageThreadEntity(
                        threadId = "thd_${UUID.randomUUID()}",
                        requestId = command.requestId,
                        requesterUserId = command.requesterUserId,
                        supplierProfileId = command.supplierProfileId,
                        quoteId = command.quoteId,
                        contactShareState = "not_requested",
                        createdAt = LocalDateTime.now(),
                    ).apply { newEntity = true }
                    messageThreadRepository.save(thread).map { CreateThreadResult(it, isNew = true) }
                }
            )
    }

    fun sendMessage(command: SendMessageCommand): Mono<MessageEntity> {
        if (command.body.isNullOrBlank() && command.attachmentIds.isNullOrEmpty()) {
            return Mono.error(MessageContentRequiredException())
        }

        return messageThreadRepository.findById(command.threadId)
            .switchIfEmpty(Mono.error(ThreadNotFoundException()))
            .flatMap { thread ->
                validateParticipant(thread, command.senderUserId, command.senderSupplierProfileId)
                val attachmentIdsStr = command.attachmentIds?.joinToString(",")?.takeIf { it.isNotBlank() }
                val message = MessageEntity(
                    messageId = "msg_${UUID.randomUUID()}",
                    threadId = command.threadId,
                    senderUserId = command.senderUserId,
                    body = command.body,
                    attachmentIds = attachmentIdsStr,
                    createdAt = LocalDateTime.now(),
                ).apply { newEntity = true }
                messageRepository.save(message)
            }
    }

    fun markThreadAsRead(command: MarkThreadAsReadCommand): Mono<ThreadReadResult> {
        return messageThreadRepository.findById(command.threadId)
            .switchIfEmpty(Mono.error(ThreadNotFoundException()))
            .flatMap { thread ->
                validateParticipant(thread, command.userId, command.supplierProfileId)
                val now = LocalDateTime.now()
                readStateRepository.findByThreadIdAndUserId(command.threadId, command.userId)
                    .flatMap { existing ->
                        readStateRepository.save(existing.copy(lastReadAt = now))
                    }
                    .switchIfEmpty(
                        Mono.defer {
                            val newState = ThreadParticipantReadStateEntity(
                                readStateId = "trs_${UUID.randomUUID()}",
                                threadId = command.threadId,
                                userId = command.userId,
                                lastReadAt = now,
                            ).apply { newEntity = true }
                            readStateRepository.save(newState)
                        }
                    )
                    .map { ThreadReadResult(command.threadId, it.lastReadAt, unreadCount = 0) }
            }
    }

    fun getUnreadCount(threadId: String, userId: String): Mono<Long> {
        return readStateRepository.findByThreadIdAndUserId(threadId, userId)
            .flatMap { readState ->
                messageRepository.countByThreadIdAndSenderUserIdNotAndCreatedAtAfter(threadId, userId, readState.lastReadAt)
            }
            .switchIfEmpty(messageRepository.countByThreadIdAndSenderUserIdNotAndCreatedAtAfter(threadId, userId, LocalDateTime.MIN))
    }

    fun requestContactShare(command: ContactShareCommand): Mono<MessageThreadEntity> {
        return messageThreadRepository.findById(command.threadId)
            .switchIfEmpty(Mono.error(ThreadNotFoundException()))
            .flatMap { thread ->
                val actorRole = participantRole(thread, command.userId, command.supplierProfileId)
                when (thread.contactShareState) {
                    "not_requested", "revoked" -> {
                        val now = LocalDateTime.now()
                        messageThreadRepository.save(
                            thread.copy(
                                contactShareState = "requested",
                                contactShareRequestedByRole = actorRole,
                                contactShareRequestedAt = now,
                                contactShareRequesterApprovedAt = null,
                                contactShareSupplierApprovedAt = null,
                                contactShareRevokedByRole = null,
                                contactShareRevokedAt = null,
                            )
                        )
                    }

                    else -> Mono.error(ContactShareAlreadyRequestedException())
                }
            }
    }

    fun approveContactShare(command: ContactShareCommand): Mono<MessageThreadEntity> {
        return messageThreadRepository.findById(command.threadId)
            .switchIfEmpty(Mono.error(ThreadNotFoundException()))
            .flatMap { thread ->
                val actorRole = participantRole(thread, command.userId, command.supplierProfileId)
                when (thread.contactShareState) {
                    "requested", "one_side_approved" -> {
                        if ((actorRole == "requester" && thread.contactShareRequesterApprovedAt != null) ||
                            (actorRole == "supplier" && thread.contactShareSupplierApprovedAt != null)
                        ) {
                            return@flatMap Mono.error(ContactShareApprovalConflictException("This participant already approved contact sharing"))
                        }

                        val now = LocalDateTime.now()
                        val requesterApprovedAt = if (actorRole == "requester") now else thread.contactShareRequesterApprovedAt
                        val supplierApprovedAt = if (actorRole == "supplier") now else thread.contactShareSupplierApprovedAt

                        messageThreadRepository.save(
                            thread.copy(
                                contactShareState = if (requesterApprovedAt != null && supplierApprovedAt != null) "mutually_approved" else "one_side_approved",
                                contactShareRequesterApprovedAt = requesterApprovedAt,
                                contactShareSupplierApprovedAt = supplierApprovedAt,
                            )
                        )
                    }

                    "mutually_approved" -> Mono.error(ContactShareApprovalConflictException("Contact sharing is already mutually approved"))
                    else -> Mono.error(ContactShareNotRequestedException())
                }
            }
    }

    fun revokeContactShare(command: ContactShareCommand): Mono<MessageThreadEntity> {
        return messageThreadRepository.findById(command.threadId)
            .switchIfEmpty(Mono.error(ThreadNotFoundException()))
            .flatMap { thread ->
                val actorRole = participantRole(thread, command.userId, command.supplierProfileId)
                when (thread.contactShareState) {
                    "requested", "one_side_approved" -> {
                        if (thread.contactShareRequestedByRole != actorRole) {
                            return@flatMap Mono.error(ContactShareApprovalConflictException("Only the original requester can revoke contact sharing"))
                        }

                        val now = LocalDateTime.now()
                        messageThreadRepository.save(
                            thread.copy(
                                contactShareState = "revoked",
                                contactShareRevokedByRole = actorRole,
                                contactShareRevokedAt = now,
                                contactShareRequesterApprovedAt = null,
                                contactShareSupplierApprovedAt = null,
                            )
                        )
                    }

                    "mutually_approved" -> Mono.error(ContactShareRevokeForbiddenException())
                    else -> Mono.error(ContactShareNotRequestedException())
                }
            }
    }

    private fun validateParticipant(thread: MessageThreadEntity, userId: String, supplierProfileId: String?) {
        participantRole(thread, userId, supplierProfileId)
    }

    fun ensureThreadAccess(thread: MessageThreadEntity, userId: String, supplierProfileId: String?): Boolean {
        return thread.requesterUserId == userId || thread.supplierProfileId == supplierProfileId
    }

    private fun participantRole(thread: MessageThreadEntity, userId: String, supplierProfileId: String?): String {
        return when {
            thread.requesterUserId == userId -> "requester"
            thread.supplierProfileId == supplierProfileId -> "supplier"
            else -> throw ThreadAccessDeniedException()
        }
    }
}

data class CreateThreadCommand(
    val requestId: String,
    val requesterUserId: String,
    val supplierProfileId: String,
    val quoteId: String? = null,
)

data class CreateThreadResult(
    val thread: MessageThreadEntity,
    val isNew: Boolean,
)

data class SendMessageCommand(
    val threadId: String,
    val senderUserId: String,
    val senderSupplierProfileId: String? = null,
    val body: String?,
    val attachmentIds: List<String>?,
)

data class MarkThreadAsReadCommand(
    val threadId: String,
    val userId: String,
    val supplierProfileId: String? = null,
)

data class ThreadReadResult(
    val threadId: String,
    val readAt: LocalDateTime,
    val unreadCount: Long,
)

data class ContactShareCommand(
    val threadId: String,
    val userId: String,
    val supplierProfileId: String? = null,
)
