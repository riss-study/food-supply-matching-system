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
import dev.riss.fsm.command.thread.ThreadParticipantReadStateRepository
import dev.riss.fsm.command.user.BusinessProfileEntity
import dev.riss.fsm.command.user.BusinessProfileRepository
import dev.riss.fsm.command.supplier.SupplierProfileEntity
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

@Service
class ThreadApplicationService(
    private val requestRepository: RequestRepository,
    private val targetedSupplierLinkRepository: TargetedSupplierLinkRepository,
    private val supplierProfileRepository: SupplierProfileRepository,
    private val messageThreadRepository: MessageThreadRepository,
    private val messageRepository: MessageRepository,
    private val threadCommandService: ThreadCommandService,
    private val attachmentMetadataRepository: AttachmentMetadataRepository,
    private val fileStorageService: FileStorageService,
    private val businessProfileRepository: BusinessProfileRepository,
    private val readStateRepository: ThreadParticipantReadStateRepository,
    private val auditLogRepository: dev.riss.fsm.command.supplier.AuditLogRepository,
    private val threadStreamService: ThreadStreamService,
    private val notificationStreamService: dev.riss.fsm.api.notification.NotificationStreamService,
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

        val threadsMono: Mono<List<MessageThreadEntity>> = when (principal.role) {
            UserRole.REQUESTER -> messageThreadRepository.findAllByRequesterUserId(principal.userId).collectList()
            UserRole.SUPPLIER -> supplierProfileRepository.findBySupplierUserId(principal.userId)
                .switchIfEmpty { Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Supplier profile not found")) }
                .flatMap { profile -> messageThreadRepository.findAllBySupplierProfileId(profile.profileId).collectList() }
            else -> return Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Admin thread inbox is not available"))
        }

        return threadsMono.flatMap { allThreads ->
            Flux.fromIterable(allThreads)
                .flatMap { thread -> enrichSummary(thread, principal) }
                .collectList()
                .map { summaries ->
                    val filtered = summaries.filter { !unreadOnly || it.unreadCount > 0 }
                    val sorted = filtered.sortedByDescending { it.updatedAt }
                    val total = sorted.size
                    val totalPages = if (total == 0) 0 else ((total - 1) / safeSize) + 1
                    val from = ((safePage - 1) * safeSize).coerceAtMost(total)
                    val to = (from + safeSize).coerceAtMost(total)
                    ThreadListPageResponse(
                        items = sorted.subList(from, to),
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
                val titleMono = requestRepository.findById(thread.requestId).map { it.title }.defaultIfEmpty("")
                val requesterNameMono = businessProfileRepository.findByUserAccountId(thread.requesterUserId)
                    .map { it.businessName }.defaultIfEmpty("")
                val supplierNameMono = supplierProfileRepository.findById(thread.supplierProfileId)
                    .map { it.companyName }.defaultIfEmpty("")
                val messagesMono = loadMessagePage(thread, safePage, safeSize)

                Mono.zip(titleMono, requesterNameMono, supplierNameMono, messagesMono)
                    .flatMap { tuple ->
                        val requestTitle = tuple.t1
                        val requesterBusinessName = tuple.t2
                        val supplierCompanyName = tuple.t3
                        val messages = tuple.t4

                        fun build(sc: ThreadSharedContactResponse?): ThreadDetailResponse = ThreadDetailResponse(
                            threadId = thread.threadId,
                            requestId = thread.requestId,
                            requestTitle = requestTitle,
                            otherParty = buildOtherParty(principal.role, requesterBusinessName, supplierCompanyName, thread.supplierProfileId),
                            contactShareState = thread.contactShareState,
                            contactShareRequestedByRole = thread.contactShareRequestedByRole,
                            requesterApproved = thread.contactShareRequesterApprovedAt != null,
                            supplierApproved = thread.contactShareSupplierApprovedAt != null,
                            sharedContact = sc,
                            messages = messages.items,
                            meta = messages.meta,
                            createdAt = thread.createdAt.toInstant(ZoneOffset.UTC),
                            updatedAt = thread.createdAt.toInstant(ZoneOffset.UTC),
                        )

                        sharedContact(thread)
                            .map { sc -> build(sc) }
                            .switchIfEmpty(Mono.fromSupplier { build(null) })
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
                        .flatMap { message ->
                            // SSE event 들 (thread stream + notification stream) publish — best-effort.
                            // publish 실패해도 메시지 저장 응답은 정상 반환 (onErrorResume).
                            val publishStep = toMessageResponse(thread, message)
                                .flatMap { detail ->
                                    val threadPublish = threadStreamService.publish(threadId, ThreadStreamEvent.NewMessage(detail))

                                    val notifyStep = Mono.zip(
                                        computeNotifyTargets(thread, principal.userId),
                                        buildNotificationEvent(thread, message, principal.userId),
                                    ).flatMap { tuple ->
                                        val targets = tuple.t1
                                        val event = tuple.t2
                                        Flux.fromIterable(targets)
                                            .flatMap { uid -> notificationStreamService.publish(uid, event) }
                                            .then()
                                    }

                                    Mono.`when`(threadPublish, notifyStep)
                                }
                                .onErrorResume { Mono.empty() }

                            publishStep.then(Mono.just(SendThreadMessageResponse(
                                messageId = message.messageId,
                                threadId = message.threadId,
                                createdAt = message.createdAt.toInstant(ZoneOffset.UTC),
                            )))
                        }
                }
            }
    }

    fun markThreadAsRead(principal: AuthenticatedUserPrincipal, threadId: String): Mono<MarkThreadReadResponse> {
        return loadParticipantContext(principal)
            .flatMap { context ->
                loadAccessibleThread(principal, threadId)
                    .flatMap { _ ->
                        threadCommandService.markThreadAsRead(
                            MarkThreadAsReadCommand(
                                threadId = threadId,
                                userId = principal.userId,
                                supplierProfileId = context.supplierProfileId,
                            )
                        )
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

    private fun enrichSummary(
        thread: MessageThreadEntity,
        principal: AuthenticatedUserPrincipal,
    ): Mono<ThreadSummaryResponse> {
        val role = principal.role
        val requestTitleMono = requestRepository.findById(thread.requestId)
            .map { it.title }.defaultIfEmpty("")
        val requesterNameMono = businessProfileRepository.findByUserAccountId(thread.requesterUserId)
            .map { it.businessName }.defaultIfEmpty("")
        val supplierNameMono = supplierProfileRepository.findById(thread.supplierProfileId)
            .map { it.companyName }.defaultIfEmpty("")
        val unreadCountMono = unreadCountFor(thread, role, principal.userId)

        return Mono.zip(requestTitleMono, requesterNameMono, supplierNameMono, unreadCountMono)
            .flatMap { tuple ->
                val requestTitle = tuple.t1
                val requesterName = tuple.t2
                val supplierName = tuple.t3
                val unreadCount = tuple.t4

                fun build(lastMessage: MessageEntity?, updatedAt: LocalDateTime): ThreadSummaryResponse {
                    val lastMessageResp = lastMessage?.let { lm ->
                        ThreadLastMessageResponse(
                            messageId = lm.messageId,
                            senderUserId = lm.senderUserId,
                            body = lm.body,
                            hasAttachments = lm.getAttachmentIdList().isNotEmpty(),
                            sentAt = lm.createdAt.toInstant(ZoneOffset.UTC),
                            read = unreadCount == 0L || (role == UserRole.REQUESTER && lm.senderUserId == thread.requesterUserId),
                            createdAt = lm.createdAt.toInstant(ZoneOffset.UTC),
                        )
                    }
                    return ThreadSummaryResponse(
                        threadId = thread.threadId,
                        requestId = thread.requestId,
                        requestTitle = requestTitle,
                        otherParty = buildOtherParty(role, requesterName, supplierName, thread.supplierProfileId),
                        unreadCount = unreadCount,
                        contactShareState = thread.contactShareState,
                        lastMessage = lastMessageResp,
                        createdAt = thread.createdAt.toInstant(ZoneOffset.UTC),
                        updatedAt = updatedAt.toInstant(ZoneOffset.UTC),
                    )
                }

                messageRepository.findAllByThreadIdOrderByCreatedAtDesc(thread.threadId)
                    .next()
                    .map { last -> build(last, last.createdAt) }
                    .switchIfEmpty(Mono.fromSupplier { build(null, thread.createdAt) })
            }
    }

    private fun unreadCountFor(
        thread: MessageThreadEntity,
        role: UserRole,
        userId: String,
    ): Mono<Long> {
        return readStateRepository.findByThreadIdAndUserId(thread.threadId, userId)
            .map { it.lastReadAt }
            .defaultIfEmpty(thread.createdAt.minusYears(100))
            .flatMap { lastReadAt ->
                messageRepository.countByThreadIdAndSenderUserIdNotAndCreatedAtAfter(
                    thread.threadId,
                    userId,
                    lastReadAt,
                )
            }
    }

    private fun buildOtherParty(
        role: UserRole,
        requesterBusinessName: String,
        supplierCompanyName: String,
        supplierProfileId: String,
    ): ThreadOtherPartyResponse = when (role) {
        UserRole.REQUESTER -> ThreadOtherPartyResponse(supplierCompanyName, "supplier", "supplier", supplierProfileId)
        else -> ThreadOtherPartyResponse(requesterBusinessName, "requester", "requester", null)
    }

    /**
     * Stream / 별도 endpoint 등 외부에서 thread 접근 권한만 검증하고 싶을 때 사용.
     * loadAccessibleThread 가 private 이라 그것 그대로 노출하기보다 부수효과 (ADMIN audit) 까지
     * 동일하게 트리거되는 얇은 wrapper 로 제공.
     */
    fun ensureParticipant(principal: AuthenticatedUserPrincipal, threadId: String): Mono<Void> =
        loadAccessibleThread(principal, threadId).then()

    private fun loadAccessibleThread(principal: AuthenticatedUserPrincipal, threadId: String): Mono<MessageThreadEntity> {
        return loadParticipantContext(principal)
            .flatMap { context ->
                messageThreadRepository.findById(threadId)
                    .switchIfEmpty { Mono.error(ThreadNotFoundException()) }
                    .flatMap { thread ->
                        val isParticipant = threadCommandService.ensureThreadAccess(thread, principal.userId, context.supplierProfileId)
                        val isAdminOverride = principal.role == UserRole.ADMIN && !isParticipant
                        val canAccess = isParticipant || principal.role == UserRole.ADMIN
                        if (!canAccess) {
                            Mono.error(ThreadAccessDeniedException())
                        } else if (isAdminOverride) {
                            // 관리자가 자기 thread 가 아닌 thread 를 들여다본 기록 남김 (사후 감사용).
                            recordAdminThreadAccess(principal.userId, threadId).thenReturn(thread)
                        } else {
                            Mono.just(thread)
                        }
                    }
            }
    }

    private fun recordAdminThreadAccess(adminUserId: String, threadId: String): Mono<Void> {
        val entry = dev.riss.fsm.command.supplier.AuditLogEntity(
            auditLogId = "alog_${java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 16)}",
            actorUserId = adminUserId,
            actionType = "admin_thread_view",
            targetType = "thread",
            targetId = threadId,
            payloadSnapshot = "{}",
            createdAt = java.time.LocalDateTime.now(),
        ).apply { newEntity = true }
        return auditLogRepository.save(entry).then()
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

    private fun sharedContact(thread: MessageThreadEntity): Mono<ThreadSharedContactResponse> {
        if (thread.contactShareState != "mutually_approved") {
            return Mono.empty()
        }

        val requesterMono: Mono<BusinessProfileEntity> = businessProfileRepository.findByUserAccountId(thread.requesterUserId)
        val supplierMono: Mono<SupplierProfileEntity> = supplierProfileRepository.findById(thread.supplierProfileId)
        return Mono.zip(requesterMono, supplierMono).map { tuple ->
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

    private fun attachmentUrl(threadId: String, attachmentId: String): String = "/api/threads/$threadId/attachments/$attachmentId"

    /**
     * 글로벌 알림 stream 으로 push 할 대상 userId 들 — 발신자 본인 제외.
     * thread 의 requesterUserId, supplier_profile 의 supplierUserId 두 명이 잠재 대상.
     */
    private fun computeNotifyTargets(thread: MessageThreadEntity, senderUserId: String): Mono<List<String>> {
        val requesterTarget =
            if (thread.requesterUserId != senderUserId) Mono.just(listOf(thread.requesterUserId))
            else Mono.just(emptyList())
        val supplierTarget = supplierProfileRepository.findById(thread.supplierProfileId)
            .map { profile -> if (profile.supplierUserId != senderUserId) listOf(profile.supplierUserId) else emptyList() }
            .defaultIfEmpty(emptyList())
        return Mono.zip(requesterTarget, supplierTarget).map { tuple -> tuple.t1 + tuple.t2 }
    }

    /**
     * 글로벌 알림 페이로드 — 의뢰 제목 + 발신자 표시명 조회 (DB). fallback 으로 모든 조회 실패에도 알림은 발행됨.
     */
    private fun buildNotificationEvent(
        thread: MessageThreadEntity,
        message: dev.riss.fsm.command.thread.MessageEntity,
        senderUserId: String,
    ): Mono<dev.riss.fsm.api.notification.NotificationStreamEvent.NewMessage> {
        val titleMono = requestRepository.findById(thread.requestId)
            .map { it.title }
            .defaultIfEmpty("의뢰")

        val senderNameMono: Mono<String> = if (senderUserId == thread.requesterUserId) {
            businessProfileRepository.findByUserAccountId(senderUserId)
                .map { it.businessName }
                .defaultIfEmpty("(이름 미상)")
        } else {
            supplierProfileRepository.findById(thread.supplierProfileId)
                .map { it.companyName }
                .defaultIfEmpty("(이름 미상)")
        }

        return Mono.zip(titleMono, senderNameMono).map { tuple ->
            dev.riss.fsm.api.notification.NotificationStreamEvent.NewMessage(
                threadId = thread.threadId,
                threadTitle = tuple.t1,
                senderUserId = senderUserId,
                senderDisplayName = tuple.t2,
                preview = buildPreview(message),
                messageId = message.messageId,
                sentAt = message.createdAt.toInstant(ZoneOffset.UTC),
            )
        }
    }

    /** body 우선, 없으면 attachment placeholder. 60자 초과 시 ellipsis 추가. */
    private fun buildPreview(message: dev.riss.fsm.command.thread.MessageEntity): String {
        val body = message.body
        if (!body.isNullOrBlank()) {
            return if (body.length <= 60) body else body.substring(0, 60) + "…"
        }
        val attachmentIds = message.getAttachmentIdList()
        return when {
            attachmentIds.isEmpty() -> ""
            attachmentIds.size == 1 -> "[파일]"
            else -> "[첨부 ${attachmentIds.size}건]"
        }
    }

    private data class ParticipantContext(
        val supplierProfileId: String?,
    )

    private data class ThreadMessagesPageResponse(
        val items: List<ThreadMessageResponse>,
        val meta: PaginationMeta,
    )

}
