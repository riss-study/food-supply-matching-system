package dev.riss.fsm.api.notice

import dev.riss.fsm.command.notice.NoticeRepository
import dev.riss.fsm.command.supplier.AttachmentMetadataRepository
import dev.riss.fsm.query.admin.stats.notice.PublicNoticeViewDocument
import dev.riss.fsm.query.admin.stats.notice.PublicNoticeViewRepository
import dev.riss.fsm.shared.file.FileStorageService
import org.springframework.core.io.FileSystemResource
import org.springframework.http.ContentDisposition
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import reactor.kotlin.core.publisher.switchIfEmpty
import java.time.LocalDateTime
import java.time.ZoneOffset

data class PublicNoticePageResult(
    val items: List<PublicNoticeListItem>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
)

@Service
class PublicNoticeApplicationService(
    private val noticeRepository: NoticeRepository,
    private val attachmentMetadataRepository: AttachmentMetadataRepository,
    private val fileStorageService: FileStorageService,
    private val publicNoticeViewRepository: PublicNoticeViewRepository,
) {

    fun list(page: Int, size: Int, sort: String, order: String): Mono<PublicNoticePageResult> {
        val normalizedPage = page.coerceAtLeast(1)
        val normalizedSize = size.coerceIn(1, 50)
        return publicNoticeViewRepository.findAll()
            .collectList()
            .map { documents ->
                val sorted = documents.sortedWith(publicComparator(sort, order))
                val totalElements = sorted.size.toLong()
                val totalPages = ((totalElements + normalizedSize - 1) / normalizedSize).toInt().coerceAtLeast(1)
                val start = ((normalizedPage - 1) * normalizedSize).coerceAtLeast(0)
                val end = (start + normalizedSize).coerceAtMost(sorted.size)
                val paged = if (start < sorted.size) sorted.subList(start, end) else emptyList()

                PublicNoticePageResult(
                    items = paged.map {
                        PublicNoticeListItem(
                            noticeId = it.noticeId,
                            title = it.title,
                            excerpt = it.excerpt,
                            publishedAt = it.publishedAt,
                            viewCount = it.viewCount,
                        )
                    },
                    page = normalizedPage,
                    size = normalizedSize,
                    totalElements = totalElements,
                    totalPages = totalPages,
                )
            }
    }

    fun detail(noticeId: String): Mono<PublicNoticeDetailResponse> {
        return loadPublishedNotice(noticeId)
            .flatMap { entity ->
                val updatedEntity = entity.copy(
                    viewCount = entity.viewCount + 1,
                    updatedAt = LocalDateTime.now(),
                )

                noticeRepository.save(updatedEntity)
                    .flatMap { saved ->
                        val publishedAt = saved.publishedAt
                            ?: return@flatMap Mono.error<PublicNoticeDetailResponse>(
                                ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Published notice missing publishedAt")
                            )
                        val publicDoc = PublicNoticeViewDocument(
                            noticeId = saved.noticeId,
                            title = saved.title,
                            excerpt = saved.body.take(200),
                            publishedAt = publishedAt.toInstant(ZoneOffset.UTC),
                            viewCount = saved.viewCount,
                        )
                        publicNoticeViewRepository.save(publicDoc)
                            .then(noticeAttachments(saved.noticeId))
                            .map { attachments ->
                                PublicNoticeDetailResponse(
                                    noticeId = saved.noticeId,
                                    title = saved.title,
                                    body = saved.body,
                                    publishedAt = publishedAt.toInstant(ZoneOffset.UTC),
                                    viewCount = saved.viewCount,
                                    attachments = attachments,
                                )
                            }
                    }
            }
    }

    fun downloadAttachment(noticeId: String, attachmentId: String): Mono<ResponseEntity<FileSystemResource>> {
        return loadPublishedNotice(noticeId)
            .then(loadNoticeAttachment(noticeId, attachmentId))
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

    private fun noticeAttachments(noticeId: String): Mono<List<PublicNoticeAttachmentResponse>> {
        return attachmentMetadataRepository.findAllByOwnerTypeAndOwnerId("notice", noticeId)
            .map {
                PublicNoticeAttachmentResponse(
                    attachmentId = it.attachmentId,
                    fileName = it.fileName,
                    fileSize = it.fileSize,
                    url = noticeAttachmentUrl(noticeId, it.attachmentId),
                )
            }
            .collectList()
    }

    private fun loadPublishedNotice(noticeId: String): Mono<dev.riss.fsm.command.notice.NoticeEntity> {
        return noticeRepository.findById(noticeId)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Notice not found")))
            .flatMap { entity ->
                if (entity.state != "published") {
                    Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Notice not found"))
                } else {
                    Mono.just(entity)
                }
            }
    }

    private fun loadNoticeAttachment(noticeId: String, attachmentId: String): Mono<dev.riss.fsm.command.supplier.AttachmentMetadataEntity> {
        return attachmentMetadataRepository.findById(attachmentId)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found")))
            .flatMap { attachment ->
                if (attachment.ownerType != "notice" || attachment.ownerId != noticeId) {
                    Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"))
                } else {
                    Mono.just(attachment)
                }
            }
    }

    private fun noticeAttachmentUrl(noticeId: String, attachmentId: String): String =
        "/api/notices/$noticeId/attachments/$attachmentId"

    private fun publicComparator(sort: String, order: String): Comparator<PublicNoticeViewDocument> {
        val descending = order != "asc"
        val comparator = when (sort) {
            "title" -> compareBy<PublicNoticeViewDocument> { it.title.lowercase() }
            else -> compareBy<PublicNoticeViewDocument> { it.publishedAt }
        }
        return if (descending) comparator.reversed() else comparator
    }
}
