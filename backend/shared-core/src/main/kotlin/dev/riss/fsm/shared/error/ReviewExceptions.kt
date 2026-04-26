package dev.riss.fsm.shared.error

class ReviewNotFoundException(
    override val message: String = "Review not found",
) : RuntimeException(message)

/** 권한 위반: 본인 의뢰 아님 (403) */
class ReviewEligibilityFailedException(
    override val message: String = "Not eligible to write a review",
) : RuntimeException(message)

/** 자격/상태 위반: 의뢰 미마감 / selected quote 없음 (409) */
class ReviewNotEligibleByStateException(
    override val message: String = "Review is not allowed in current request/quote state",
) : RuntimeException(message)

/** 권한 위반: 본인 리뷰 아님 (403) */
class ReviewUpdateForbiddenException(
    override val message: String = "Review update is forbidden",
) : RuntimeException(message)

/** 상태 위반: 숨김 처리됨 / 수정 가능 기간 만료 (409) */
class ReviewImmutableException(
    override val message: String = "Review is immutable in current state",
) : RuntimeException(message)

class DuplicateReviewException(
    override val message: String = "Review already exists for this request and supplier",
) : RuntimeException(message)

class ReviewContentViolationException(
    override val message: String = "Review content violates moderation rules",
) : RuntimeException(message)
