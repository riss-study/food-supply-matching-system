package dev.riss.fsm.api.request

import dev.riss.fsm.command.request.RequestEntity
import dev.riss.fsm.command.request.RequestRepository
import dev.riss.fsm.command.request.TargetedSupplierLinkRepository
import dev.riss.fsm.command.supplier.SupplierProfileEntity
import dev.riss.fsm.command.supplier.SupplierProfileRepository
import dev.riss.fsm.shared.auth.UserRole
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.Mockito.*
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import reactor.test.StepVerifier
import java.time.LocalDateTime

@ExtendWith(MockitoExtension::class)
class RequestAccessGuardTest {

    @Mock
    private lateinit var requestRepository: RequestRepository

    @Mock
    private lateinit var targetedSupplierLinkRepository: TargetedSupplierLinkRepository

    @Mock
    private lateinit var supplierProfileRepository: SupplierProfileRepository

    private lateinit var requestAccessGuard: RequestAccessGuard

    private val requesterPrincipal = AuthenticatedUserPrincipal("usr_req", "req@test.com", UserRole.REQUESTER)
    private val supplierPrincipal = AuthenticatedUserPrincipal("usr_sup", "sup@test.com", UserRole.SUPPLIER)
    private val adminPrincipal = AuthenticatedUserPrincipal("usr_adm", "adm@test.com", UserRole.ADMIN)

    @BeforeEach
    fun setup() {
        requestAccessGuard = RequestAccessGuard(requestRepository, targetedSupplierLinkRepository, supplierProfileRepository)
    }

    @Test
    fun `request owner can access their own request regardless of state`() {
        val requestId = "req_1"
        val entity = RequestEntity(
            requestId = requestId,
            requesterUserId = requesterPrincipal.userId,
            mode = "public",
            title = "Test",
            category = "snack",
            desiredVolume = 1000,
            targetPriceMin = null,
            targetPriceMax = null,
            certificationRequirement = null,
            rawMaterialRule = null,
            packagingRequirement = null,
            deliveryRequirement = null,
            notes = null,
            state = "draft",
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )

        `when`(requestRepository.findById(requestId)).thenReturn(Mono.just(entity))

        StepVerifier.create(requestAccessGuard.checkRequestAccess(requesterPrincipal, requestId))
            .assertNext { result ->
                assertEquals(requestId, result.requestId)
            }
            .verifyComplete()
    }

    @Test
    fun `approved supplier can access public open request`() {
        val requestId = "req_1"
        val entity = RequestEntity(
            requestId = requestId,
            requesterUserId = "usr_other",
            mode = "public",
            title = "Test",
            category = "snack",
            desiredVolume = 1000,
            targetPriceMin = null,
            targetPriceMax = null,
            certificationRequirement = null,
            rawMaterialRule = null,
            packagingRequirement = null,
            deliveryRequirement = null,
            notes = null,
            state = "open",
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )
        val supplierProfile = SupplierProfileEntity(
            profileId = "sprof_1",
            supplierUserId = supplierPrincipal.userId,
            companyName = "Test Supplier",
            representativeName = "Kim",
            contactPhone = null,
            contactEmail = null,
            region = "Seoul",
            categories = "snack",
            equipmentSummary = null,
            monthlyCapacity = 10000,
            moq = 100,
            oemAvailable = true,
            odmAvailable = false,
            rawMaterialSupport = true,
            packagingLabelingSupport = true,
            introduction = null,
            verificationState = "approved",
            exposureState = "visible",
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )

        `when`(requestRepository.findById(requestId)).thenReturn(Mono.just(entity))
        `when`(supplierProfileRepository.findBySupplierUserId(supplierPrincipal.userId)).thenReturn(Mono.just(supplierProfile))

        StepVerifier.create(requestAccessGuard.checkRequestAccess(supplierPrincipal, requestId))
            .assertNext { result ->
                assertEquals(requestId, result.requestId)
            }
            .verifyComplete()
    }

