package dev.riss.fsm.api.supplier

import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import jakarta.validation.Valid
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import reactor.core.publisher.Mono
import java.time.Instant

class SupplierProfileControllerTest {

    private val service = mock(SupplierProfileApplicationService::class.java)
    private val controller = SupplierProfileController(service)
    private val principal = AuthenticatedUserPrincipal("usr_supplier", "supplier@example.com", dev.riss.fsm.shared.auth.UserRole.SUPPLIER)

    @Test
    fun createReturnsDraftProfileEnvelope() {
        val request = CreateSupplierProfileRequest(
            companyName = "Example Supplier",
            representativeName = "김공급",
            contactPhone = "010-1111-2222",
            contactEmail = "supplier@example.com",
            region = "경기도 화성시",
            categories = listOf("snack"),
            equipmentSummary = "자동 포장기 3대",
            monthlyCapacity = "50000",
            moq = "1000",
            oemAvailable = true,
            odmAvailable = false,
            rawMaterialSupport = true,
            packagingLabelingSupport = true,
            introduction = "건강한 간식을 만드는 공급자입니다.",
        )
        val response = SupplierProfileResponse(
            profileId = "sprof_1",
            companyName = request.companyName,
            representativeName = request.representativeName,
            contactPhone = request.contactPhone,
            contactEmail = request.contactEmail,
            region = request.region,
            categories = request.categories,
            equipmentSummary = request.equipmentSummary,
            monthlyCapacity = request.monthlyCapacity,
            moq = request.moq,
            oemAvailable = request.oemAvailable,
            odmAvailable = request.odmAvailable,
            rawMaterialSupport = request.rawMaterialSupport,
            packagingLabelingSupport = request.packagingLabelingSupport,
            introduction = request.introduction,
            verificationState = "draft",
            exposureState = "hidden",
            certifications = emptyList(),
            createdAt = Instant.now(),
            updatedAt = Instant.now(),
        )
        `when`(service.create(principal, request)).thenReturn(Mono.just(response))

        val result = controller.create(principal, request).block()!!
        assertEquals(201, result.statusCode.value())
        assertEquals(100, result.body?.code)
        assertEquals("draft", result.body?.data?.verificationState)
    }

    @Test
    fun updateRequestIsValidated() {
        val updateMethod = SupplierProfileController::class.java.methods.first { method ->
            method.name == "update"
        }

        assertTrue(updateMethod.parameters[1].annotations.any { it is Valid })
    }
}
