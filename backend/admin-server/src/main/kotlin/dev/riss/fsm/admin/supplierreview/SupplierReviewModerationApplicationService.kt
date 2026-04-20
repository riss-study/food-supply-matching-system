package dev.riss.fsm.admin.supplierreview

import dev.riss.fsm.command.review.ReviewCommandService
import dev.riss.fsm.command.review.ReviewEntity
import dev.riss.fsm.command.supplier.AuditLogEntity
import dev.riss.fsm.command.supplier.AuditLogRepository
import dev.riss.fsm.projection.review.ReviewProjectionService
import dev.riss.fsm.shared.auth.UserRole
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import tools.jackson.module.kotlin.jacksonObjectMapper
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.util.UUID

@Service
class SupplierReviewModerationApplicationService(
    private val reviewCommandService: ReviewCommandService,
    private val reviewProjectionService: ReviewProjectionService,
    private val auditLogRepository: AuditLogRepository,
) {
    private val objectMapper = jacksonObjectMapper()

    fun hide(principal: AuthenticatedUserPrincipal, reviewId: String): Mono<SupplierReviewModerationResponse> =
        toggle(principal, reviewId, targetHidden = true)

    fun unhide(principal: AuthenticatedUserPrincipal, reviewId: String): Mono<SupplierReviewModerationResponse> =
        toggle(principal, reviewId, targetHidden = false)

    private fun toggle(
        principal: AuthenticatedUserPrincipal,
        reviewId: String,
        targetHidden: Boolean,
    ): Mono<SupplierReviewModerationResponse> {
        return ensureAdmin(principal).then(
            (if (targetHidden) reviewCommandService.hide(reviewId) else reviewCommandService.unhide(reviewId))
                .flatMap { review ->
                    reviewProjectionService.recomputeFor(review.supplierProfileId)
                        .then(writeAudit(principal, review, targetHidden))
                        .thenReturn(review)
                }
                .map { review ->
                    SupplierReviewModerationResponse(
                        reviewId = review.reviewId,
                        hidden = review.hidden,
                        updatedAt = review.updatedAt.toInstant(ZoneOffset.UTC),
                    )
                }
        )
    }

    private fun writeAudit(
        principal: AuthenticatedUserPrincipal,
        review: ReviewEntity,
        targetHidden: Boolean,
    ): Mono<AuditLogEntity> {
        val action = if (targetHidden) "review_hide" else "review_unhide"
        return auditLogRepository.save(
            AuditLogEntity(
                auditLogId = "audit_${UUID.randomUUID()}",
                actorUserId = principal.userId,
                actionType = action,
                targetType = "review",
                targetId = review.reviewId,
                payloadSnapshot = objectMapper.writeValueAsString(
                    mapOf(
                        "reviewId" to review.reviewId,
                        "supplierProfileId" to review.supplierProfileId,
                        "hidden" to review.hidden,
                    )
                ),
                createdAt = LocalDateTime.now(),
            ).apply { newEntity = true }
        )
    }

    private fun ensureAdmin(principal: AuthenticatedUserPrincipal): Mono<Void> {
        return if (principal.role == UserRole.ADMIN) Mono.empty()
        else Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required"))
    }
}
