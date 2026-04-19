package dev.riss.fsm.command.review

import dev.riss.fsm.command.quote.QuoteRepository
import dev.riss.fsm.command.request.RequestRepository
import dev.riss.fsm.shared.error.DuplicateReviewException
import dev.riss.fsm.shared.error.RequestNotFoundException
import dev.riss.fsm.shared.error.ReviewContentViolationException
import dev.riss.fsm.shared.error.ReviewEligibilityFailedException
import dev.riss.fsm.shared.error.ReviewNotFoundException
import dev.riss.fsm.shared.error.ReviewUpdateForbiddenException
import dev.riss.fsm.shared.moderation.ProfanityFilter
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.Duration
import java.time.LocalDateTime
import java.util.UUID

@Service
class ReviewCommandService(
    private val reviewRepository: ReviewRepository,
    private val requestRepository: RequestRepository,
    private val quoteRepository: QuoteRepository,
    private val profanityFilter: ProfanityFilter,
) {
    fun create(command: CreateReviewCommand): Mono<ReviewEntity> {
        ensureContentAllowed(command.text)

        return requestRepository.findById(command.requestId)
            .switchIfEmpty(Mono.error(RequestNotFoundException()))
            .flatMap { request ->
                if (request.state != "closed") {
                    return@flatMap Mono.error(ReviewEligibilityFailedException("Request is not closed"))
                }
                if (request.requesterUserId != command.requesterUserId) {
                    return@flatMap Mono.error(ReviewEligibilityFailedException("Not the request owner"))
                }

                quoteRepository.existsByRequestIdAndSupplierProfileIdAndStateIn(
                    command.requestId,
                    command.supplierProfileId,
                    listOf("selected")
                ).flatMap { hasSelectedQuote ->
                    if (!hasSelectedQuote) {
                        return@flatMap Mono.error(ReviewEligibilityFailedException("No selected quote for this supplier"))
                    }
                    quoteRepository.findAllByRequestIdAndSupplierProfileId(command.requestId, command.supplierProfileId)
                        .filter { it.state == "selected" }
                        .next()
                        .switchIfEmpty(Mono.error(ReviewEligibilityFailedException("Selected quote missing")))
                        .flatMap { selectedQuote ->
                            reviewRepository.existsByRequestIdAndSupplierProfileId(
                                command.requestId,
                                command.supplierProfileId
                            ).flatMap { exists ->
                                if (exists) {
                                    return@flatMap Mono.error(DuplicateReviewException())
                                }
                                val now = LocalDateTime.now()
                                val review = ReviewEntity(
                                    reviewId = "rev_${UUID.randomUUID()}",
                                    requesterUserId = command.requesterUserId,
                                    supplierProfileId = command.supplierProfileId,
                                    requestId = command.requestId,
                                    quoteId = selectedQuote.quoteId,
                                    rating = command.rating,
                                    text = command.text,
                                    hidden = false,
                                    version = 1,
                                    createdAt = now,
                                    updatedAt = now,
                                ).apply { newEntity = true }
                                reviewRepository.save(review)
                            }
                        }
                }
            }
    }

    fun update(reviewId: String, requesterUserId: String, command: UpdateReviewCommand): Mono<ReviewEntity> {
        ensureContentAllowed(command.text)

        return reviewRepository.findById(reviewId)
            .switchIfEmpty(Mono.error(ReviewNotFoundException()))
            .flatMap { review ->
                if (review.requesterUserId != requesterUserId) {
                    return@flatMap Mono.error(ReviewUpdateForbiddenException("Not the review author"))
                }
                if (review.hidden) {
                    return@flatMap Mono.error(ReviewUpdateForbiddenException("Hidden review cannot be edited"))
                }
                if (LocalDateTime.now().isAfter(review.createdAt.plus(EDIT_WINDOW))) {
                    return@flatMap Mono.error(ReviewUpdateForbiddenException("Edit window has expired"))
                }

                reviewRepository.save(
                    review.copy(
                        rating = command.rating ?: review.rating,
                        text = if (command.textProvided) command.text else review.text,
                        version = review.version + 1,
                        updatedAt = LocalDateTime.now(),
                    )
                )
            }
    }

    fun hide(reviewId: String): Mono<ReviewEntity> = toggleHidden(reviewId, targetHidden = true)

    fun unhide(reviewId: String): Mono<ReviewEntity> = toggleHidden(reviewId, targetHidden = false)

    private fun toggleHidden(reviewId: String, targetHidden: Boolean): Mono<ReviewEntity> {
        return reviewRepository.findById(reviewId)
            .switchIfEmpty(Mono.error(ReviewNotFoundException()))
            .flatMap { review ->
                if (review.hidden == targetHidden) {
                    return@flatMap Mono.just(review)
                }
                reviewRepository.save(
                    review.copy(
                        hidden = targetHidden,
                        version = review.version + 1,
                        updatedAt = LocalDateTime.now(),
                    )
                )
            }
    }

    private fun ensureContentAllowed(text: String?) {
        if (text != null && profanityFilter.containsProfanity(text)) {
            throw ReviewContentViolationException("Text contains prohibited language")
        }
    }

    companion object {
        val EDIT_WINDOW: Duration = Duration.ofDays(7)
    }
}

data class CreateReviewCommand(
    val requesterUserId: String,
    val supplierProfileId: String,
    val requestId: String,
    val rating: Int,
    val text: String?,
)

data class UpdateReviewCommand(
    val rating: Int? = null,
    val text: String? = null,
    val textProvided: Boolean = false,
)
