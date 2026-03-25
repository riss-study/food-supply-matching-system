package dev.riss.fsm.api.thread

import dev.riss.fsm.command.request.RequestRepository
import dev.riss.fsm.command.request.TargetedSupplierLinkRepository
import dev.riss.fsm.command.supplier.AttachmentMetadataEntity
import dev.riss.fsm.command.supplier.AttachmentMetadataRepository
import dev.riss.fsm.command.supplier.SupplierProfileRepository
import dev.riss.fsm.command.thread.ContactShareCommand
import dev.riss.fsm.command.thread.CreateThreadCommand
import dev.riss.fsm.command.thread.MarkThreadAsReadCommand
import dev.riss.fsm.command.thread.MessageEntity
import dev.riss.fsm.command.thread.MessageRepository
import dev.riss.fsm.command.thread.MessageThreadEntity
import dev.riss.fsm.command.thread.MessageThreadRepository
import dev.riss.fsm.command.thread.SendMessageCommand
import dev.riss.fsm.command.thread.ThreadCommandService
import dev.riss.fsm.projection.thread.ThreadProjectionService
import dev.riss.fsm.query.thread.LastMessageInfo
import dev.riss.fsm.query.thread.ThreadDetailDocument
import dev.riss.fsm.query.thread.ThreadQueryService
import dev.riss.fsm.query.thread.ThreadSummaryDocument
import dev.riss.fsm.query.user.RequesterBusinessProfileQueryService
import dev.riss.fsm.shared.api.PaginationMeta
import dev.riss.fsm.shared.auth.UserRole
import dev.riss.fsm.shared.error.ThreadAccessDeniedException
import dev.riss.fsm.shared.error.ThreadNotFoundException
import dev.riss.fsm.shared.file.FileStorageService
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.springframework.core.io.FileSystemResource
import org.springframework.http.ContentDisposition
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.http.codec.multipart.FilePart
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import reactor.kotlin.core.publisher.switchIfEmpty
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.util.UUID

