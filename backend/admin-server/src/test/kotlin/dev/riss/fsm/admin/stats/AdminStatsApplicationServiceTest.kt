package dev.riss.fsm.admin.stats

import dev.riss.fsm.command.request.RequestEntity
import dev.riss.fsm.command.request.RequestRepository
import dev.riss.fsm.command.supplier.SupplierProfileEntity
import dev.riss.fsm.command.supplier.SupplierProfileRepository
import dev.riss.fsm.command.supplier.VerificationSubmissionEntity
import dev.riss.fsm.command.supplier.VerificationSubmissionRepository
import dev.riss.fsm.command.user.UserAccountEntity
import dev.riss.fsm.command.user.UserAccountRepository
import dev.riss.fsm.shared.auth.UserRole
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import reactor.core.publisher.Flux
import reactor.test.StepVerifier
import java.time.LocalDate
import java.time.LocalDateTime

class AdminStatsApplicationServiceTest {

    private val userAccountRepository = mock(UserAccountRepository::class.java)
    private val supplierProfileRepository = mock(SupplierProfileRepository::class.java)
    private val verificationSubmissionRepository = mock(VerificationSubmissionRepository::class.java)
    private val requestRepository = mock(RequestRepository::class.java)
    private val service = AdminStatsApplicationService(
        userAccountRepository,
        supplierProfileRepository,
        verificationSubmissionRepository,
        requestRepository,
    )
    private val admin = AuthenticatedUserPrincipal("admin_1", "admin@example.com", UserRole.ADMIN)

    @Test
    fun `summary applies date filter and returns Task 11 shape`() {
        val fromDate = LocalDate.of(2026, 3, 1)
        val toDate = LocalDate.of(2026, 3, 31)

        `when`(userAccountRepository.findAll()).thenReturn(
            Flux.just(
                user("usr_req", UserRole.REQUESTER, LocalDateTime.of(2026, 3, 2, 0, 0)),
                user("usr_sup", UserRole.SUPPLIER, LocalDateTime.of(2026, 3, 3, 0, 0)),
                user("usr_admin", UserRole.ADMIN, LocalDateTime.of(2026, 3, 4, 0, 0)),
                user("usr_old", UserRole.REQUESTER, LocalDateTime.of(2026, 2, 25, 0, 0)),
            )
        )
        `when`(supplierProfileRepository.findAll()).thenReturn(
            Flux.just(
                supplier("approved", LocalDateTime.of(2026, 3, 5, 0, 0)),
                supplier("draft", LocalDateTime.of(2026, 3, 6, 0, 0)),
                supplier("submitted", LocalDateTime.of(2026, 2, 20, 0, 0)),
            )
        )
        `when`(verificationSubmissionRepository.findAll()).thenReturn(
            Flux.just(
                submission("submitted", LocalDateTime.of(2026, 3, 7, 0, 0), null),
                submission("hold", LocalDateTime.of(2026, 3, 8, 0, 0), LocalDateTime.of(2026, 3, 10, 0, 0)),
                submission("approved", LocalDateTime.of(2026, 2, 28, 0, 0), LocalDateTime.of(2026, 3, 1, 0, 0)),
            )
        )
        `when`(requestRepository.findAll()).thenReturn(
            Flux.just(
                request("open", LocalDateTime.of(2026, 3, 9, 0, 0)),
                request("closed", LocalDateTime.of(2026, 3, 10, 0, 0)),
                request("cancelled", LocalDateTime.of(2026, 3, 11, 0, 0)),
                request("draft", LocalDateTime.of(2026, 3, 12, 0, 0)),
                request("open", LocalDateTime.of(2026, 2, 10, 0, 0)),
            )
        )

        StepVerifier.create(service.getStatsSummary(admin, fromDate, toDate))
            .assertNext { response ->
                assertEquals(3L, response.users.total)
                assertEquals(1L, response.users.admins)
                assertEquals(1L, response.suppliersByState.approved)
                assertEquals(1L, response.suppliersByState.draft)
                assertEquals(2L, response.reviews.pending)
                assertEquals(1L, response.reviews.totalReviewed)
                assertEquals(4L, response.requests.total)
                assertEquals(1L, response.requests.cancelled)
                assertEquals(1L, response.requests.draft)
                assertEquals(fromDate, response.period.from)
                assertEquals(toDate, response.period.to)
            }
            .verifyComplete()
    }

    @Test
    fun `summary rejects non admin principal`() {
        val requester = AuthenticatedUserPrincipal("usr_req", "req@example.com", UserRole.REQUESTER)

        val error = assertThrows(org.springframework.web.server.ResponseStatusException::class.java) {
            service.getStatsSummary(requester, null, null).block()
        }

        assertEquals(403, error.statusCode.value())
    }

    private fun user(userId: String, role: UserRole, createdAt: LocalDateTime) = UserAccountEntity(
        userId = userId,
        email = "$userId@example.com",
        passwordHash = "hash",
        role = role,
        createdAt = createdAt,
    )

    private fun supplier(state: String, createdAt: LocalDateTime) = SupplierProfileEntity(
        profileId = "sprof_$state",
        supplierUserId = "usr_$state",
        companyName = "Company $state",
        representativeName = "대표자",
        contactPhone = null,
        contactEmail = null,
        region = "서울",
        categories = "snack",
        equipmentSummary = null,
        monthlyCapacity = 1000,
        moq = 100,
        oemAvailable = true,
        odmAvailable = false,
        rawMaterialSupport = true,
        packagingLabelingSupport = true,
        introduction = null,
        verificationState = state,
        exposureState = if (state == "approved") "visible" else "hidden",
        createdAt = createdAt,
        updatedAt = createdAt,
    )

    private fun submission(state: String, submittedAt: LocalDateTime, reviewedAt: LocalDateTime?) = VerificationSubmissionEntity(
        submissionId = "sub_${state}_${submittedAt.dayOfMonth}",
        supplierProfileId = "sprof_$state",
        state = state,
        submittedAt = submittedAt,
        reviewedAt = reviewedAt,
        reviewedBy = if (reviewedAt != null) "admin_1" else null,
        reviewNoteInternal = null,
        reviewNotePublic = null,
    )

    private fun request(state: String, createdAt: LocalDateTime) = RequestEntity(
        requestId = "req_${state}_${createdAt.dayOfMonth}",
        requesterUserId = "usr_req",
        mode = "public",
        title = "의뢰 $state",
        category = "snack",
        desiredVolume = 1000,
        targetPriceMin = null,
        targetPriceMax = null,
        certificationRequirement = null,
        rawMaterialRule = null,
        packagingRequirement = null,
        deliveryRequirement = null,
        notes = null,
        state = state,
        createdAt = createdAt,
        updatedAt = createdAt,
    )
}
