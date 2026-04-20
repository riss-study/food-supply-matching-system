package dev.riss.fsm.command.review

import dev.riss.fsm.command.quote.QuoteEntity
import dev.riss.fsm.command.quote.QuoteRepository
import dev.riss.fsm.command.request.RequestEntity
import dev.riss.fsm.command.request.RequestRepository
import dev.riss.fsm.shared.error.DuplicateReviewException
import dev.riss.fsm.shared.error.ReviewContentViolationException
import dev.riss.fsm.shared.error.ReviewEligibilityFailedException
import dev.riss.fsm.shared.error.ReviewNotFoundException
import dev.riss.fsm.shared.error.ReviewUpdateForbiddenException
import dev.riss.fsm.shared.moderation.ProfanityFilter
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.Mockito.`when`
import org.mockito.Mockito.any
import org.mockito.junit.jupiter.MockitoExtension
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import reactor.test.StepVerifier
import java.time.LocalDateTime

@ExtendWith(MockitoExtension::class)
class ReviewCommandServiceTest {
    @Mock private lateinit var reviewRepository: ReviewRepository
    @Mock private lateinit var requestRepository: RequestRepository
    @Mock private lateinit var quoteRepository: QuoteRepository

    private val profanityFilter = ProfanityFilter()
    private lateinit var service: ReviewCommandService

    @BeforeEach
    fun setUp() {
        service = ReviewCommandService(reviewRepository, requestRepository, quoteRepository, profanityFilter)
    }

    @Test
    fun `create succeeds when request closed and quote selected`() {
        val request = closedRequest()
        val quote = selectedQuote()
        `when`(requestRepository.findById(request.requestId)).thenReturn(Mono.just(request))
        `when`(quoteRepository.findAllByRequestIdAndSupplierProfileId(request.requestId, "sprof_1"))
            .thenReturn(Flux.just(quote))
        `when`(reviewRepository.existsByRequestIdAndSupplierProfileId(request.requestId, "sprof_1"))
            .thenReturn(Mono.just(false))
        `when`(reviewRepository.save(any())).thenAnswer { Mono.just(it.getArgument<ReviewEntity>(0)) }

        StepVerifier.create(service.create(CreateReviewCommand("usr_req", "sprof_1", request.requestId, 5, "좋음")))
            .assertNext { review ->
                assertEquals(5, review.rating)
                assertEquals("sprof_1", review.supplierProfileId)
                assertFalse(review.hidden)
                assertEquals(1, review.version)
            }
            .verifyComplete()
    }

    @Test
    fun `create rejects when request state is not closed (P1)`() {
        val request = closedRequest().copy(state = "open")
        `when`(requestRepository.findById(request.requestId)).thenReturn(Mono.just(request))

        StepVerifier.create(service.create(CreateReviewCommand("usr_req", "sprof_1", request.requestId, 5, null)))
            .expectErrorSatisfies { err -> assertTrue(err is ReviewEligibilityFailedException) }
            .verify()
    }

    @Test
    fun `create rejects when caller is not request owner (P1)`() {
        val request = closedRequest()
        `when`(requestRepository.findById(request.requestId)).thenReturn(Mono.just(request))

        StepVerifier.create(service.create(CreateReviewCommand("usr_other", "sprof_1", request.requestId, 5, null)))
            .expectErrorSatisfies { err -> assertTrue(err is ReviewEligibilityFailedException) }
            .verify()
    }

    @Test
    fun `create rejects when no selected quote exists (P1)`() {
        val request = closedRequest()
        `when`(requestRepository.findById(request.requestId)).thenReturn(Mono.just(request))
        `when`(quoteRepository.findAllByRequestIdAndSupplierProfileId(request.requestId, "sprof_1"))
            .thenReturn(Flux.empty())

        StepVerifier.create(service.create(CreateReviewCommand("usr_req", "sprof_1", request.requestId, 5, null)))
            .expectErrorSatisfies { err -> assertTrue(err is ReviewEligibilityFailedException) }
            .verify()
    }

    @Test
    fun `create rejects duplicate review for same request-supplier pair (P2)`() {
        val request = closedRequest()
        val quote = selectedQuote()
        `when`(requestRepository.findById(request.requestId)).thenReturn(Mono.just(request))
        `when`(quoteRepository.findAllByRequestIdAndSupplierProfileId(request.requestId, "sprof_1"))
            .thenReturn(Flux.just(quote))
        `when`(reviewRepository.existsByRequestIdAndSupplierProfileId(request.requestId, "sprof_1"))
            .thenReturn(Mono.just(true))

        StepVerifier.create(service.create(CreateReviewCommand("usr_req", "sprof_1", request.requestId, 5, null)))
            .expectErrorSatisfies { err -> assertTrue(err is DuplicateReviewException) }
            .verify()
    }

