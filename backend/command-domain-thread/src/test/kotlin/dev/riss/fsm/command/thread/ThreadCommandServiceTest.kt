package dev.riss.fsm.command.thread

import org.junit.jupiter.api.Assertions.assertEquals
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
class ThreadCommandServiceTest {
    @Mock private lateinit var messageThreadRepository: MessageThreadRepository

    private lateinit var threadCommandService: ThreadCommandService

    @BeforeEach
    fun setUp() {
        threadCommandService = ThreadCommandService(messageThreadRepository)
    }

    @Test
    fun `createThread returns existing thread when already present`() {
        val existing = MessageThreadEntity(
            threadId = "thd_existing",
            requestId = "req_1",
            requesterUserId = "usr_req",
            supplierProfileId = "sprof_1",
            quoteId = "quo_1",
            createdAt = LocalDateTime.now(),
        )
        `when`(messageThreadRepository.findByRequestIdAndSupplierProfileId("req_1", "sprof_1")).thenReturn(Mono.just(existing))

        StepVerifier.create(threadCommandService.createThread(CreateThreadCommand("req_1", "usr_req", "sprof_1", "quo_1")))
            .assertNext { thread -> assertEquals("thd_existing", thread.threadId) }
            .verifyComplete()
    }

    @Test
    fun `createThread saves new thread when absent`() {
        `when`(messageThreadRepository.findByRequestIdAndSupplierProfileId("req_1", "sprof_1")).thenReturn(Mono.empty())
        `when`(messageThreadRepository.save(any())).thenAnswer { invocation -> Mono.just(invocation.getArgument<MessageThreadEntity>(0)) }

        StepVerifier.create(threadCommandService.createThread(CreateThreadCommand("req_1", "usr_req", "sprof_1", "quo_1")))
            .assertNext { thread ->
                assertEquals("req_1", thread.requestId)
                assertEquals("sprof_1", thread.supplierProfileId)
            }
            .verifyComplete()
    }
}
