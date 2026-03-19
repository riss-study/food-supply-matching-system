package dev.riss.fsm.api.requester

import dev.riss.fsm.shared.api.ApiSuccessResponse
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import reactor.core.publisher.Mono
import java.time.Instant

class RequesterBusinessProfileControllerTest {

    private val service = mock(RequesterBusinessProfileApplicationService::class.java)
    private val controller = RequesterBusinessProfileController(service)
    private val principal = AuthenticatedUserPrincipal("usr_1", "req@example.com", dev.riss.fsm.shared.auth.UserRole.REQUESTER)

    @Test
    fun submitReturnsCreatedEnvelope() {
        val request = SubmitRequesterBusinessProfileRequest(
            businessName = "Example Foods",
            businessRegistrationNumber = "123-45-67890",
            contactName = "홍길동",
            contactPhone = "010-1234-5678",
            contactEmail = "contact@example.com",
            verificationScope = "domestic",
        )
        val response = RequesterBusinessProfileSubmitResponse("bprof_1", "submitted", Instant.now())
        `when`(service.submit(principal, request)).thenReturn(Mono.just(response))

        val result = controller.submit(principal, request).block()!!

        assertEquals(201, result.statusCode.value())
        assertEquals(100, result.body?.code)
        assertEquals("submitted", result.body?.data?.approvalState)
    }

    @Test
    fun getReturnsProfileEnvelope() {
        val response = RequesterBusinessProfileResponse(
            profileId = "bprof_1",
            businessName = "Example Foods",
            businessRegistrationNumber = "123-45-67890",
            contactName = "홍길동",
            contactPhone = "010-1234-5678",
            contactEmail = "contact@example.com",
            verificationScope = "domestic",
            approvalState = "submitted",
            submittedAt = Instant.now(),
            approvedAt = null,
            rejectedAt = null,
            rejectionReason = null,
            updatedAt = Instant.now(),
        )
        `when`(service.get(principal)).thenReturn(Mono.just(response))

        val result = controller.get(principal).block() as ApiSuccessResponse<RequesterBusinessProfileResponse>
        assertEquals(100, result.code)
        assertEquals("submitted", result.data.approvalState)
    }
}
