package dev.riss.fsm.api.thread

import dev.riss.fsm.command.request.RequestEntity
import dev.riss.fsm.command.request.RequestRepository
import dev.riss.fsm.command.request.TargetedSupplierLinkRepository
import dev.riss.fsm.command.supplier.AttachmentMetadataRepository
import dev.riss.fsm.command.supplier.SupplierProfileEntity
import dev.riss.fsm.command.supplier.SupplierProfileRepository
import dev.riss.fsm.command.thread.ContactShareCommand
import dev.riss.fsm.command.thread.MessageRepository
import dev.riss.fsm.command.thread.MessageThreadEntity
import dev.riss.fsm.command.thread.MessageThreadRepository
import dev.riss.fsm.command.thread.ThreadCommandService
import dev.riss.fsm.command.thread.ThreadParticipantReadStateRepository
import dev.riss.fsm.command.user.BusinessProfileEntity
import dev.riss.fsm.command.user.BusinessProfileRepository
import dev.riss.fsm.shared.auth.UserRole
import dev.riss.fsm.shared.file.FileStorageService
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import reactor.test.StepVerifier
import java.time.Instant
import java.time.LocalDateTime

class ThreadApplicationServiceTest {
    private val requestRepository = mock(RequestRepository::class.java)
    private val targetedSupplierLinkRepository = mock(TargetedSupplierLinkRepository::class.java)
    private val supplierProfileRepository = mock(SupplierProfileRepository::class.java)
    private val messageThreadRepository = mock(MessageThreadRepository::class.java)
    private val messageRepository = mock(MessageRepository::class.java)
    private val threadCommandService = mock(ThreadCommandService::class.java)
    private val attachmentMetadataRepository = mock(AttachmentMetadataRepository::class.java)
    private val fileStorageService = mock(FileStorageService::class.java)
    private val businessProfileRepository = mock(BusinessProfileRepository::class.java)
    private val readStateRepository = mock(ThreadParticipantReadStateRepository::class.java)
    private val service = ThreadApplicationService(
        requestRepository,
        targetedSupplierLinkRepository,
        supplierProfileRepository,
        messageThreadRepository,
        messageRepository,
        threadCommandService,
        attachmentMetadataRepository,
        fileStorageService,
        businessProfileRepository,
        readStateRepository,
    )

    @Test
    fun `get thread detail hides shared contact before mutual approval`() {
        val principal = AuthenticatedUserPrincipal("usr_req", "req@example.com", UserRole.REQUESTER)
        val thread = thread(contactShareState = "one_side_approved")

        `when`(messageThreadRepository.findById(thread.threadId)).thenReturn(Mono.just(thread))
        `when`(threadCommandService.ensureThreadAccess(thread, principal.userId, null)).thenReturn(true)
        `when`(requestRepository.findById(thread.requestId)).thenReturn(Mono.just(requestEntity()))
        `when`(businessProfileRepository.findByUserAccountId(thread.requesterUserId)).thenReturn(Mono.just(requesterBusinessProfile()))
        `when`(supplierProfileRepository.findById(thread.supplierProfileId)).thenReturn(Mono.just(supplierProfile(contactEmail = null)))
        `when`(messageRepository.findAllByThreadIdOrderByCreatedAtDesc(thread.threadId)).thenReturn(Flux.empty())

        StepVerifier.create(service.getThreadDetail(principal, thread.threadId, 1, 20))
            .assertNext { response ->
                assertEquals("one_side_approved", response.contactShareState)
                assertNull(response.sharedContact)
            }
            .verifyComplete()
    }

