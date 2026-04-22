package dev.riss.fsm.admin.review

import dev.riss.fsm.command.supplier.AuditLogEntity
import dev.riss.fsm.command.supplier.AuditLogRepository
import dev.riss.fsm.command.supplier.SupplierProfileRepository
import dev.riss.fsm.command.supplier.VerificationSubmissionRepository
import dev.riss.fsm.query.admin.review.AdminReviewQuery
import dev.riss.fsm.query.admin.review.AdminReviewQueryService
import dev.riss.fsm.shared.auth.UserRole
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import reactor.kotlin.core.publisher.switchIfEmpty
import tools.jackson.module.kotlin.jacksonObjectMapper
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.util.UUID

@Service
class AdminReviewApplicationService(
    private val verificationSubmissionRepository: VerificationSubmissionRepository,
    private val supplierProfileRepository: SupplierProfileRepository,
    private val adminReviewProjectionService: AdminReviewProjectionService,
    private val adminReviewQueryService: AdminReviewQueryService,
    private val auditLogRepository: AuditLogRepository,
) {
    private val objectMapper = jacksonObjectMapper()

    fun queue(
        principal: AuthenticatedUserPrincipal,
        state: String?,
        fromDate: LocalDate?,
        toDate: LocalDate?,
        page: Int,
        size: Int,
        sort: String?,
        order: String?,
    ) = ensureAdmin(principal).then(
        adminReviewQueryService.queue(
            AdminReviewQuery(
                state = state,
                fromDate = fromDate,
                toDate = toDate,
                page = page,
                size = size,
                sort = sort,
                order = order,
            )
        )
    )

    fun detail(principal: AuthenticatedUserPrincipal, reviewId: String): Mono<AdminReviewDetailResponse> {
        return ensureAdmin(principal).then(
            adminReviewQueryService.detail(reviewId)
                .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found")))
                .flatMap { detail ->
                    auditLogRepository.findAllByTargetTypeAndTargetIdOrderByCreatedAtDesc("verification_submission", reviewId)
                        .map { audit ->
                            val payload = runCatching { objectMapper.readTree(audit.payloadSnapshot) }.getOrNull()
                            AdminReviewHistoryItemResponse(
                                actionType = audit.actionType,
                                actorUserId = audit.actorUserId,
                                createdAt = audit.createdAt.toInstant(ZoneOffset.UTC),
                                noteInternal = payload?.get("noteInternal")?.takeUnless { it.isNull }?.asText(),
                                notePublic = payload?.get("notePublic")?.takeUnless { it.isNull }?.asText(),
                                reasonCode = payload?.get("reasonCode")?.takeUnless { it.isNull }?.asText(),
                            )
                        }
                        .collectList()
                        .map { history ->
                            AdminReviewDetailResponse(
                                reviewId = detail.reviewId,
                                supplierProfileId = detail.supplierProfileId,
                                companyName = detail.companyName,
                                representativeName = detail.representativeName,
                                region = detail.region,
                                categories = detail.categories,
                                state = detail.state,
                                submittedAt = detail.submittedAt,
                                reviewedAt = detail.reviewedAt,
                                reviewNoteInternal = detail.reviewNoteInternal,
                                reviewNotePublic = detail.reviewNotePublic,
                                files = detail.files.map { file ->
                                    AdminReviewDetailFileResponse(
                                        fileId = file.fileId,
                                        fileName = file.fileName,
                                        status = file.status,
                                        downloadUrl = null,
                                    )
                                },
                                reviewHistory = history,
                            )
                        }
                }
        )
    }

    fun approve(principal: AuthenticatedUserPrincipal, reviewId: String, request: ReviewDecisionRequest): Mono<ReviewDecisionResponse> {
        ensureAdmin(principal)
        return applyDecision(principal, reviewId, request, decision = "approve")
    }

    fun hold(principal: AuthenticatedUserPrincipal, reviewId: String, request: ReviewDecisionRequest): Mono<ReviewDecisionResponse> {
        ensureAdmin(principal)
        if (request.notePublic.isNullOrBlank()) {
            return Mono.error(ResponseStatusException(HttpStatus.BAD_REQUEST, "notePublic is required for hold"))
        }
        return applyDecision(principal, reviewId, request, decision = "hold")
    }

    fun reject(principal: AuthenticatedUserPrincipal, reviewId: String, request: ReviewDecisionRequest): Mono<ReviewDecisionResponse> {
        ensureAdmin(principal)
        if (request.notePublic.isNullOrBlank()) {
            return Mono.error(ResponseStatusException(HttpStatus.BAD_REQUEST, "notePublic is required for reject"))
        }
        return applyDecision(principal, reviewId, request, decision = "reject")
    }

    private fun applyDecision(
        principal: AuthenticatedUserPrincipal,
        reviewId: String,
        request: ReviewDecisionRequest,
        decision: String,
    ): Mono<ReviewDecisionResponse> {
        return verificationSubmissionRepository.findById(reviewId)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found")))
            .flatMap { submission ->
                supplierProfileRepository.findById(submission.supplierProfileId)
                    .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier profile not found")))
                    .flatMap { profile ->
                        val reviewedAt = LocalDateTime.now()
                        val updatedSubmission = submission.copy(
                            state = when (decision) {
                                "approve" -> "approved"
                                "hold" -> "hold"
                                "reject" -> "rejected"
                                else -> submission.state
                            },
                            reviewedAt = reviewedAt,
                            reviewedBy = principal.userId,
                            reviewNoteInternal = request.noteInternal,
                            reviewNotePublic = request.notePublic,
                        )
                        val updatedProfile = when (decision) {
                            "approve" -> profile.copy(verificationState = "approved", exposureState = "visible", updatedAt = reviewedAt)
                            "hold" -> profile.copy(verificationState = "hold", exposureState = "hidden", updatedAt = reviewedAt)
                            "reject" -> profile.copy(verificationState = "rejected", exposureState = "hidden", updatedAt = reviewedAt)
                            else -> profile
                        }
                        verificationSubmissionRepository.save(updatedSubmission)
                            .flatMap { supplierProfileRepository.save(updatedProfile).thenReturn(updatedSubmission to updatedProfile) }
                    }
            }
            .flatMap { (submission, profile) ->
                adminReviewProjectionService.project(submission, profile)
                    .then(
                        auditLogRepository.save(
                            AuditLogEntity(
                                auditLogId = "audit_${UUID.randomUUID()}",
                                actorUserId = principal.userId,
                                actionType = "review_${decision}",
                                targetType = "verification_submission",
                                targetId = submission.submissionId,
                                payloadSnapshot = objectMapper.writeValueAsString(
                                    mapOf(
                                        "reviewId" to submission.submissionId,
                                        "supplierProfileId" to profile.profileId,
                                        "decision" to decision,
                                        "noteInternal" to request.noteInternal,
                                        "notePublic" to request.notePublic,
                                        "reasonCode" to request.reasonCode,
                                    )
                                ),
                                createdAt = LocalDateTime.now(),
                            ).apply { newEntity = true }
                        )
                    )
                    .thenReturn(
                        ReviewDecisionResponse(
                            reviewId = submission.submissionId,
                            state = submission.state,
                            supplierVerificationState = profile.verificationState,
                            exposureState = profile.exposureState,
                            reviewedAt = submission.reviewedAt!!.toInstant(ZoneOffset.UTC),
                        )
                    )
            }
    }

    private fun ensureAdmin(principal: AuthenticatedUserPrincipal): Mono<Void> {
        return if (principal.role == UserRole.ADMIN) Mono.empty()
        else Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required"))
    }
}
