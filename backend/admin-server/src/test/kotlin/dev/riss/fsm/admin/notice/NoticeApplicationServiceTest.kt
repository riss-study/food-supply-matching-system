package dev.riss.fsm.admin.notice

import dev.riss.fsm.command.notice.NoticeCommandService
import dev.riss.fsm.command.notice.NoticeEntity
import dev.riss.fsm.command.notice.NoticeRepository
import dev.riss.fsm.command.supplier.AttachmentMetadataEntity
import dev.riss.fsm.command.supplier.AttachmentMetadataRepository
import dev.riss.fsm.query.admin.stats.notice.AdminNoticeViewDocument
import dev.riss.fsm.query.admin.stats.notice.AdminNoticeViewRepository
import dev.riss.fsm.query.admin.stats.notice.PublicNoticeViewDocument
import dev.riss.fsm.query.admin.stats.notice.PublicNoticeViewRepository
import dev.riss.fsm.shared.auth.UserRole
import dev.riss.fsm.shared.file.StorageProperties
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito.mock
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.time.LocalDateTime

class NoticeApplicationServiceTest {

    private val noticeCommandService = mock(NoticeCommandService::class.java)
    private val noticeRepository = mock(NoticeRepository::class.java)
    private val attachmentMetadataRepository = mock(AttachmentMetadataRepository::class.java)
    private val adminNoticeViewRepository = mock(AdminNoticeViewRepository::class.java)
    private val publicNoticeViewRepository = mock(PublicNoticeViewRepository::class.java)
    private val service = NoticeApplicationService(
        StorageProperties(localRoot = "backend/local-storage"),
        noticeCommandService,
        noticeRepository,
        attachmentMetadataRepository,
        adminNoticeViewRepository,
        publicNoticeViewRepository,
    )
    private val principal = AuthenticatedUserPrincipal("admin_1", "admin@example.com", UserRole.ADMIN)

    @Test
    fun `create honors published state and persists public projection`() {
        val entity = noticeEntity(state = "published")
        val request = CreateNoticeRequest(
            title = entity.title,
            body = entity.body,
            state = "published",
            publishImmediately = false,
        )

        `when`(noticeCommandService.createNotice(entity.title, entity.body, principal.userId, "published", false))
            .thenReturn(Mono.just(entity))
        `when`(adminNoticeViewRepository.save(any(AdminNoticeViewDocument::class.java))).thenAnswer { Mono.just(it.arguments[0] as AdminNoticeViewDocument) }
        `when`(publicNoticeViewRepository.save(any(PublicNoticeViewDocument::class.java))).thenAnswer { Mono.just(it.arguments[0] as PublicNoticeViewDocument) }

        val response = service.create(principal, request).block()!!

        assertEquals("published", response.state)
        assertEquals(entity.createdAt, response.createdAt.atOffset(java.time.ZoneOffset.UTC).toLocalDateTime())
        verify(noticeCommandService).createNotice(entity.title, entity.body, principal.userId, "published", false)
        verify(publicNoticeViewRepository, times(1)).save(any(PublicNoticeViewDocument::class.java))
    }

    @Test
    fun `detail returns notice attachments`() {
        val entity = noticeEntity(state = "published")
        `when`(noticeRepository.findById(entity.noticeId)).thenReturn(Mono.just(entity))
        `when`(attachmentMetadataRepository.findAllByOwnerTypeAndOwnerId("notice", entity.noticeId)).thenReturn(
            Flux.just(
                AttachmentMetadataEntity(
                    attachmentId = "att_notice_1",
                    ownerType = "notice",
                    ownerId = entity.noticeId,
                    attachmentKind = "notice-body",
                    fileName = "ops-guide.pdf",
                    contentType = "application/pdf",
                    fileSize = 4096,
                    storageKey = "notice/${entity.noticeId}/ops-guide.pdf",
                    createdAt = LocalDateTime.of(2026, 3, 24, 12, 0),
                )
            )
        )

        val response = service.detail(principal, entity.noticeId).block()!!

        assertEquals(1, response.attachments.size)
        val attachment = response.attachments.first()
        assertEquals("ops-guide.pdf", attachment.fileName)
        assertEquals("/api/admin/notices/${entity.noticeId}/attachments/${attachment.attachmentId}/download", attachment.url)
    }

    private fun noticeEntity(state: String): NoticeEntity {
        return NoticeEntity(
            noticeId = "notice_1",
            title = "시스템 점검 안내",
            body = "3월 25일 오전 시스템 점검이 예정되어 있습니다.",
            state = state,
            authorId = principal.userId,
            publishedAt = if (state == "published") LocalDateTime.of(2026, 3, 24, 9, 0) else null,
            viewCount = 0,
            createdAt = LocalDateTime.of(2026, 3, 24, 9, 0),
            updatedAt = LocalDateTime.of(2026, 3, 24, 9, 0),
        )
    }
}
