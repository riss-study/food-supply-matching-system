package dev.riss.fsm.api.request

import dev.riss.fsm.shared.api.ApiSuccessResponse
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import reactor.core.publisher.Mono
import java.time.Instant

class RequestControllerTest {

    private val service = mock(RequestApplicationService::class.java)
    private val queryService = mock(RequestQueryService::class.java)
    private val controller = RequestController(service, queryService)
    private val principal = AuthenticatedUserPrincipal("usr_1", "req@example.com", dev.riss.fsm.shared.auth.UserRole.REQUESTER)

    @Test
    fun createReturnsDraftEnvelope() {
        val request = CreateRequestRequest(
            mode = "public",
            title = "수제 과자 제조 의뢰",
            category = "snack",
            desiredVolume = "10000",
            targetPriceRange = CreateRequestPriceRange(min = 500, max = 1000),
            certificationRequirement = listOf("HACCP"),
            rawMaterialRule = "supplier_provided",
            packagingRequirement = "private_label",
            deliveryRequirement = "2026-06-01",
            notes = "유기농 원재료 사용 필수",
            targetSupplierIds = null,
        )
        val response = CreateRequestResponse(
            requestId = "req_1",
            state = "draft",
            createdAt = Instant.now(),
        )
        `when`(service.create(principal, request)).thenReturn(Mono.just(response))

        val result = controller.create(principal, request).block()!!

        assertEquals(201, result.statusCode.value())
        assertEquals(100, result.body?.code)
        assertEquals("draft", result.body?.data?.state)
    }
}
