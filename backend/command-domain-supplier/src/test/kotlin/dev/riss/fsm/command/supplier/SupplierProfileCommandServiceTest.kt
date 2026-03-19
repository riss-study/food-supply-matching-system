package dev.riss.fsm.command.supplier

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import reactor.core.publisher.Mono
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDateTime

class SupplierProfileCommandServiceTest {

    private val repository = mock(SupplierProfileRepository::class.java)
    private val service = SupplierProfileCommandService(repository)

    @Test
    fun createStartsInDraftAndHidden() {
        `when`(repository.existsBySupplierUserId("usr_supplier")).thenReturn(Mono.just(false))
        `when`(repository.save(org.mockito.Mockito.any(SupplierProfileEntity::class.java))).thenAnswer { invocation ->
            Mono.just(invocation.arguments[0] as SupplierProfileEntity)
        }

        val result = service.create(
            "usr_supplier",
            CreateSupplierProfileCommand(
                companyName = "Example Supplier",
                representativeName = "김공급",
                region = "경기도 화성시",
                categories = listOf("snack"),
                equipmentSummary = null,
                monthlyCapacity = 50000,
                moq = 1000,
                oemAvailable = true,
                odmAvailable = false,
                rawMaterialSupport = true,
                packagingLabelingSupport = true,
                introduction = null,
            ),
        ).block()!!

        assertEquals("draft", result.verificationState)
        assertEquals("hidden", result.exposureState)
    }

    @Test
    fun approvedProfileCannotBeUpdated() {
        `when`(repository.findBySupplierUserId("usr_supplier")).thenReturn(
            Mono.just(
                SupplierProfileEntity(
                    profileId = "sprof_1",
                    supplierUserId = "usr_supplier",
                    companyName = "Example Supplier",
                    representativeName = "김공급",
                    region = "경기도 화성시",
                    categories = "snack",
                    equipmentSummary = null,
                    monthlyCapacity = 50000,
                    moq = 1000,
                    oemAvailable = true,
                    odmAvailable = false,
                    rawMaterialSupport = true,
                    packagingLabelingSupport = true,
                    introduction = null,
                    verificationState = "approved",
                    exposureState = "visible",
                    createdAt = LocalDateTime.now(),
                    updatedAt = LocalDateTime.now(),
                )
            )
        )

        assertThrows(ResponseStatusException::class.java) {
            service.update("usr_supplier", UpdateSupplierProfileCommand(companyName = "Updated Supplier")).block()
        }
    }
}
