package dev.riss.fsm.command.thread

import dev.riss.fsm.shared.error.ThreadAccessDeniedException
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.Mockito.`when`
import org.mockito.Mockito.any
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import reactor.test.StepVerifier
import java.time.LocalDateTime

@ExtendWith(MockitoExtension::class)
class ThreadCommandServiceTest {
    @Mock private lateinit var messageThreadRepository: MessageThreadRepository
    @Mock private lateinit var messageRepository: MessageRepository
    @Mock private lateinit var readStateRepository: ThreadParticipantReadStateRepository

    private lateinit var threadCommandService: ThreadCommandService

    @BeforeEach
    fun setUp() {
        threadCommandService = ThreadCommandService(messageThreadRepository, messageRepository, readStateRepository)
    }

    @Test
    fun `createThread returns existing thread when full participant tuple already present`() {
        val existing = thread()
        `when`(
            messageThreadRepository.findByRequestIdAndRequesterUserIdAndSupplierProfileId("req_1", "usr_req", "sprof_1")
        ).thenReturn(Mono.just(existing))

        StepVerifier.create(threadCommandService.createThread(CreateThreadCommand("req_1", "usr_req", "sprof_1", "quo_1")))
            .assertNext { result ->
                assertEquals(false, result.isNew)
                assertEquals("thd_existing", result.thread.threadId)
            }
            .verifyComplete()
    }

    @Test
    fun `createThread saves new thread when absent`() {
        `when`(
            messageThreadRepository.findByRequestIdAndRequesterUserIdAndSupplierProfileId("req_1", "usr_req", "sprof_1")
        ).thenReturn(Mono.empty())
        `when`(messageThreadRepository.save(any())).thenAnswer { invocation -> Mono.just(invocation.getArgument<MessageThreadEntity>(0)) }

        StepVerifier.create(threadCommandService.createThread(CreateThreadCommand("req_1", "usr_req", "sprof_1", null)))
            .assertNext { result ->
                assertEquals(true, result.isNew)
                assertEquals("req_1", result.thread.requestId)
                assertEquals("sprof_1", result.thread.supplierProfileId)
                assertEquals(null, result.thread.quoteId)
            }
            .verifyComplete()
    }

    @Test
    fun `sendMessage rejects empty payload`() {
        StepVerifier.create(
            threadCommandService.sendMessage(
                SendMessageCommand(
                    threadId = "thd_1",
                    senderUserId = "usr_req",
                    body = null,
                    attachmentIds = emptyList(),
                )
            )
        )
            .expectErrorSatisfies { error ->
                assertTrue(error is ResponseStatusException)
                assertEquals(HttpStatus.BAD_REQUEST, (error as ResponseStatusException).statusCode)
            }
            .verify()
    }

    @Test
    fun `supplier participant can send attachment-only message`() {
        val thread = thread()
        `when`(messageThreadRepository.findById(thread.threadId)).thenReturn(Mono.just(thread))
        `when`(messageRepository.save(any())).thenAnswer { invocation -> Mono.just(invocation.getArgument<MessageEntity>(0)) }

        StepVerifier.create(
            threadCommandService.sendMessage(
                SendMessageCommand(
                    threadId = thread.threadId,
                    senderUserId = "usr_sup",
                    senderSupplierProfileId = "sprof_1",
                    body = null,
                    attachmentIds = listOf("att_1"),
                )
            )
        )
            .assertNext { message ->
                assertEquals(thread.threadId, message.threadId)
                assertEquals(listOf("att_1"), message.getAttachmentIdList())
            }
            .verifyComplete()
    }

    @Test
    fun `non participant cannot send message`() {
        val thread = thread()
        `when`(messageThreadRepository.findById(thread.threadId)).thenReturn(Mono.just(thread))

        StepVerifier.create(
            threadCommandService.sendMessage(
                SendMessageCommand(
                    threadId = thread.threadId,
                    senderUserId = "usr_other",
                    senderSupplierProfileId = null,
                    body = "hello",
                    attachmentIds = null,
                )
            )
        )
            .expectError(ThreadAccessDeniedException::class.java)
            .verify()
    }

    @Test
    fun `markThreadAsRead creates read state for supplier participant`() {
        val thread = thread()
        `when`(messageThreadRepository.findById(thread.threadId)).thenReturn(Mono.just(thread))
        `when`(readStateRepository.findByThreadIdAndUserId(thread.threadId, "usr_sup")).thenReturn(Mono.empty())
        `when`(readStateRepository.save(any())).thenAnswer { invocation -> Mono.just(invocation.getArgument<ThreadParticipantReadStateEntity>(0)) }

        StepVerifier.create(
            threadCommandService.markThreadAsRead(
                MarkThreadAsReadCommand(threadId = thread.threadId, userId = "usr_sup", supplierProfileId = "sprof_1")
            )
        )
            .assertNext { result ->
                assertEquals(thread.threadId, result.threadId)
                assertEquals(0L, result.unreadCount)
            }
            .verifyComplete()
    }

