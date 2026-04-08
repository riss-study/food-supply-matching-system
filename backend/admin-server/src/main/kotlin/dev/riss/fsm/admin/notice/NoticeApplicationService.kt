package dev.riss.fsm.admin.notice

import dev.riss.fsm.command.notice.NoticeCommandService
import dev.riss.fsm.command.notice.NoticeRepository
import dev.riss.fsm.command.supplier.AttachmentMetadataEntity
import dev.riss.fsm.command.supplier.AttachmentMetadataRepository
import dev.riss.fsm.query.admin.stats.notice.AdminNoticeViewDocument
import dev.riss.fsm.query.admin.stats.notice.AdminNoticeViewRepository
import dev.riss.fsm.query.admin.stats.notice.PublicNoticeViewDocument
import dev.riss.fsm.query.admin.stats.notice.PublicNoticeViewRepository
import dev.riss.fsm.shared.auth.UserRole
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.springframework.core.io.buffer.DataBufferUtils
import org.springframework.http.HttpStatus
import org.springframework.http.codec.multipart.FilePart
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import reactor.kotlin.core.publisher.switchIfEmpty
import java.nio.file.Files
import java.nio.file.Path
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.util.UUID

data class NoticePageResult(
    val items: List<NoticeListItemResponse>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
)

@Service
class NoticeApplicationService(
    @org.springframework.beans.factory.annotation.Value("\${fsm.storage.local-root:backend/local-storage}") private val localRoot: String,
    private val noticeCommandService: NoticeCommandService,
    private val noticeRepository: NoticeRepository,
    private val attachmentMetadataRepository: AttachmentMetadataRepository,
    private val adminNoticeViewRepository: AdminNoticeViewRepository,
    private val publicNoticeViewRepository: PublicNoticeViewRepository,
) {

    fun list(
        principal: AuthenticatedUserPrincipal,
        state: String?,
        fromDate: String?,
        toDate: String?,
        page: Int,
        size: Int,
        sort: String,
        order: String,
    ): Mono<NoticePageResult> {
        val normalizedPage = page.coerceAtLeast(1)
        val normalizedSize = size.coerceIn(1, 100)
        val parsedFrom = fromDate?.let { java.time.LocalDate.parse(it).atStartOfDay().toInstant(java.time.ZoneOffset.UTC) }
        val parsedTo = toDate?.let { java.time.LocalDate.parse(it).plusDays(1).atStartOfDay().toInstant(java.time.ZoneOffset.UTC) }
        return ensureAdmin(principal).then(Mono.defer {
            if (state != null) {
                adminNoticeViewRepository.findAllByStateOrderByCreatedAtDesc(state)
                    .collectList()
            } else {
                adminNoticeViewRepository.findAllByOrderByCreatedAtDesc()
                    .collectList()
            }
        }).map { documents ->
            var filtered = documents
            if (parsedFrom != null) filtered = filtered.filter { it.createdAt >= parsedFrom }
            if (parsedTo != null) filtered = filtered.filter { it.createdAt < parsedTo }
            filtered
        }.map { documents ->
            val sorted = documents.sortedWith(adminComparator(sort, order))
            val totalElements = sorted.size.toLong()
            val totalPages = ((totalElements + normalizedSize - 1) / normalizedSize).toInt().coerceAtLeast(1)
            val start = ((normalizedPage - 1) * normalizedSize).coerceAtLeast(0)
            val end = (start + normalizedSize).coerceAtMost(sorted.size)
            val paged = if (start < sorted.size) sorted.subList(start, end) else emptyList()

            NoticePageResult(
                items = paged.map {
                    NoticeListItemResponse(
                        noticeId = it.noticeId,
                        title = it.title,
                        excerpt = it.excerpt,
                        state = it.state,
                        author = it.authorId,
                        authorId = it.authorId,
                        publishedAt = it.publishedAt,
                        viewCount = it.viewCount,
                        createdAt = it.createdAt,
                        updatedAt = it.updatedAt,
                    )
                },
                page = normalizedPage,
                size = normalizedSize,
                totalElements = totalElements,
                totalPages = totalPages,
            )
        }
    }

    fun detail(principal: AuthenticatedUserPrincipal, noticeId: String): Mono<NoticeDetailResponse> {
        return ensureAdmin(principal).then(Mono.defer {
            noticeRepository.findById(noticeId)
                .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Notice not found")))
                .flatMap { notice ->
                    noticeAttachments(notice.noticeId)
                        .map { attachments ->
                            NoticeDetailResponse(
                                noticeId = notice.noticeId,
                                title = notice.title,
                                body = notice.body,
                                state = notice.state,
                                authorId = notice.authorId,
                                publishedAt = notice.publishedAt?.toInstant(ZoneOffset.UTC),
                                viewCount = notice.viewCount,
                                attachments = attachments,
                                createdAt = notice.createdAt.toInstant(ZoneOffset.UTC),
                                updatedAt = notice.updatedAt.toInstant(ZoneOffset.UTC),
                            )
                        }
                }
        })
    }

    fun create(
        principal: AuthenticatedUserPrincipal,
        request: CreateNoticeRequest,
    ): Mono<CreateNoticeResponse> {
        return ensureAdmin(principal).then(Mono.defer {
            noticeCommandService.createNotice(
                title = request.title,
                body = request.body,
                authorId = principal.userId,
                initialState = request.state ?: "draft",
                publishImmediately = request.publishImmediately,
            ).flatMap { entity ->
                val adminDoc = AdminNoticeViewDocument(
                    noticeId = entity.noticeId,
                    title = entity.title,
                    excerpt = entity.body.take(200),
                    state = entity.state,
                    authorId = entity.authorId,
                    publishedAt = entity.publishedAt?.toInstant(ZoneOffset.UTC),
                    viewCount = entity.viewCount,
                    createdAt = entity.createdAt.toInstant(ZoneOffset.UTC),
                    updatedAt = entity.updatedAt.toInstant(ZoneOffset.UTC),
                )
                val publicDoc = if (entity.state == "published") {
                    PublicNoticeViewDocument(
                        noticeId = entity.noticeId,
                        title = entity.title,
                        excerpt = entity.body.take(200),
                        publishedAt = entity.publishedAt!!.toInstant(ZoneOffset.UTC),
                        viewCount = entity.viewCount,
                    )
                } else null

                adminNoticeViewRepository.save(adminDoc)
                    .then(publicDoc?.let { publicNoticeViewRepository.save(it) } ?: Mono.empty())
                    .thenReturn(
                        CreateNoticeResponse(
                            noticeId = entity.noticeId,
                            state = entity.state,
                            createdAt = entity.createdAt.toInstant(ZoneOffset.UTC),
                        )
                    )
            }
        })
    }

    fun update(
        principal: AuthenticatedUserPrincipal,
        noticeId: String,
        request: UpdateNoticeRequest,
    ): Mono<UpdateNoticeResponse> {
        return ensureAdmin(principal).then(Mono.defer {
            noticeCommandService.updateNotice(
                noticeId = noticeId,
                title = request.title,
                body = request.body,
            ).flatMap { updatedEntity ->
                val finalEntityMono = if (request.state != null) {
                    noticeCommandService.changeState(noticeId, request.state)
                } else {
                    Mono.just(updatedEntity)
                }

                finalEntityMono.flatMap { finalEntity ->

                    val adminDoc = AdminNoticeViewDocument(
                        noticeId = finalEntity.noticeId,
                        title = finalEntity.title,
                        excerpt = finalEntity.body.take(200),
                        state = finalEntity.state,
                        authorId = finalEntity.authorId,
                        publishedAt = finalEntity.publishedAt?.toInstant(ZoneOffset.UTC),
                        viewCount = finalEntity.viewCount,
                        createdAt = finalEntity.createdAt.toInstant(ZoneOffset.UTC),
                        updatedAt = finalEntity.updatedAt.toInstant(ZoneOffset.UTC),
                    )

                    val publicMono: Mono<*> = when (finalEntity.state) {
                        "published" -> {
                            val publishedAt = finalEntity.publishedAt
                                ?: return@flatMap Mono.error(ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Published notice missing publishedAt"))
                            val publicDoc = PublicNoticeViewDocument(
                                noticeId = finalEntity.noticeId,
                                title = finalEntity.title,
                                excerpt = finalEntity.body.take(200),
                                publishedAt = publishedAt.toInstant(ZoneOffset.UTC),
                                viewCount = finalEntity.viewCount,
                            )
                            publicNoticeViewRepository.save(publicDoc)
                        }

                        else -> publicNoticeViewRepository.deleteById(finalEntity.noticeId)
                    }

                    adminNoticeViewRepository.save(adminDoc)
                        .then(publicMono)
                        .thenReturn(
                            UpdateNoticeResponse(
                                noticeId = finalEntity.noticeId,
                                state = finalEntity.state,
                                publishedAt = finalEntity.publishedAt?.toInstant(ZoneOffset.UTC),
                                updatedAt = finalEntity.updatedAt.toInstant(ZoneOffset.UTC),
                            )
                        )
                }
            }.switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Notice not found")))
        })
    }

    fun uploadAttachment(
        principal: AuthenticatedUserPrincipal,
        noticeId: String,
        file: FilePart,
    ): Mono<NoticeAttachmentResponse> {
        return ensureAdmin(principal).then(Mono.defer {
            noticeRepository.findById(noticeId)
                .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Notice not found")))
                .flatMap { _ ->
                    val attachmentId = "att_${UUID.randomUUID()}"
                    val sanitized = file.filename().replace(Regex("[^A-Za-z0-9._-]"), "_")
                    val storageKey = "notice/$noticeId/$attachmentId-$sanitized"
                    val targetPath = Path.of(localRoot, storageKey)
                    Files.createDirectories(targetPath.parent)

                    file.transferTo(targetPath).then(Mono.defer {
                        val fileSize = Files.size(targetPath)
                        val contentType = file.headers().contentType?.toString() ?: "application/octet-stream"
                        val entity = AttachmentMetadataEntity(
                            attachmentId = attachmentId,
                            ownerType = "notice",
                            ownerId = noticeId,
                            attachmentKind = "notice_attachment",
                            fileName = file.filename(),
                            contentType = contentType,
                            fileSize = fileSize,
                            storageKey = storageKey,
                            createdAt = LocalDateTime.now(),
                        ).apply { newEntity = true }

                        attachmentMetadataRepository.save(entity).map { saved ->
                            NoticeAttachmentResponse(
                                attachmentId = saved.attachmentId,
                                fileName = saved.fileName,
                                contentType = saved.contentType,
                                fileSize = saved.fileSize,
                                url = "/api/admin/notices/$noticeId/attachments/${saved.attachmentId}/download",
                                createdAt = saved.createdAt.toInstant(ZoneOffset.UTC),
                            )
                        }
                    })
                }
        })
    }

    private fun resolveStoragePath(storageKey: String): Path {
        return Path.of(localRoot, storageKey)
    }

    fun getAttachmentFile(
        principal: AuthenticatedUserPrincipal,
        noticeId: String,
        attachmentId: String,
    ): Mono<Pair<AttachmentMetadataEntity, org.springframework.core.io.FileSystemResource>> {
        return ensureAdmin(principal).then(Mono.defer {
            attachmentMetadataRepository.findById(attachmentId)
                .filter { it.ownerType == "notice" && it.ownerId == noticeId }
                .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found")))
                .map { entity ->
                    val file = resolveStoragePath(entity.storageKey).toFile()
                    if (!file.exists()) throw ResponseStatusException(HttpStatus.NOT_FOUND, "File not found on disk")
                    Pair(entity, org.springframework.core.io.FileSystemResource(file))
                }
        })
    }

    fun deleteAttachment(
        principal: AuthenticatedUserPrincipal,
        noticeId: String,
        attachmentId: String,
    ): Mono<Void> {
        return ensureAdmin(principal).then(Mono.defer {
            attachmentMetadataRepository.findById(attachmentId)
                .filter { it.ownerType == "notice" && it.ownerId == noticeId }
                .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found")))
                .flatMap { entity ->
                    val filePath = resolveStoragePath(entity.storageKey)
                    try { Files.deleteIfExists(filePath) } catch (_: Exception) {}
                    attachmentMetadataRepository.deleteById(attachmentId)
                }
        })
    }

    private fun noticeAttachments(noticeId: String): Mono<List<NoticeAttachmentResponse>> {
        return attachmentMetadataRepository.findAllByOwnerTypeAndOwnerId("notice", noticeId)
            .map {
                NoticeAttachmentResponse(
                    attachmentId = it.attachmentId,
                    fileName = it.fileName,
                    contentType = it.contentType,
                    fileSize = it.fileSize,
                    url = "/api/admin/notices/${it.ownerId}/attachments/${it.attachmentId}/download",
                    createdAt = it.createdAt.toInstant(ZoneOffset.UTC),
                )
            }
            .collectList()
    }

    private fun adminComparator(sort: String, order: String): Comparator<AdminNoticeViewDocument> {
        val descending = order != "asc"
        val comparator = when (sort) {
            "publishedAt" -> compareBy<AdminNoticeViewDocument> { it.publishedAt ?: Instant.EPOCH }
            "viewCount" -> compareBy<AdminNoticeViewDocument> { it.viewCount }
            "title" -> compareBy<AdminNoticeViewDocument> { it.title.lowercase() }
            else -> compareBy<AdminNoticeViewDocument> { it.createdAt }
        }
        return if (descending) comparator.reversed() else comparator
    }

    private fun ensureAdmin(principal: AuthenticatedUserPrincipal): Mono<Void> {
        return if (principal.role == UserRole.ADMIN) Mono.empty()
        else Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required"))
    }
}
