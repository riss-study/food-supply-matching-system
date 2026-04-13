package dev.riss.fsm.api.request

import dev.riss.fsm.command.request.CreateRequestCommand
import dev.riss.fsm.command.request.RequestCommandService
import dev.riss.fsm.command.request.RequestRepository
import dev.riss.fsm.command.request.TargetedSupplierLinkRepository
import dev.riss.fsm.command.supplier.SupplierProfileEntity
import dev.riss.fsm.command.supplier.SupplierProfileRepository
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
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import reactor.test.StepVerifier
import java.time.LocalDateTime

@ExtendWith(MockitoExtension::class)
class RequestCommandServiceTest {

    @Mock
    private lateinit var requestRepository: RequestRepository

    @Mock
    private lateinit var targetedSupplierLinkRepository: TargetedSupplierLinkRepository

    @Mock
    private lateinit var supplierProfileRepository: SupplierProfileRepository

    private lateinit var requestCommandService: RequestCommandService

    @BeforeEach
    fun setup() {
        requestCommandService = RequestCommandService(requestRepository, targetedSupplierLinkRepository)
    }

    @Test
    fun `create request with public mode returns draft state`() {
        val command = CreateRequestCommand(
            requesterUserId = "usr_1",
            mode = "public",
            title = "Test Request",
            category = "snack",
            desiredVolume = "1000",
            targetPriceMin = null,
            targetPriceMax = null,
            certificationRequirement = null,
            rawMaterialRule = null,
            packagingRequirement = null,
            deliveryRequirement = null,
            notes = null,
            targetSupplierIds = null
        )

        `when`(requestRepository.save(any())).thenAnswer { invocation ->
            val entity = invocation.getArgument<dev.riss.fsm.command.request.RequestEntity>(0)
            Mono.just(entity)
        }

        StepVerifier.create(requestCommandService.create(command))
            .assertNext { entity ->
                assertEquals("draft", entity.state)
                assertEquals("public", entity.mode)
                assertEquals("usr_1", entity.requesterUserId)
                assertEquals("Test Request", entity.title)
            }
            .verifyComplete()
    }

    @Test
    fun `create request with targeted mode creates supplier links`() {
        val command = CreateRequestCommand(
            requesterUserId = "usr_1",
            mode = "targeted",
            title = "Targeted Request",
            category = "beverage",
            desiredVolume = "5000",
            targetPriceMin = null,
            targetPriceMax = null,
            certificationRequirement = null,
            rawMaterialRule = null,
            packagingRequirement = null,
            deliveryRequirement = null,
            notes = null,
            targetSupplierIds = listOf("sprof_1", "sprof_2")
        )

        `when`(requestRepository.save(any())).thenAnswer { invocation ->
            val entity = invocation.getArgument<dev.riss.fsm.command.request.RequestEntity>(0)
            Mono.just(entity)
        }
        `when`(targetedSupplierLinkRepository.saveAll(any<List<dev.riss.fsm.command.request.TargetedSupplierLinkEntity>>()))
            .thenAnswer { Flux.empty<dev.riss.fsm.command.request.TargetedSupplierLinkEntity>() }

        StepVerifier.create(requestCommandService.create(command))
            .assertNext { entity ->
                assertEquals("draft", entity.state)
                assertEquals("targeted", entity.mode)
            }
            .verifyComplete()

        verify(targetedSupplierLinkRepository).saveAll(any<List<dev.riss.fsm.command.request.TargetedSupplierLinkEntity>>())
    }