    @Test
    fun `request contact share sets requested state and requester role`() {
        val thread = thread()
        `when`(messageThreadRepository.findById(thread.threadId)).thenReturn(Mono.just(thread))
        `when`(messageThreadRepository.save(any())).thenAnswer { invocation -> Mono.just(invocation.getArgument<MessageThreadEntity>(0)) }

        StepVerifier.create(
            threadCommandService.requestContactShare(
                ContactShareCommand(threadId = thread.threadId, userId = "usr_req")
            )
        )
            .assertNext { result ->
                assertEquals("requested", result.contactShareState)
                assertEquals("requester", result.contactShareRequestedByRole)
            }
            .verifyComplete()
    }

    @Test
    fun `approve contact share reaches mutual state after both participants approve`() {
        val requested = thread().copy(
            contactShareState = "requested",
            contactShareRequestedByRole = "requester",
            contactShareRequestedAt = LocalDateTime.now(),
            contactShareSupplierApprovedAt = LocalDateTime.now(),
        )
        `when`(messageThreadRepository.findById(requested.threadId)).thenReturn(Mono.just(requested))
        `when`(messageThreadRepository.save(any())).thenAnswer { invocation -> Mono.just(invocation.getArgument<MessageThreadEntity>(0)) }

        StepVerifier.create(
            threadCommandService.approveContactShare(
                ContactShareCommand(threadId = requested.threadId, userId = "usr_req")
            )
        )
            .assertNext { result ->
                assertEquals("mutually_approved", result.contactShareState)
                assertTrue(result.contactShareRequesterApprovedAt != null)
                assertTrue(result.contactShareSupplierApprovedAt != null)
            }
            .verifyComplete()
    }

    @Test
    fun `revoke contact share requires original requester`() {
        val requested = thread().copy(
            contactShareState = "requested",
            contactShareRequestedByRole = "requester",
            contactShareRequestedAt = LocalDateTime.now(),
        )
        `when`(messageThreadRepository.findById(requested.threadId)).thenReturn(Mono.just(requested))

        StepVerifier.create(
            threadCommandService.revokeContactShare(
                ContactShareCommand(threadId = requested.threadId, userId = "usr_sup", supplierProfileId = "sprof_1")
            )
        )
            .expectErrorSatisfies { error ->
                assertTrue(error is dev.riss.fsm.shared.error.ContactShareApprovalConflictException)
                assertEquals("Only the original requester can revoke contact sharing", error.message)
            }
            .verify()
    }

    @Test
    fun `revoke contact share is forbidden after mutual approval`() {
        val approved = thread().copy(
            contactShareState = "mutually_approved",
            contactShareRequestedByRole = "requester",
            contactShareRequestedAt = LocalDateTime.now(),
            contactShareRequesterApprovedAt = LocalDateTime.now(),
            contactShareSupplierApprovedAt = LocalDateTime.now(),
        )
        `when`(messageThreadRepository.findById(approved.threadId)).thenReturn(Mono.just(approved))

        StepVerifier.create(
            threadCommandService.revokeContactShare(
                ContactShareCommand(threadId = approved.threadId, userId = "usr_req")
            )
        )
            .expectErrorSatisfies { error ->
                assertTrue(error is dev.riss.fsm.shared.error.ContactShareRevokeForbiddenException)
            }
            .verify()
    }

    @Test
    fun `request contact share after revoke starts a new cycle`() {
        val revoked = thread().copy(
            contactShareState = "revoked",
            contactShareRequestedByRole = "supplier",
            contactShareRequestedAt = LocalDateTime.now().minusHours(2),
            contactShareRequesterApprovedAt = LocalDateTime.now().minusHours(1),
            contactShareSupplierApprovedAt = null,
            contactShareRevokedByRole = "supplier",
            contactShareRevokedAt = LocalDateTime.now().minusMinutes(30),
        )
        `when`(messageThreadRepository.findById(revoked.threadId)).thenReturn(Mono.just(revoked))
        `when`(messageThreadRepository.save(any())).thenAnswer { invocation -> Mono.just(invocation.getArgument<MessageThreadEntity>(0)) }

        StepVerifier.create(
            threadCommandService.requestContactShare(
                ContactShareCommand(threadId = revoked.threadId, userId = "usr_req")
            )
        )
            .assertNext { result ->
                assertEquals("requested", result.contactShareState)
                assertEquals("requester", result.contactShareRequestedByRole)
                assertTrue(result.contactShareRequestedAt != null)
                assertEquals(null, result.contactShareRequesterApprovedAt)
                assertEquals(null, result.contactShareSupplierApprovedAt)
                assertEquals(null, result.contactShareRevokedByRole)
                assertEquals(null, result.contactShareRevokedAt)
            }
            .verifyComplete()
    }

    private fun thread() = MessageThreadEntity(
        threadId = "thd_existing",
        requestId = "req_1",
        requesterUserId = "usr_req",
        supplierProfileId = "sprof_1",
        quoteId = "quo_1",
        contactShareState = "not_requested",
        contactShareRequestedByRole = null,
        contactShareRequestedAt = null,
        contactShareRequesterApprovedAt = null,
        contactShareSupplierApprovedAt = null,
        contactShareRevokedByRole = null,
        contactShareRevokedAt = null,
        createdAt = LocalDateTime.now(),
    )
}