    @Test
    fun `unapproved supplier cannot access public open request`() {
        val requestId = "req_1"
        val entity = RequestEntity(
            requestId = requestId,
            requesterUserId = "usr_other",
            mode = "public",
            title = "Test",
            category = "snack",
            desiredVolume = 1000,
            targetPriceMin = null,
            targetPriceMax = null,
            certificationRequirement = null,
            rawMaterialRule = null,
            packagingRequirement = null,
            deliveryRequirement = null,
            notes = null,
            state = "open",
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )
        val supplierProfile = SupplierProfileEntity(
            profileId = "sprof_1",
            supplierUserId = supplierPrincipal.userId,
            companyName = "Test Supplier",
            representativeName = "Kim",
            contactPhone = null,
            contactEmail = null,
            region = "Seoul",
            categories = "snack",
            equipmentSummary = null,
            monthlyCapacity = 10000,
            moq = 100,
            oemAvailable = true,
            odmAvailable = false,
            rawMaterialSupport = true,
            packagingLabelingSupport = true,
            introduction = null,
            verificationState = "draft",
            exposureState = "hidden",
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )

        `when`(requestRepository.findById(requestId)).thenReturn(Mono.just(entity))
        `when`(supplierProfileRepository.findBySupplierUserId(supplierPrincipal.userId)).thenReturn(Mono.just(supplierProfile))

        StepVerifier.create(requestAccessGuard.checkRequestAccess(supplierPrincipal, requestId))
            .expectErrorSatisfies { error ->
                assertTrue(error is ResponseStatusException)
                assertEquals(HttpStatus.FORBIDDEN, (error as ResponseStatusException).statusCode)
            }
            .verify()
    }

    @Test
    fun `non-owner cannot access draft request`() {
        val requestId = "req_1"
        val entity = RequestEntity(
            requestId = requestId,
            requesterUserId = "usr_other",
            mode = "public",
            title = "Test",
            category = "snack",
            desiredVolume = 1000,
            targetPriceMin = null,
            targetPriceMax = null,
            certificationRequirement = null,
            rawMaterialRule = null,
            packagingRequirement = null,
            deliveryRequirement = null,
            notes = null,
            state = "draft",
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )

        `when`(requestRepository.findById(requestId)).thenReturn(Mono.just(entity))

        StepVerifier.create(requestAccessGuard.checkRequestAccess(requesterPrincipal, requestId))
            .expectErrorSatisfies { error ->
                assertTrue(error is ResponseStatusException)
                assertEquals(HttpStatus.FORBIDDEN, (error as ResponseStatusException).statusCode)
            }
            .verify()
    }

    @Test
    fun `targeted supplier can access targeted request when in list`() {
        val requestId = "req_1"
        val supplierProfileId = "sprof_1"
        val entity = RequestEntity(
            requestId = requestId,
            requesterUserId = "usr_other",
            mode = "targeted",
            title = "Test",
            category = "snack",
            desiredVolume = 1000,
            targetPriceMin = null,
            targetPriceMax = null,
            certificationRequirement = null,
            rawMaterialRule = null,
            packagingRequirement = null,
            deliveryRequirement = null,
            notes = null,
            state = "open",
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )
        val supplierProfile = SupplierProfileEntity(
            profileId = supplierProfileId,
            supplierUserId = supplierPrincipal.userId,
            companyName = "Test Supplier",
            representativeName = "Kim",
            contactPhone = null,
            contactEmail = null,
            region = "Seoul",
            categories = "snack",
            equipmentSummary = null,
            monthlyCapacity = 10000,
            moq = 100,
            oemAvailable = true,
            odmAvailable = false,
            rawMaterialSupport = true,
            packagingLabelingSupport = true,
            introduction = null,
            verificationState = "approved",
            exposureState = "visible",
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )

        `when`(requestRepository.findById(requestId)).thenReturn(Mono.just(entity))
        `when`(supplierProfileRepository.findBySupplierUserId(supplierPrincipal.userId)).thenReturn(Mono.just(supplierProfile))
        `when`(targetedSupplierLinkRepository.existsByRequestIdAndSupplierProfileId(requestId, supplierProfileId))
            .thenReturn(Mono.just(true))

        StepVerifier.create(requestAccessGuard.checkRequestAccess(supplierPrincipal, requestId))
            .assertNext { result ->
                assertEquals(requestId, result.requestId)
            }
            .verifyComplete()
    }