    @Test
    fun `publish draft request transitions to open state`() {
        val requestId = "req_1"
        val requesterUserId = "usr_1"
        val entity = dev.riss.fsm.command.request.RequestEntity(
            requestId = requestId,
            requesterUserId = requesterUserId,
            mode = "public",
            title = "Test",
            category = "snack",
            desiredVolume = "1000",
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
        `when`(requestRepository.save(any())).thenAnswer { invocation ->
            Mono.just(invocation.getArgument<dev.riss.fsm.command.request.RequestEntity>(0))
        }

        StepVerifier.create(requestCommandService.publish(requestId, requesterUserId))
            .assertNext { result ->
                assertEquals("open", result.state)
            }
            .verifyComplete()
    }

    @Test
    fun `publish non-draft request returns forbidden error`() {
        val requestId = "req_1"
        val requesterUserId = "usr_1"
        val entity = dev.riss.fsm.command.request.RequestEntity(
            requestId = requestId,
            requesterUserId = requesterUserId,
            mode = "public",
            title = "Test",
            category = "snack",
            desiredVolume = "1000",
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

        `when`(requestRepository.findById(requestId)).thenReturn(Mono.just(entity))

        StepVerifier.create(requestCommandService.publish(requestId, requesterUserId))
            .expectErrorSatisfies { error ->
                assertTrue(error is ResponseStatusException)
                assertEquals(HttpStatus.FORBIDDEN, (error as ResponseStatusException).statusCode)
            }
            .verify()
    }

    @Test
    fun `close open request transitions to closed state`() {
        val requestId = "req_1"
        val requesterUserId = "usr_1"
        val entity = dev.riss.fsm.command.request.RequestEntity(
            requestId = requestId,
            requesterUserId = requesterUserId,
            mode = "public",
            title = "Test",
            category = "snack",
            desiredVolume = "1000",
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

        `when`(requestRepository.findById(requestId)).thenReturn(Mono.just(entity))
        `when`(requestRepository.save(any())).thenAnswer { invocation ->
            Mono.just(invocation.getArgument<dev.riss.fsm.command.request.RequestEntity>(0))
        }

        StepVerifier.create(requestCommandService.close(requestId, requesterUserId))
            .assertNext { result ->
                assertEquals("closed", result.state)
            }
            .verifyComplete()
    }

    @Test
    fun `close non-open request returns forbidden error`() {
        val requestId = "req_1"
        val requesterUserId = "usr_1"
        val entity = dev.riss.fsm.command.request.RequestEntity(
            requestId = requestId,
            requesterUserId = requesterUserId,
            mode = "public",
            title = "Test",
            category = "snack",
            desiredVolume = "1000",
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

        StepVerifier.create(requestCommandService.close(requestId, requesterUserId))
            .expectErrorSatisfies { error ->
                assertTrue(error is ResponseStatusException)
                assertEquals(HttpStatus.FORBIDDEN, (error as ResponseStatusException).statusCode)
            }
            .verify()
    }

    @Test
    fun `cancel draft or open request transitions to cancelled state`() {
        val requestId = "req_1"
        val requesterUserId = "usr_1"
        val entity = dev.riss.fsm.command.request.RequestEntity(
            requestId = requestId,
            requesterUserId = requesterUserId,
            mode = "public",
            title = "Test",
            category = "snack",
            desiredVolume = "1000",
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

        `when`(requestRepository.findById(requestId)).thenReturn(Mono.just(entity))
        `when`(requestRepository.save(any())).thenAnswer { invocation ->
            Mono.just(invocation.getArgument<dev.riss.fsm.command.request.RequestEntity>(0))
        }

        StepVerifier.create(requestCommandService.cancel(requestId, requesterUserId, "Test reason"))
            .assertNext { result ->
                assertEquals("cancelled", result.state)
            }
            .verifyComplete()
    }

    @Test
    fun `cancel closed or cancelled request returns forbidden error`() {
        val requestId = "req_1"
        val requesterUserId = "usr_1"
        val entity = dev.riss.fsm.command.request.RequestEntity(
            requestId = requestId,
            requesterUserId = requesterUserId,
            mode = "public",
            title = "Test",
            category = "snack",
            desiredVolume = "1000",
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

        StepVerifier.create(requestCommandService.cancel(requestId, requesterUserId, null))
            .expectErrorSatisfies { error ->
                assertTrue(error is ResponseStatusException)
                assertEquals(HttpStatus.FORBIDDEN, (error as ResponseStatusException).statusCode)
            }
            .verify()
    }

    @Test
    fun `update request in draft state succeeds`() {
        val requestId = "req_1"
        val requesterUserId = "usr_1"
        val entity = dev.riss.fsm.command.request.RequestEntity(
            requestId = requestId,
            requesterUserId = requesterUserId,
            mode = "public",
            title = "Original Title",
            category = "snack",
            desiredVolume = "1000",
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
        `when`(requestRepository.save(any())).thenAnswer { invocation ->
            Mono.just(invocation.getArgument<dev.riss.fsm.command.request.RequestEntity>(0))
        }

        val updateCommand = dev.riss.fsm.command.request.UpdateRequestCommand(
            title = "Updated Title",
            desiredVolume = "2000",
            targetPriceMin = null,
            targetPriceMax = null,
            certificationRequirement = null,
            rawMaterialRule = null,
            packagingRequirement = null,
            deliveryRequirement = null,
            notes = null
        )

        StepVerifier.create(requestCommandService.update(requestId, requesterUserId, updateCommand))
            .assertNext { result ->
                assertEquals("Updated Title", result.title)
                assertEquals(2000, result.desiredVolume)
            }
            .verifyComplete()
    }

    @Test
    fun `non-owner cannot update request`() {
        val requestId = "req_1"
        val requesterUserId = "usr_1"
        val differentUserId = "usr_2"
        val entity = dev.riss.fsm.command.request.RequestEntity(
            requestId = requestId,
            requesterUserId = requesterUserId,
            mode = "public",
            title = "Test",
            category = "snack",
            desiredVolume = "1000",
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

        val updateCommand = dev.riss.fsm.command.request.UpdateRequestCommand()

        StepVerifier.create(requestCommandService.update(requestId, differentUserId, updateCommand))
            .expectErrorSatisfies { error ->
                assertTrue(error is ResponseStatusException)
                assertEquals(HttpStatus.FORBIDDEN, (error as ResponseStatusException).statusCode)
            }
            .verify()
    }
}