    @Test
    fun `create rejects profanity in text (P4)`() {
        StepVerifier.create(service.create(CreateReviewCommand("usr_req", "sprof_1", "req_1", 5, "씨발 망했음")))
            .expectErrorSatisfies { err -> assertTrue(err is ReviewContentViolationException) }
            .verify()
    }

    @Test
    fun `update succeeds within 7-day window`() {
        val review = existingReview()
        `when`(reviewRepository.findById(review.reviewId)).thenReturn(Mono.just(review))
        `when`(reviewRepository.save(any())).thenAnswer { Mono.just(it.getArgument<ReviewEntity>(0)) }

        StepVerifier.create(service.update(review.reviewId, "usr_req", UpdateReviewCommand(rating = 3)))
            .assertNext { updated ->
                assertEquals(3, updated.rating)
                assertEquals(2, updated.version)
            }
            .verifyComplete()
    }

    @Test
    fun `update rejects non-author`() {
        val review = existingReview()
        `when`(reviewRepository.findById(review.reviewId)).thenReturn(Mono.just(review))

        StepVerifier.create(service.update(review.reviewId, "usr_other", UpdateReviewCommand(rating = 3)))
            .expectErrorSatisfies { err -> assertTrue(err is ReviewUpdateForbiddenException) }
            .verify()
    }

    @Test
    fun `update rejects hidden review`() {
        val review = existingReview().copy(hidden = true)
        `when`(reviewRepository.findById(review.reviewId)).thenReturn(Mono.just(review))

        StepVerifier.create(service.update(review.reviewId, "usr_req", UpdateReviewCommand(rating = 3)))
            .expectErrorSatisfies { err -> assertTrue(err is ReviewUpdateForbiddenException) }
            .verify()
    }

    @Test
    fun `update rejects after 7-day edit window`() {
        val review = existingReview().copy(createdAt = LocalDateTime.now().minusDays(8))
        `when`(reviewRepository.findById(review.reviewId)).thenReturn(Mono.just(review))

        StepVerifier.create(service.update(review.reviewId, "usr_req", UpdateReviewCommand(rating = 3)))
            .expectErrorSatisfies { err -> assertTrue(err is ReviewUpdateForbiddenException) }
            .verify()
    }

    @Test
    fun `update clears text when textProvided and blank`() {
        val review = existingReview().copy(text = "기존 본문")
        `when`(reviewRepository.findById(review.reviewId)).thenReturn(Mono.just(review))
        `when`(reviewRepository.save(any())).thenAnswer { Mono.just(it.getArgument<ReviewEntity>(0)) }

        StepVerifier.create(service.update(review.reviewId, "usr_req", UpdateReviewCommand(text = null, textProvided = true)))
            .assertNext { updated -> assertEquals(null, updated.text) }
            .verifyComplete()
    }

    @Test
    fun `hide is idempotent when already hidden`() {
        val review = existingReview().copy(hidden = true)
        `when`(reviewRepository.findById(review.reviewId)).thenReturn(Mono.just(review))

        StepVerifier.create(service.hide(review.reviewId))
            .assertNext { result ->
                assertTrue(result.hidden)
                assertEquals(review.version, result.version)
            }
            .verifyComplete()
    }

    @Test
    fun `hide changes visible review to hidden and bumps version`() {
        val review = existingReview()
        `when`(reviewRepository.findById(review.reviewId)).thenReturn(Mono.just(review))
        `when`(reviewRepository.save(any())).thenAnswer { Mono.just(it.getArgument<ReviewEntity>(0)) }

        StepVerifier.create(service.hide(review.reviewId))
            .assertNext { result ->
                assertTrue(result.hidden)
                assertEquals(review.version + 1, result.version)
            }
            .verifyComplete()
    }

    @Test
    fun `hide rejects non-existent review`() {
        `when`(reviewRepository.findById("rev_none")).thenReturn(Mono.empty())

        StepVerifier.create(service.hide("rev_none"))
            .expectErrorSatisfies { err -> assertTrue(err is ReviewNotFoundException) }
            .verify()
    }

    private fun closedRequest() = RequestEntity(
        requestId = "req_1",
        requesterUserId = "usr_req",
        mode = "public",
        title = "t",
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
        updatedAt = LocalDateTime.now(),
    )

    private fun selectedQuote() = QuoteEntity(
        quoteId = "quo_1",
        requestId = "req_1",
        supplierProfileId = "sprof_1",
        unitPriceEstimate = "800",
        moq = "2000",
        leadTime = "30",
        sampleCost = null,
        note = null,
        state = "selected",
        version = 1,
        createdAt = LocalDateTime.now(),
        updatedAt = LocalDateTime.now(),
    )

    private fun existingReview() = ReviewEntity(
        reviewId = "rev_1",
        requesterUserId = "usr_req",
        supplierProfileId = "sprof_1",
        requestId = "req_1",
        quoteId = "quo_1",
        rating = 5,
        text = null,
        hidden = false,
        version = 1,
        createdAt = LocalDateTime.now().minusDays(1),
        updatedAt = LocalDateTime.now().minusDays(1),
    )
}