@Service
class ThreadApplicationService(
    private val requestRepository: RequestRepository,
    private val targetedSupplierLinkRepository: TargetedSupplierLinkRepository,
    private val supplierProfileRepository: SupplierProfileRepository,
    private val messageThreadRepository: MessageThreadRepository,
    private val messageRepository: MessageRepository,
    private val threadCommandService: ThreadCommandService,
    private val threadProjectionService: ThreadProjectionService,
    private val threadQueryService: ThreadQueryService,
    private val attachmentMetadataRepository: AttachmentMetadataRepository,
    private val fileStorageService: FileStorageService,
    private val requesterBusinessProfileQueryService: RequesterBusinessProfileQueryService,
) {
    fun createThread(
        principal: AuthenticatedUserPrincipal,
        requestId: String,
        request: CreateThreadRequest,
    ): Mono<CreateThreadResponse> {
        if (principal.role != UserRole.REQUESTER) {
            return Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Only requester can create threads manually"))
        }

        val requestMono = requestRepository.findById(requestId)
            .switchIfEmpty { Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found")) }

        val supplierMono = supplierProfileRepository.findById(request.supplierId)
            .switchIfEmpty { Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found")) }

        return Mono.zip(requestMono, supplierMono)
            .flatMap { tuple ->
                val requestEntity = tuple.t1
                val supplierProfile = tuple.t2

                if (requestEntity.requesterUserId != principal.userId) {
                    return@flatMap Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Not the request owner"))
                }
                if (supplierProfile.verificationState != "approved") {
                    return@flatMap Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Only approved suppliers can be threaded"))
                }

                val targetingCheck = if (requestEntity.mode == "targeted") {
                    targetedSupplierLinkRepository.existsByRequestIdAndSupplierProfileId(requestId, request.supplierId)
                        .flatMap { exists ->
                            if (!exists) Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Supplier is not targeted for this request"))
                            else Mono.empty()
                        }
                } else {
                    Mono.empty()
                }

                targetingCheck.then(
                    threadCommandService.createThread(
                        CreateThreadCommand(
                            requestId = requestId,
                            requesterUserId = principal.userId,
                            supplierProfileId = request.supplierId,
                            quoteId = null,
                        )
                    )
                )
            }
            .flatMap { result -> threadProjectionService.projectThreadCreated(result.thread).thenReturn(result) }
            .map { result ->
                CreateThreadResponse(
                    threadId = result.thread.threadId,
                    requestId = result.thread.requestId,
                    supplierProfileId = result.thread.supplierProfileId,
                    createdAt = result.thread.createdAt.toInstant(ZoneOffset.UTC),
                    created = result.isNew,
                )
            }
    }

    fun listThreads(
        principal: AuthenticatedUserPrincipal,
        unreadOnly: Boolean,
        page: Int,
        size: Int,
    ): Mono<ThreadListPageResponse> {
        val safePage = page.coerceAtLeast(1)
        val safeSize = size.coerceIn(1, 100)

        val source = when (principal.role) {
            UserRole.REQUESTER -> threadQueryService.getThreadSummariesForRequester(principal.userId, unreadOnly)
            UserRole.SUPPLIER -> supplierProfileRepository.findBySupplierUserId(principal.userId)
                .switchIfEmpty { Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Supplier profile not found")) }
                .flatMapMany { profile -> threadQueryService.getThreadSummariesForSupplier(profile.profileId, unreadOnly) }
            else -> return Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Admin thread inbox is not available"))
        }

        return source.collectList().map { items ->
            val total = items.size
            val totalPages = if (total == 0) 0 else ((total - 1) / safeSize) + 1
            val from = ((safePage - 1) * safeSize).coerceAtMost(total)
            val to = (from + safeSize).coerceAtMost(total)
            ThreadListPageResponse(
                items = items.subList(from, to).map { document -> toSummaryResponse(document, principal.role) },
                meta = PaginationMeta(
                    page = safePage,
                    size = safeSize,
                    totalElements = total.toLong(),
                    totalPages = totalPages,
                    hasNext = safePage < totalPages,
                    hasPrev = safePage > 1 && totalPages > 0,
                ),
            )
        }
    }

    fun getThreadDetail(
        principal: AuthenticatedUserPrincipal,
        threadId: String,
        page: Int,
        size: Int,
    ): Mono<ThreadDetailResponse> {
        val safePage = page.coerceAtLeast(1)
        val safeSize = size.coerceIn(1, 100)

        return loadAccessibleThread(principal, threadId)
            .flatMap { thread ->
                Mono.zip(
                    threadQueryService.getThreadDetail(threadId),
                    loadMessagePage(thread, safePage, safeSize),
                ).flatMap { tuple ->
                    val detail = tuple.t1
                    val messages = tuple.t2
                    sharedContact(thread)
                        .map<ThreadDetailResponse> { sharedContact ->
                            ThreadDetailResponse(
                                threadId = detail.threadId,
                                requestId = detail.requestId,
                                requestTitle = detail.requestTitle,
                                otherParty = toOtherParty(detail, principal.role),
                                contactShareState = detail.contactShareState,
                                contactShareRequestedByRole = thread.contactShareRequestedByRole,
                                requesterApproved = thread.contactShareRequesterApprovedAt != null,
                                supplierApproved = thread.contactShareSupplierApprovedAt != null,
                                sharedContact = sharedContact,
                                messages = messages.items,
                                meta = messages.meta,
                                createdAt = detail.createdAt,
                                updatedAt = detail.updatedAt,
                            )
                        }
                        .defaultIfEmpty(
                            ThreadDetailResponse(
                                threadId = detail.threadId,
                                requestId = detail.requestId,
                                requestTitle = detail.requestTitle,
                                otherParty = toOtherParty(detail, principal.role),
                                contactShareState = detail.contactShareState,
                                contactShareRequestedByRole = thread.contactShareRequestedByRole,
                                requesterApproved = thread.contactShareRequesterApprovedAt != null,
                                supplierApproved = thread.contactShareSupplierApprovedAt != null,
                                sharedContact = null,
                                messages = messages.items,
                                meta = messages.meta,
                                createdAt = detail.createdAt,
                                updatedAt = detail.updatedAt,
                            )
                        )
                }
            }
    }

    fun sendMessage(
        principal: AuthenticatedUserPrincipal,
        threadId: String,
        request: SendThreadMessageRequest,
    ): Mono<SendThreadMessageResponse> {
        return loadParticipantContext(principal)
            .flatMap { context ->
                loadAccessibleThread(principal, threadId).flatMap { thread ->
                    validateAttachmentIds(threadId, request.attachmentIds.orEmpty())
                        .then(
                            threadCommandService.sendMessage(
                                SendMessageCommand(
                                    threadId = threadId,
                                    senderUserId = principal.userId,
                                    senderSupplierProfileId = context.supplierProfileId,
                                    body = request.body,
                                    attachmentIds = request.attachmentIds,
                                )
                            )
                        )
                        .flatMap { message -> threadProjectionService.projectMessageSent(thread, message) }
                }
            }
            .map { message ->
                SendThreadMessageResponse(
                    messageId = message.messageId,
                    threadId = message.threadId,
                    createdAt = message.createdAt.toInstant(ZoneOffset.UTC),
                )
            }
    }

    fun markThreadAsRead(principal: AuthenticatedUserPrincipal, threadId: String): Mono<MarkThreadReadResponse> {
        return loadParticipantContext(principal)
            .flatMap { context ->
                loadAccessibleThread(principal, threadId)
                    .flatMap { thread ->
                        threadCommandService.markThreadAsRead(
                            MarkThreadAsReadCommand(
                                threadId = threadId,
                                userId = principal.userId,
                                supplierProfileId = context.supplierProfileId,
                            )
                        ).flatMap { result ->
                            threadProjectionService.projectReadStateChanged(thread).thenReturn(result)
                        }
                    }
            }
            .map { result ->
                MarkThreadReadResponse(
                    threadId = result.threadId,
                    unreadCount = result.unreadCount,
                    readAt = result.readAt.toInstant(ZoneOffset.UTC),
                )
            }
    }

    fun requestContactShare(principal: AuthenticatedUserPrincipal, threadId: String): Mono<ContactShareActionResponse> {
        return mutateContactShare(principal, threadId) { context ->
            threadCommandService.requestContactShare(ContactShareCommand(threadId, principal.userId, context.supplierProfileId))
        }
    }

    fun approveContactShare(principal: AuthenticatedUserPrincipal, threadId: String): Mono<ContactShareActionResponse> {
        return mutateContactShare(principal, threadId) { context ->
            threadCommandService.approveContactShare(ContactShareCommand(threadId, principal.userId, context.supplierProfileId))
        }
    }

    fun revokeContactShare(principal: AuthenticatedUserPrincipal, threadId: String): Mono<ContactShareActionResponse> {
        return mutateContactShare(principal, threadId) { context ->
            threadCommandService.revokeContactShare(ContactShareCommand(threadId, principal.userId, context.supplierProfileId))
        }
    }

    fun uploadAttachment(
        principal: AuthenticatedUserPrincipal,
        threadId: String,
        file: FilePart,
    ): Mono<UploadThreadAttachmentResponse> {
        return loadAccessibleThread(principal, threadId)
            .then(fileStorageService.store("thread", threadId, file))
            .flatMap { metadata ->
                attachmentMetadataRepository.save(
                    AttachmentMetadataEntity(
                        attachmentId = metadata.attachmentId,
                        ownerType = metadata.ownerType,
                        ownerId = metadata.ownerId,
                        attachmentKind = "thread_message",
                        fileName = metadata.fileName,
                        contentType = metadata.contentType,
                        fileSize = metadata.fileSize,
                        storageKey = metadata.storageKey,
                        createdAt = LocalDateTime.now(),
                    ).apply { newEntity = true }
                ).thenReturn(metadata)
            }
            .map { metadata ->
                UploadThreadAttachmentResponse(
                    attachmentId = metadata.attachmentId,
                    fileName = metadata.fileName,
                    contentType = metadata.contentType,
                    fileSize = metadata.fileSize,
                    url = attachmentUrl(threadId, metadata.attachmentId),
                    createdAt = metadata.createdAt,
                )
            }
    }

    fun downloadAttachment(
        principal: AuthenticatedUserPrincipal,
        threadId: String,
        attachmentId: String,
    ): Mono<ResponseEntity<FileSystemResource>> {
        return loadAccessibleThread(principal, threadId)
            .then(loadThreadAttachment(threadId, attachmentId))
            .flatMap { metadata ->
                fileStorageService.resolve(metadata.storageKey)
                    .map { path ->
                        ResponseEntity.ok()
                            .contentType(MediaType.parseMediaType(metadata.contentType))
                            .header(
                                HttpHeaders.CONTENT_DISPOSITION,
                                ContentDisposition.attachment().filename(metadata.fileName).build().toString(),
                            )
                            .body(FileSystemResource(path))
                    }
            }
    }

    private fun loadAccessibleThread(principal: AuthenticatedUserPrincipal, threadId: String): Mono<MessageThreadEntity> {
        return loadParticipantContext(principal)
            .flatMap { context ->
                messageThreadRepository.findById(threadId)
                    .switchIfEmpty { Mono.error(ThreadNotFoundException()) }
                    .flatMap { thread ->
                        val canAccess = principal.role == UserRole.ADMIN || threadCommandService.ensureThreadAccess(thread, principal.userId, context.supplierProfileId)
                        if (!canAccess) {
                            Mono.error(ThreadAccessDeniedException())
                        } else {
                            Mono.just(thread)
                        }
                    }
            }
    }

    private fun loadParticipantContext(principal: AuthenticatedUserPrincipal): Mono<ParticipantContext> {
        return when (principal.role) {
            UserRole.SUPPLIER -> supplierProfileRepository.findBySupplierUserId(principal.userId)
                .switchIfEmpty { Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Supplier profile not found")) }
                .map { profile -> ParticipantContext(profile.profileId) }
            else -> Mono.just(ParticipantContext(null))
        }
    }

    private fun validateAttachmentIds(threadId: String, attachmentIds: List<String>): Mono<Void> {
        if (attachmentIds.isEmpty()) {
            return Mono.empty()
        }

        return attachmentMetadataRepository.findAllById(attachmentIds)
            .collectList()
            .flatMap { items ->
                if (items.size != attachmentIds.size || items.any { it.ownerType != "thread" || it.ownerId != threadId }) {
                    Mono.error(ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid thread attachment reference"))
                } else {
                    Mono.empty()
                }
            }
    }

    private fun mutateContactShare(
        principal: AuthenticatedUserPrincipal,
        threadId: String,
        operation: (ParticipantContext) -> Mono<MessageThreadEntity>,
    ): Mono<ContactShareActionResponse> {
        return loadParticipantContext(principal)
            .flatMap { context ->
                loadAccessibleThread(principal, threadId)
                    .then(operation(context))
                    .flatMap { updatedThread ->
                        threadProjectionService.projectContactShareChanged(updatedThread)
                    }
            }
            .flatMap { thread ->
                sharedContact(thread)
                    .map { sharedContact -> toContactShareActionResponse(thread, sharedContact) }
                    .defaultIfEmpty(toContactShareActionResponse(thread, null))
            }
    }

    private fun loadMessagePage(thread: MessageThreadEntity, page: Int, size: Int): Mono<ThreadMessagesPageResponse> {
        return messageRepository.findAllByThreadIdOrderByCreatedAtDesc(thread.threadId)
            .collectList()
            .flatMap { items ->
                val total = items.size
                val totalPages = if (total == 0) 0 else ((total - 1) / size) + 1
                val from = ((page - 1) * size).coerceAtMost(items.size)
                val to = (from + size).coerceAtMost(items.size)
                Flux.fromIterable(items.subList(from, to))
                    .flatMap { message -> toMessageResponse(thread, message) }
                    .collectList()
                    .map { messages ->
                        ThreadMessagesPageResponse(
                            items = messages,
                            meta = PaginationMeta(
                                page = page,
                                size = size,
                                totalElements = total.toLong(),
                                totalPages = totalPages,
                                hasNext = page < totalPages,
                                hasPrev = page > 1 && totalPages > 0,
                            ),
                        )
                    }
            }
    }

    private fun toMessageResponse(thread: MessageThreadEntity, message: MessageEntity): Mono<ThreadMessageResponse> {
        return attachmentsForMessage(thread.threadId, message)
            .map { attachments ->
                ThreadMessageResponse(
                    messageId = message.messageId,
                    senderUserId = message.senderUserId,
                    senderType = if (message.senderUserId == thread.requesterUserId) "requester" else "supplier",
                    body = message.body,
                    attachments = attachments,
                    sentAt = message.createdAt.toInstant(ZoneOffset.UTC),
                    createdAt = message.createdAt.toInstant(ZoneOffset.UTC),
                )
            }
    }

    private fun attachmentsForMessage(threadId: String, message: MessageEntity): Mono<List<ThreadAttachmentResponse>> {
        val ids = message.getAttachmentIdList()
        if (ids.isEmpty()) {
            return Mono.just(emptyList())
        }

        return attachmentMetadataRepository.findAllById(ids)
            .filter { attachment -> attachment.ownerType == "thread" && attachment.ownerId == threadId }
            .map { attachment ->
                ThreadAttachmentResponse(
                    attachmentId = attachment.attachmentId,
                    fileName = attachment.fileName,
                    contentType = attachment.contentType,
                    fileSize = attachment.fileSize,
                    url = attachmentUrl(threadId, attachment.attachmentId),
                    createdAt = attachment.createdAt.toInstant(ZoneOffset.UTC),
                )
            }
            .collectList()
    }

    private fun loadThreadAttachment(threadId: String, attachmentId: String): Mono<AttachmentMetadataEntity> {
        return attachmentMetadataRepository.findById(attachmentId)
            .switchIfEmpty { Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found")) }
            .flatMap { attachment ->
                if (attachment.ownerType != "thread" || attachment.ownerId != threadId) {
                    Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"))
                } else {
                    Mono.just(attachment)
                }
            }
    }

    private fun toSummaryResponse(document: ThreadSummaryDocument, role: UserRole): ThreadSummaryResponse {
        return ThreadSummaryResponse(
            threadId = document.threadId,
            requestId = document.requestId,
            requestTitle = document.requestTitle,
            otherParty = when (role) {
                UserRole.REQUESTER -> ThreadOtherPartyResponse(document.supplierCompanyName, "supplier", "supplier", document.supplierProfileId)
                else -> ThreadOtherPartyResponse(document.requesterBusinessName, "requester", "requester", null)
            },
            unreadCount = if (role == UserRole.REQUESTER) document.requesterUnreadCount else document.supplierUnreadCount,
            contactShareState = document.contactShareState,
            lastMessage = document.lastMessage?.let { lastMessage ->
                val unreadCount = if (role == UserRole.REQUESTER) document.requesterUnreadCount else document.supplierUnreadCount
                ThreadLastMessageResponse(
                    messageId = lastMessage.messageId,
                    senderUserId = lastMessage.senderUserId,
                    body = lastMessage.body,
                    hasAttachments = lastMessage.hasAttachments,
                    sentAt = lastMessage.createdAt,
                    read = unreadCount == 0L || (role == UserRole.REQUESTER && lastMessage.senderUserId == document.requesterUserId),
                    createdAt = lastMessage.createdAt,
                )
            },
            createdAt = document.createdAt,
            updatedAt = document.updatedAt,
        )
    }

    private fun sharedContact(thread: MessageThreadEntity): Mono<ThreadSharedContactResponse> {
        if (thread.contactShareState != "mutually_approved") {
            return Mono.empty()
        }

        return Mono.zip(
            requesterBusinessProfileQueryService.findByUserId(thread.requesterUserId),
            supplierProfileRepository.findById(thread.supplierProfileId),
        ).map { tuple ->
            val requester = tuple.t1
            val supplier = tuple.t2
            ThreadSharedContactResponse(
                requester = ThreadParticipantContactResponse(
                    name = requester.contactName,
                    phone = requester.contactPhone,
                    email = requester.contactEmail,
                ),
                supplier = ThreadParticipantContactResponse(
                    name = supplier.representativeName,
                    phone = supplier.contactPhone,
                    email = supplier.contactEmail,
                ),
            )
        }
    }

    private fun toContactShareActionResponse(
        thread: MessageThreadEntity,
        sharedContact: ThreadSharedContactResponse?,
    ): ContactShareActionResponse {
        val approvedAt = listOfNotNull(
            thread.contactShareRequesterApprovedAt,
            thread.contactShareSupplierApprovedAt,
        ).maxOrNull()?.toInstant(ZoneOffset.UTC)

        return ContactShareActionResponse(
            threadId = thread.threadId,
            contactShareState = thread.contactShareState,
            requestedBy = thread.contactShareRequestedByRole,
            requestedAt = thread.contactShareRequestedAt?.toInstant(ZoneOffset.UTC),
            approvedAt = approvedAt,
            revokedAt = thread.contactShareRevokedAt?.toInstant(ZoneOffset.UTC),
            contactShareRequestedByRole = thread.contactShareRequestedByRole,
            requesterApproved = thread.contactShareRequesterApprovedAt != null,
            supplierApproved = thread.contactShareSupplierApprovedAt != null,
            sharedContact = sharedContact,
        )
    }

    private fun toOtherParty(detail: ThreadDetailDocument, role: UserRole): ThreadOtherPartyResponse {
        return when (role) {
            UserRole.REQUESTER -> ThreadOtherPartyResponse(detail.supplierCompanyName, "supplier", "supplier", detail.supplierProfileId)
            else -> ThreadOtherPartyResponse(detail.requesterBusinessName, "requester", "requester", null)
        }
    }

    private fun attachmentUrl(threadId: String, attachmentId: String): String = "/api/threads/$threadId/attachments/$attachmentId"

    private data class ParticipantContext(
        val supplierProfileId: String?,
    )

    private data class ThreadMessagesPageResponse(
        val items: List<ThreadMessageResponse>,
        val meta: PaginationMeta,
    )
}
