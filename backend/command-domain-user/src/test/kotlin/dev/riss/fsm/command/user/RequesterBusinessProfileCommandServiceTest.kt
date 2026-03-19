package dev.riss.fsm.command.user

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import reactor.core.publisher.Mono
import java.time.LocalDateTime
import org.springframework.web.server.ResponseStatusException

class RequesterBusinessProfileCommandServiceTest {

    private val businessProfileRepository = mock(BusinessProfileRepository::class.java)
    private val service = RequesterBusinessProfileCommandService(businessProfileRepository)

    private fun profile(state: String) = BusinessProfileEntity(
        profileId = "bprof_1",
        userAccountId = "usr_1",
        businessName = "Example Foods",
        businessRegistrationNumber = "123-45-67890",
        contactName = "홍길동",
        contactPhone = "010-1234-5678",
        contactEmail = "contact@example.com",
        verificationScope = "domestic",
        approvalState = state,
        submittedAt = null,
        approvedAt = null,
        rejectedAt = null,
        rejectionReason = null,
        updatedAt = LocalDateTime.now(),
        createdAt = LocalDateTime.now(),
    )

    @Test
    fun `submit moves requester profile to submitted`() {
        val base = profile("not_submitted")
        `when`(businessProfileRepository.findByUserAccountId("usr_1")).thenReturn(Mono.just(base))
        `when`(businessProfileRepository.save(org.mockito.Mockito.any(BusinessProfileEntity::class.java))).thenAnswer { invocation ->
            Mono.just(invocation.arguments[0] as BusinessProfileEntity)
        }

        val result = service.submit(
            "usr_1",
            SubmitBusinessProfileCommand(
                businessName = "Updated Foods",
                businessRegistrationNumber = "123-45-67890",
                contactName = "홍길동",
                contactPhone = "010-1234-5678",
                contactEmail = "contact@example.com",
                verificationScope = "domestic",
            ),
        ).block()!!

        assertEquals("submitted", result.approvalState)
        assertEquals("Updated Foods", result.businessName)
    }

    @Test
    fun `update rejects approved profile`() {
        `when`(businessProfileRepository.findByUserAccountId("usr_1")).thenReturn(Mono.just(profile("approved")))

        assertThrows(ResponseStatusException::class.java) {
            service.update("usr_1", UpdateBusinessProfileCommand(contactEmail = "new@example.com")).block()
        }
    }
}
