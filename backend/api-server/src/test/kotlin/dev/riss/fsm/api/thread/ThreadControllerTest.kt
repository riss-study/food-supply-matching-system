package dev.riss.fsm.api.thread

import dev.riss.fsm.shared.auth.UserRole
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import reactor.core.publisher.Mono
import java.time.Instant

class ThreadControllerTest {

    private val service = mock(ThreadApplicationService::class.java)
    private val controller = ThreadController(service)
    private val principal = AuthenticatedUserPrincipal("usr_1", "req@example.com", UserRole.REQUESTER)

    @Test
    fun `create thread returns created status`() {
        val request = CreateThreadRequest(supplierId = "sprof_1")
        val response = CreateThreadResponse(
            threadId = "thd_1",
            requestId = "req_1",
            supplierProfileId = "sprof_1",
            createdAt = Instant.parse("2026-03-20T00:00:00Z"),
            created = true,
        )
        `when`(service.createThread(principal, "req_1", request)).thenReturn(Mono.just(response))

        val result = controller.createThread(principal, "req_1", request).block()!!

        assertEquals(201, result.statusCode.value())
        assertEquals("Thread created", result.body?.message)
        assertEquals("thd_1", result.body?.data?.threadId)
    }

    @Test
    fun `send message returns created status`() {
        val request = SendThreadMessageRequest(body = "hello")
        val response = SendThreadMessageResponse(
            messageId = "msg_1",
            threadId = "thd_1",
            createdAt = Instant.parse("2026-03-20T00:00:00Z"),
        )
        `when`(service.sendMessage(principal, "thd_1", request)).thenReturn(Mono.just(response))

        val result = controller.sendMessage(principal, "thd_1", request).block()!!

        assertEquals(201, result.statusCode.value())
        assertEquals("Message sent", result.body?.message)
        assertEquals("msg_1", result.body?.data?.messageId)
    }

    @Test
    fun `request contact share returns success envelope`() {
        val response = ContactShareActionResponse(
            threadId = "thd_1",
            contactShareState = "requested",
            requestedBy = "requester",
            requestedAt = Instant.parse("2026-03-20T00:00:00Z"),
            approvedAt = null,
            revokedAt = null,
            contactShareRequestedByRole = "requester",
            requesterApproved = false,
            supplierApproved = false,
            sharedContact = null,
        )
        `when`(service.requestContactShare(principal, "thd_1")).thenReturn(Mono.just(response))

        val result = controller.requestContactShare(principal, "thd_1").block()!!

        assertEquals("Contact share requested", result.message)
        assertEquals("requested", result.data?.contactShareState)
    }

    @Test
    fun `approve contact share returns success envelope`() {
        val response = ContactShareActionResponse(
            threadId = "thd_1",
            contactShareState = "mutually_approved",
            requestedBy = "requester",
            requestedAt = Instant.parse("2026-03-20T00:00:00Z"),
            approvedAt = Instant.parse("2026-03-20T01:00:00Z"),
            revokedAt = null,
            contactShareRequestedByRole = "requester",
            requesterApproved = true,
            supplierApproved = true,
            sharedContact = ThreadSharedContactResponse(
                requester = ThreadParticipantContactResponse("요청자", "010-1111-2222", "req@test.com"),
                supplier = ThreadParticipantContactResponse("공급자", "010-3333-4444", "sup@test.com"),
            ),
        )
        `when`(service.approveContactShare(principal, "thd_1")).thenReturn(Mono.just(response))

        val result = controller.approveContactShare(principal, "thd_1").block()!!

        assertEquals("Contact share mutually approved", result.message)
        assertEquals("mutually_approved", result.data?.contactShareState)
    }

    @Test
    fun `revoke contact share returns success envelope`() {
        val response = ContactShareActionResponse(
            threadId = "thd_1",
            contactShareState = "revoked",
            requestedBy = "requester",
            requestedAt = Instant.parse("2026-03-20T00:00:00Z"),
            approvedAt = null,
            revokedAt = Instant.parse("2026-03-20T01:00:00Z"),
            contactShareRequestedByRole = "requester",
            requesterApproved = false,
            supplierApproved = false,
            sharedContact = null,
        )
        `when`(service.revokeContactShare(principal, "thd_1")).thenReturn(Mono.just(response))

        val result = controller.revokeContactShare(principal, "thd_1").block()!!

        assertEquals("Contact share request revoked", result.message)
        assertEquals("revoked", result.data?.contactShareState)
    }
}