    @Test
    fun `non-targeted supplier cannot access targeted request`() {
        val requestId = "req_1"
        val supplierProfileId = "sprof_1"
        val entity = RequestEntity(
            requestId = requestId,
            requesterUserId = "usr_other",
            mode = "targeted",
            title = "Test",
            category = "snack",
            desiredVolume = 1000,
            targetPriceMin = null,
            targetPriceMax = null,
            certificationRequirement = null,
            rawMaterialRule = null,
            packagingRequirement = null,
            deliveryRequirement = null,
            notes = null,
            state = "open",
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )
        val supplierProfile = SupplierProfileEntity(
            profileId = supplierProfileId,
            supplierUserId = supplierPrincipal.userId,
            companyName = "Test Supplier",
            representativeName = "Kim",
            contactPhone = null,
            contactEmail = null,
            region = "Seoul",
            categories = "snack",
            equipmentSummary = null,
            monthlyCapacity = 10000,
            moq = 100,
            oemAvailable = true,
            odmAvailable = false,
            rawMaterialSupport = true,
            packagingLabelingSupport = true,
            introduction = null,
            verificationState = "approved",
            exposureState = "visible",
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )

        `when`(requestRepository.findById(requestId)).thenReturn(Mono.just(entity))
        `when`(supplierProfileRepository.findBySupplierUserId(supplierPrincipal.userId)).thenReturn(Mono.just(supplierProfile))
        `when`(targetedSupplierLinkRepository.existsByRequestIdAndSupplierProfileId(requestId, supplierProfileId))
            .thenReturn(Mono.just(false))

        StepVerifier.create(requestAccessGuard.checkRequestAccess(supplierPrincipal, requestId))
            .expectErrorSatisfies { error ->
                assertTrue(error is ResponseStatusException)
                assertEquals(HttpStatus.FORBIDDEN, (error as ResponseStatusException).statusCode)
            }
            .verify()
    }

    @Test
    fun `checkCanSubmitQuote allows approved supplier for open public request`() {
        val requestId = "req_1"
        val entity = RequestEntity(
            requestId = requestId,
            requesterUserId = "usr_other",
            mode = "public",
            title = "Test",
            category = "snack",
            desiredVolume = 1000,
            targetPriceMin = null,
            targetPriceMax = null,
            certificationRequirement = null,
            rawMaterialRule = null,
            packagingRequirement = null,
            deliveryRequirement = null,
            notes = null,
            state = "open",
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )
        val supplierProfile = SupplierProfileEntity(
            profileId = "sprof_1",
            supplierUserId = supplierPrincipal.userId,
            companyName = "Test Supplier",
            representativeName = "Kim",
            contactPhone = null,
            contactEmail = null,
            region = "Seoul",
            categories = "snack",
            equipmentSummary = null,
            monthlyCapacity = 10000,
            moq = 100,
            oemAvailable = true,
            odmAvailable = false,
            rawMaterialSupport = true,
            packagingLabelingSupport = true,
            introduction = null,
            verificationState = "approved",
            exposureState = "visible",
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )

        `when`(requestRepository.findById(requestId)).thenReturn(Mono.just(entity))
        `when`(supplierProfileRepository.findBySupplierUserId(supplierPrincipal.userId)).thenReturn(Mono.just(supplierProfile))

        StepVerifier.create(requestAccessGuard.checkCanSubmitQuote(supplierPrincipal, requestId))
            .assertNext { result ->
                assertEquals(requestId, result.requestId)
            }
            .verifyComplete()
    }

    @Test
    fun `checkCanSubmitQuote rejects closed request`() {
        val requestId = "req_1"
        val entity = RequestEntity(
            requestId = requestId,
            requesterUserId = "usr_other",
            mode = "public",
            title = "Test",
            category = "snack",
            desiredVolume = 1000,
            targetPriceMin = null,
            targetPriceMax = null,
            certificationRequirement = null,
            rawMaterialRule = null,
            packagingRequirement = null,
            deliveryRequirement = null,
            notes = null,
            state = "closed",
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )

        `when`(requestRepository.findById(requestId)).thenReturn(Mono.just(entity))

        StepVerifier.create(requestAccessGuard.checkCanSubmitQuote(supplierPrincipal, requestId))
            .expectErrorSatisfies { error ->
                assertTrue(error is ResponseStatusException)
                assertEquals(HttpStatus.FORBIDDEN, (error as ResponseStatusException).statusCode)
            }
            .verify()
    }

    @Test
    fun `returns 404 when request not found`() {
        val requestId = "req_nonexistent"

        `when`(requestRepository.findById(requestId)).thenReturn(Mono.empty())

        StepVerifier.create(requestAccessGuard.checkRequestAccess(requesterPrincipal, requestId))
            .expectErrorSatisfies { error ->
                assertTrue(error is ResponseStatusException)
                assertEquals(HttpStatus.NOT_FOUND, (error as ResponseStatusException).statusCode)
            }
            .verify()
    }
}
