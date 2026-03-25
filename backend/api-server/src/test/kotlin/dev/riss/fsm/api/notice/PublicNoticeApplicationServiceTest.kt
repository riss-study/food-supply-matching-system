package dev.riss.fsm.api.notice

import dev.riss.fsm.command.notice.NoticeEntity
import dev.riss.fsm.command.notice.NoticeRepository
import dev.riss.fsm.command.supplier.AttachmentMetadataEntity
import dev.riss.fsm.command.supplier.AttachmentMetadataRepository
import dev.riss.fsm.query.admin.stats.notice.PublicNoticeViewDocument
import dev.riss.fsm.query.admin.stats.notice.PublicNoticeViewRepository
import dev.riss.fsm.shared.file.FileStorageService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import reactor.test.StepVerifier
import java.time.Instant
import java.time.LocalDateTime

class PublicNoticeApplicationServiceTest {

    private val noticeRepository = mock(NoticeRepository::class.java)
    private val attachmentMetadataRepository = mock(AttachmentMetadataRepository::class.java)
    private val fileStorageService = mock(FileStorageService::class.java)
    private val publicNoticeViewRepository = mock(PublicNoticeViewRepository::class.java)
    private val service = PublicNoticeApplicationService(noticeRepository, attachmentMetadataRepository, fileStorageService, publicNoticeViewRepository)

    @Test
    fun `list sorts published notices by requested field`() {
        `when`(publicNoticeViewRepository.findAll()).thenReturn(
            Flux.just(
                PublicNoticeViewDocument("notice_2", "Zulu", "excerpt", Instant.parse("2026-03-22T00:00:00Z"), 1),
                PublicNoticeViewDocument("notice_1", "Alpha", "excerpt", Instant.parse("2026-03-21T00:00:00Z"), 3),
            )
        )

        StepVerifier.create(service.list(page = 1, size = 1, sort = "title", order = "asc"))
            .assertNext { response ->
                assertEquals(1, response.items.size)
                assertEquals("Alpha", response.items.first().title)
                assertEquals(2L, response.totalElements)
                assertEquals(2, response.totalPages)
            }
            .verifyComplete()
    }

    @Test
    fun `detail increments view count and returns attachments`() {
        val entity = noticeEntity(state = "published", viewCount = 4)
        val saved = entity.copy(viewCount = 5, updatedAt = LocalDateTime.of(2026, 3, 25, 9, 30))

        `when`(noticeRepository.findById(entity.noticeId)).thenReturn(Mono.just(entity))
        `when`(noticeRepository.save(any(NoticeEntity::class.java))).thenReturn(Mono.just(saved))
        `when`(publicNoticeViewRepository.save(any(PublicNoticeViewDocument::class.java))).thenAnswer { Mono.just(it.arguments[0] as PublicNoticeViewDocument) }
        `when`(attachmentMetadataRepository.findAllByOwnerTypeAndOwnerId("notice", entity.noticeId)).thenReturn(
            Flux.just(
                AttachmentMetadataEntity(
                    attachmentId = "att_notice_1",
                    ownerType = "notice",
                    ownerId = entity.noticeId,
                    attachmentKind = "notice-body",
                    fileName = "notice.pdf",
                    contentType = "application/pdf",
                    fileSize = 1024,
                    storageKey = "notice/${entity.noticeId}/notice.pdf",
                    createdAt = LocalDateTime.of(2026, 3, 24, 12, 0),
                )
            )
        )

        StepVerifier.create(service.detail(entity.noticeId))
            .assertNext { response ->
                assertEquals(5L, response.viewCount)
                assertEquals(1, response.attachments.size)
                assertEquals("notice.pdf", response.attachments.first().fileName)
                assertEquals("/api/notices/${entity.noticeId}/attachments/att_notice_1", response.attachments.first().url)
            }
            .verifyComplete()
    }

    @Test
    fun `detail rejects unpublished notices`() {
        val entity = noticeEntity(state = "draft")
        `when`(noticeRepository.findById(entity.noticeId)).thenReturn(Mono.just(entity))

        StepVerifier.create(service.detail(entity.noticeId))
            .expectErrorMatches { error ->
                error is org.springframework.web.server.ResponseStatusException && error.statusCode.value() == 404
            }
            .verify()
    }

    private fun noticeEntity(state: String, viewCount: Long = 0): NoticeEntity {
        return NoticeEntity(
            noticeId = "notice_1",
            title = "시스템 점검 안내",
            body = "3월 25일 오전 시스템 점검이 예정되어 있습니다.",
            state = state,
            authorId = "admin_1",
            publishedAt = if (state == "published") LocalDateTime.of(2026, 3, 24, 9, 0) else null,
            viewCount = viewCount,
            createdAt = LocalDateTime.of(2026, 3, 24, 9, 0),
            updatedAt = LocalDateTime.of(2026, 3, 24, 9, 0),
        )
    }
}
