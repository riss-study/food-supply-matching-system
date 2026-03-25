package dev.riss.fsm.projection.thread

import dev.riss.fsm.command.request.RequestRepository
import dev.riss.fsm.command.supplier.SupplierProfileRepository
import dev.riss.fsm.command.thread.MessageEntity
import dev.riss.fsm.command.thread.MessageRepository
import dev.riss.fsm.command.thread.MessageThreadEntity
import dev.riss.fsm.command.thread.ThreadParticipantReadStateRepository
import dev.riss.fsm.query.thread.LastMessageInfo
import dev.riss.fsm.query.thread.ThreadDetailDocument
import dev.riss.fsm.query.thread.ThreadDetailRepository
import dev.riss.fsm.query.thread.ThreadSummaryDocument
import dev.riss.fsm.query.thread.ThreadSummaryRepository
import dev.riss.fsm.query.user.RequesterBusinessProfileQueryService
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.util.Optional

@Service
class ThreadProjectionService(
    private val threadSummaryRepository: ThreadSummaryRepository,
    private val threadDetailRepository: ThreadDetailRepository,
    private val requestRepository: RequestRepository,
    private val supplierProfileRepository: SupplierProfileRepository,
    private val requesterBusinessProfileQueryService: RequesterBusinessProfileQueryService,
    private val messageRepository: MessageRepository,
    private val readStateRepository: ThreadParticipantReadStateRepository,
) {
    fun projectThreadCreated(thread: MessageThreadEntity): Mono<MessageThreadEntity> {
        return saveProjection(thread, null).thenReturn(thread)
    }

    fun projectMessageSent(thread: MessageThreadEntity, message: MessageEntity): Mono<MessageEntity> {
        return saveProjection(thread, message).thenReturn(message)
    }

    fun projectReadStateChanged(thread: MessageThreadEntity): Mono<MessageThreadEntity> {
        return latestMessage(thread.threadId)
            .flatMap { message -> saveProjection(thread, message) }
            .switchIfEmpty(saveProjection(thread, null))
            .thenReturn(thread)
    }

    fun projectContactShareChanged(thread: MessageThreadEntity): Mono<MessageThreadEntity> {
        return latestMessage(thread.threadId)
            .flatMap { message -> saveProjection(thread, message, contactShareUpdatedAt(thread)) }
            .switchIfEmpty(saveProjection(thread, null, contactShareUpdatedAt(thread)))
            .thenReturn(thread)
    }

    private fun saveProjection(thread: MessageThreadEntity, latestMessage: MessageEntity?, forcedUpdatedAt: java.time.Instant? = null): Mono<Void> {
        val requestMono = requestRepository.findById(thread.requestId)
        val supplierMono = supplierProfileRepository.findById(thread.supplierProfileId)
        val requesterMono = requesterBusinessProfileQueryService.findByUserId(thread.requesterUserId)
        val requesterUnreadMono = unreadCount(thread.threadId, thread.requesterUserId)
        val supplierUnreadMono = unreadCount(thread.threadId, supplierMono.map { it.supplierUserId })
        val latestMessageMono = (latestMessage?.let { Mono.just(it) } ?: latestMessage(thread.threadId))
            .map { Optional.of(it) }
            .defaultIfEmpty(Optional.empty())

        return Mono.zip(requestMono, supplierMono, requesterMono, requesterUnreadMono, supplierUnreadMono, latestMessageMono)
            .flatMap { tuple ->
                val request = tuple.t1
                val supplier = tuple.t2
                val requester = tuple.t3
                val requesterUnread = tuple.t4
                val supplierUnread = tuple.t5
                val message = tuple.t6.orElse(null)
                val updatedAt = forcedUpdatedAt ?: (message?.createdAt ?: thread.createdAt).toInstant(ZoneOffset.UTC)
                val lastMessage = message?.let {
                    LastMessageInfo(
                        messageId = it.messageId,
                        senderUserId = it.senderUserId,
                        body = it.body,
                        hasAttachments = it.getAttachmentIdList().isNotEmpty(),
                        createdAt = it.createdAt.toInstant(ZoneOffset.UTC),
                    )
                }

                val summary = ThreadSummaryDocument(
                    threadId = thread.threadId,
                    requestId = thread.requestId,
                    requesterUserId = thread.requesterUserId,
                    supplierProfileId = thread.supplierProfileId,
                    quoteId = thread.quoteId,
                    contactShareState = thread.contactShareState,
                    requestTitle = request.title,
                    requesterBusinessName = requester.businessName,
                    supplierCompanyName = supplier.companyName,
                    lastMessage = lastMessage,
                    requesterUnreadCount = requesterUnread,
                    supplierUnreadCount = supplierUnread,
                    createdAt = thread.createdAt.toInstant(ZoneOffset.UTC),
                    updatedAt = updatedAt,
                )

                val detail = ThreadDetailDocument(
                    threadId = thread.threadId,
                    requestId = thread.requestId,
                    requesterUserId = thread.requesterUserId,
                    supplierProfileId = thread.supplierProfileId,
                    quoteId = thread.quoteId,
                    contactShareState = thread.contactShareState,
                    requestTitle = request.title,
                    requesterBusinessName = requester.businessName,
                    supplierCompanyName = supplier.companyName,
                    createdAt = thread.createdAt.toInstant(ZoneOffset.UTC),
                    updatedAt = updatedAt,
                )

                Mono.`when`(
                    threadSummaryRepository.save(summary),
                    threadDetailRepository.save(detail),
                ).then()
            }
    }

    private fun latestMessage(threadId: String): Mono<MessageEntity> {
        return messageRepository.findAllByThreadIdOrderByCreatedAtDesc(threadId).next()
    }

    private fun unreadCount(threadId: String, userId: String): Mono<Long> {
        return readStateRepository.findByThreadIdAndUserId(threadId, userId)
            .flatMap { state ->
                messageRepository.countByThreadIdAndSenderUserIdNotAndCreatedAtAfter(threadId, userId, state.lastReadAt)
            }
            .switchIfEmpty(messageRepository.countByThreadIdAndSenderUserIdNotAndCreatedAtAfter(threadId, userId, LocalDateTime.MIN))
    }

    private fun unreadCount(threadId: String, userIdMono: Mono<String>): Mono<Long> {
        return userIdMono.flatMap { userId -> unreadCount(threadId, userId) }
    }

    private fun contactShareUpdatedAt(thread: MessageThreadEntity): java.time.Instant {
        val updated = listOfNotNull(
            thread.contactShareRequestedAt,
            thread.contactShareRequesterApprovedAt,
            thread.contactShareSupplierApprovedAt,
            thread.contactShareRevokedAt,
        ).maxOrNull() ?: thread.createdAt
        return updated.toInstant(ZoneOffset.UTC)
    }
}
