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
}