    @Test
    fun `approve contact share returns timestamps and explicit supplier contact only`() {
        val principal = AuthenticatedUserPrincipal("usr_sup", "supplier-account@example.com", UserRole.SUPPLIER)
        val currentProfile = supplierProfile(contactEmail = "supplier-contact@example.com")
        val originalThread = thread(contactShareState = "one_side_approved")
        val approvedAt = LocalDateTime.of(2026, 3, 25, 10, 30)
        val updatedThread = originalThread.copy(
            contactShareState = "mutually_approved",
            contactShareRequestedByRole = "requester",
            contactShareRequestedAt = LocalDateTime.of(2026, 3, 25, 9, 0),
            contactShareRequesterApprovedAt = LocalDateTime.of(2026, 3, 25, 9, 30),
            contactShareSupplierApprovedAt = approvedAt,
        )

        `when`(supplierProfileRepository.findBySupplierUserId(principal.userId)).thenReturn(Mono.just(currentProfile))
        `when`(messageThreadRepository.findById(originalThread.threadId)).thenReturn(Mono.just(originalThread))
        `when`(threadCommandService.ensureThreadAccess(originalThread, principal.userId, currentProfile.profileId)).thenReturn(true)
        `when`(
            threadCommandService.approveContactShare(
                ContactShareCommand(originalThread.threadId, principal.userId, currentProfile.profileId)
            )
        ).thenReturn(Mono.just(updatedThread))
        `when`(businessProfileRepository.findByUserAccountId(updatedThread.requesterUserId)).thenReturn(Mono.just(requesterBusinessProfile()))
        `when`(supplierProfileRepository.findById(updatedThread.supplierProfileId)).thenReturn(Mono.just(currentProfile))

        StepVerifier.create(service.approveContactShare(principal, originalThread.threadId))
            .assertNext { response ->
                assertEquals("mutually_approved", response.contactShareState)
                assertEquals("requester", response.requestedBy)
                assertEquals(Instant.parse("2026-03-25T09:00:00Z"), response.requestedAt)
                assertEquals(Instant.parse("2026-03-25T10:30:00Z"), response.approvedAt)
                assertEquals("supplier-contact@example.com", response.sharedContact?.supplier?.email)
            }
            .verifyComplete()
    }

    private fun requestEntity() = RequestEntity(
        requestId = "req_1",
        requesterUserId = "usr_req",
        mode = "public",
        title = "Test request",
        category = "snack",
        desiredVolume = "100",
        targetPriceMin = null,
        targetPriceMax = null,
        certificationRequirement = null,
        rawMaterialRule = null,
        packagingRequirement = null,
        deliveryRequirement = null,
        notes = null,
        state = "open",
        createdAt = LocalDateTime.of(2026, 3, 24, 8, 0),
        updatedAt = LocalDateTime.of(2026, 3, 24, 8, 0),
    )

    private fun requesterBusinessProfile() = BusinessProfileEntity(
        profileId = "bp_1",
        userAccountId = "usr_req",
        businessName = "Requester Foods",
        businessRegistrationNumber = "123-45-67890",
        contactName = "홍길동",
        contactPhone = "010-1111-2222",
        contactEmail = "requester@example.com",
        verificationScope = "domestic",
        approvalState = "approved",
        submittedAt = LocalDateTime.of(2026, 3, 1, 0, 0),
        approvedAt = LocalDateTime.of(2026, 3, 2, 0, 0),
        rejectedAt = null,
        rejectionReason = null,
        createdAt = LocalDateTime.of(2026, 3, 1, 0, 0),
        updatedAt = LocalDateTime.of(2026, 3, 2, 0, 0),
    )

    private fun supplierProfile(contactEmail: String?) = SupplierProfileEntity(
        profileId = "sprof_1",
        supplierUserId = "usr_sup",
        companyName = "Supplier Co",
        representativeName = "김공급",
        contactPhone = "010-3333-4444",
        contactEmail = contactEmail,
        region = "서울",
        categories = "snack",
        equipmentSummary = null,
        monthlyCapacity = "50000",
        moq = "1000",
        oemAvailable = true,
        odmAvailable = true,
        rawMaterialSupport = true,
        packagingLabelingSupport = true,
        introduction = null,
        verificationState = "approved",
        exposureState = "visible",
        createdAt = LocalDateTime.of(2026, 3, 1, 0, 0),
        updatedAt = LocalDateTime.of(2026, 3, 1, 0, 0),
    )

    private fun thread(contactShareState: String) = MessageThreadEntity(
        threadId = "thd_1",
        requestId = "req_1",
        requesterUserId = "usr_req",
        supplierProfileId = "sprof_1",
        quoteId = "quo_1",
        contactShareState = contactShareState,
        contactShareRequestedByRole = "requester",
        contactShareRequestedAt = LocalDateTime.of(2026, 3, 25, 9, 0),
        contactShareRequesterApprovedAt = null,
        contactShareSupplierApprovedAt = null,
        contactShareRevokedByRole = null,
        contactShareRevokedAt = null,
        createdAt = LocalDateTime.of(2026, 3, 24, 9, 0),
    )
}
