package dev.riss.fsm.command.notice

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.Mockito.`when`
import org.mockito.Mockito.any
import org.mockito.junit.jupiter.MockitoExtension
import reactor.core.publisher.Mono
import reactor.test.StepVerifier
import java.time.LocalDateTime

@ExtendWith(MockitoExtension::class)
class NoticeCommandServiceTest {

    @Mock
    private lateinit var noticeRepository: NoticeRepository

    private lateinit var service: NoticeCommandService

    @BeforeEach
    fun setup() {
        service = NoticeCommandService(noticeRepository)
    }

    private fun mockSavePassthrough() {
        `when`(noticeRepository.save(any())).thenAnswer { invocation ->
            Mono.just(invocation.getArgument<NoticeEntity>(0))
        }
    }

    private fun draftEntity(
        noticeId: String = "notc_1",
        title: String = "Original Title",
        body: String = "Original body",
        state: String = "draft",
        publishedAt: LocalDateTime? = null,
    ) = NoticeEntity(
        noticeId = noticeId,
        title = title,
        body = body,
        state = state,
        authorId = "admin_1",
        publishedAt = publishedAt,
        viewCount = 0,
        createdAt = LocalDateTime.of(2026, 1, 1, 0, 0),
        updatedAt = LocalDateTime.of(2026, 1, 1, 0, 0),
    )

    @Test
    fun `createNotice defaults to draft state with no publishedAt`() {
        mockSavePassthrough()

        StepVerifier.create(service.createNotice("Title", "Long enough body text", "admin_1"))
            .assertNext { entity ->
                assertEquals("draft", entity.state)
                assertNull(entity.publishedAt)
                assertEquals("admin_1", entity.authorId)
                assertEquals(0, entity.viewCount)
                assertNotNull(entity.createdAt)
            }
            .verifyComplete()
    }

    @Test
    fun `createNotice with publishImmediately sets published state and publishedAt`() {
        mockSavePassthrough()

        StepVerifier.create(
            service.createNotice("Title", "Body", "admin_1", publishImmediately = true)
        )
            .assertNext { entity ->
                assertEquals("published", entity.state)
                assertNotNull(entity.publishedAt)
            }
            .verifyComplete()
    }

    @Test
    fun `createNotice with initialState published is treated as published`() {
        mockSavePassthrough()

        StepVerifier.create(
            service.createNotice("Title", "Body", "admin_1", initialState = "published")
        )
            .assertNext { entity ->
                assertEquals("published", entity.state)
                assertNotNull(entity.publishedAt)
            }
            .verifyComplete()
    }

    @Test
    fun `createNotice rejects unsupported initialState with IllegalArgumentException`() {
        assertThrows(IllegalArgumentException::class.java) {
            service.createNotice("Title", "Body", "admin_1", initialState = "archived").block()
        }
    }

    @Test
    fun `updateNotice replaces only provided fields`() {
        val existing = draftEntity(title = "Old Title", body = "Old Body")
        `when`(noticeRepository.findById("notc_1")).thenReturn(Mono.just(existing))
        mockSavePassthrough()

        StepVerifier.create(service.updateNotice("notc_1", title = "New Title", body = null))
            .assertNext { entity ->
                assertEquals("New Title", entity.title)
                assertEquals("Old Body", entity.body) // body 미지정 시 유지
            }
            .verifyComplete()
    }

    @Test
    fun `publishNotice transitions draft to published and sets publishedAt when null`() {
        val existing = draftEntity(state = "draft", publishedAt = null)
        `when`(noticeRepository.findById("notc_1")).thenReturn(Mono.just(existing))
        mockSavePassthrough()

        StepVerifier.create(service.publishNotice("notc_1"))
            .assertNext { entity ->
                assertEquals("published", entity.state)
                assertNotNull(entity.publishedAt)
            }
            .verifyComplete()
    }

    @Test
    fun `publishNotice preserves existing publishedAt when re-published`() {
        val originalPublishedAt = LocalDateTime.of(2026, 3, 1, 10, 0)
        val existing = draftEntity(state = "archived", publishedAt = originalPublishedAt)
        `when`(noticeRepository.findById("notc_1")).thenReturn(Mono.just(existing))
        mockSavePassthrough()

        StepVerifier.create(service.publishNotice("notc_1"))
            .assertNext { entity ->
                assertEquals("published", entity.state)
                assertEquals(originalPublishedAt, entity.publishedAt)
            }
            .verifyComplete()
    }

    @Test
    fun `archiveNotice transitions to archived state`() {
        val existing = draftEntity(state = "published", publishedAt = LocalDateTime.now())
        `when`(noticeRepository.findById("notc_1")).thenReturn(Mono.just(existing))
        mockSavePassthrough()

        StepVerifier.create(service.archiveNotice("notc_1"))
            .assertNext { entity -> assertEquals("archived", entity.state) }
            .verifyComplete()
    }

    @Test
    fun `changeState to draft preserves publishedAt for re-publish`() {
        val originalPublishedAt = LocalDateTime.now().minusDays(3)
        val existing = draftEntity(state = "published", publishedAt = originalPublishedAt)
        `when`(noticeRepository.findById("notc_1")).thenReturn(Mono.just(existing))
        mockSavePassthrough()

        StepVerifier.create(service.changeState("notc_1", "draft"))
            .assertNext { entity ->
                assertEquals("draft", entity.state)
                assertEquals(originalPublishedAt, entity.publishedAt)
            }
            .verifyComplete()
    }

    @Test
    fun `changeState rejects unknown target state`() {
        StepVerifier.create(service.changeState("notc_1", "bogus"))
            .expectErrorMatches { it is IllegalArgumentException }
            .verify()
    }
}
