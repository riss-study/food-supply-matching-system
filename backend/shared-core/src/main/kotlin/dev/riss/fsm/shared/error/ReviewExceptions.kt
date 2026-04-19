package dev.riss.fsm.shared.error

class ReviewNotFoundException(
    override val message: String = "Review not found",
) : RuntimeException(message)

class ReviewEligibilityFailedException(
    override val message: String = "Not eligible to write a review",
) : RuntimeException(message)

class ReviewUpdateForbiddenException(
    override val message: String = "Review update is forbidden",
) : RuntimeException(message)

class DuplicateReviewException(
    override val message: String = "Review already exists for this request and supplier",
) : RuntimeException(message)

class ReviewContentViolationException(
    override val message: String = "Review content violates moderation rules",
) : RuntimeException(message)
