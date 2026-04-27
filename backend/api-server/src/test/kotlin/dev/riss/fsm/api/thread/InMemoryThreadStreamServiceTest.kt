package dev.riss.fsm.api.thread

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.assertEquals
import reactor.test.StepVerifier
import java.time.Duration
import java.time.Instant

class InMemoryThreadStreamServiceTest {

    private fun newService() = InMemoryThreadStreamService()

    private fun sampleEvent(messageId: String = "msg_1") = ThreadStreamEvent.NewMessage(
        message = ThreadMessageResponse(
            messageId = messageId,
            senderUserId = "usr_1",
            senderType = "requester",
            body = "hi",
            attachments = emptyList(),
            sentAt = Instant.parse("2026-04-27T12:00:00Z"),
            createdAt = Instant.parse("2026-04-27T12:00:00Z"),
        ),
    )

    @Test
    fun `subscriber receives published event`() {
        val service = newService()
        val flux = service.subscribe("thd_1")

        StepVerifier.create(flux)
            .then { service.publish("thd_1", sampleEvent("msg_1")).block() }
            .assertNext { event ->
                assertEquals("NewMessage", event.type)
                assertEquals("msg_1", event.eventIdOrNull())
            }
            .thenCancel()
            .verify(Duration.ofSeconds(2))
    }

    @Test
    fun `publish without subscribers is no-op (drop)`() {
        val service = newService()
        // publish 가 아무도 듣지 않을 때도 예외 없음
        service.publish("thd_orphan", sampleEvent("msg_x")).block(Duration.ofSeconds(1))
    }

    @Test
    fun `different threads are isolated`() {
        val service = newService()
        val fluxA = service.subscribe("thd_A")

        StepVerifier.create(fluxA)
            .then {
                service.publish("thd_B", sampleEvent("msg_for_B")).block()
                service.publish("thd_A", sampleEvent("msg_for_A")).block()
            }
            .assertNext { event ->
                // thd_B 의 메시지는 thd_A 구독자에 도달 안 함
                assertEquals("msg_for_A", event.eventIdOrNull())
            }
            .thenCancel()
            .verify(Duration.ofSeconds(2))
    }
}
