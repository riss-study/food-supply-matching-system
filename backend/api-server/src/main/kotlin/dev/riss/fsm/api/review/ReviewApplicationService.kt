package dev.riss.fsm.api.review

import dev.riss.fsm.command.review.CreateReviewCommand
import dev.riss.fsm.command.review.ReviewCommandService
import dev.riss.fsm.command.review.UpdateReviewCommand
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.ZoneOffset

@Service
class ReviewApplicationService(
    private val reviewCommandService: ReviewCommandService,
) {
    fun create(principal: AuthenticatedUserPrincipal, request: CreateReviewRequest): Mono<CreateReviewResponse> {
        val command = CreateReviewCommand(
            requesterUserId = principal.userId,
            supplierProfileId = request.supplierId,
            requestId = request.requestId,
            rating = request.rating,
            text = request.text.takeUnless { it.isNullOrBlank() },
        )
        return reviewCommandService.create(command).map { review ->
            CreateReviewResponse(
                reviewId = review.reviewId,
                rating = review.rating,
                text = review.text,
                createdAt = review.createdAt.toInstant(ZoneOffset.UTC),
            )
        }
    }

    fun update(principal: AuthenticatedUserPrincipal, reviewId: String, request: UpdateReviewRequest): Mono<UpdateReviewResponse> {
        val normalizedText = if (request.textProvided) request.text?.takeUnless { it.isBlank() } else null
        val command = UpdateReviewCommand(
            rating = request.rating,
            text = normalizedText,
            textProvided = request.textProvided,
        )
        return reviewCommandService.update(reviewId, principal.userId, command).map { review ->
            UpdateReviewResponse(
                reviewId = review.reviewId,
                rating = review.rating,
                text = review.text,
                createdAt = review.createdAt.toInstant(ZoneOffset.UTC),
                updatedAt = review.updatedAt.toInstant(ZoneOffset.UTC),
            )
        }
    }
}
