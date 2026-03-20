package dev.riss.fsm.shared.error

class QuoteSubmissionForbiddenException(
    override val message: String = "Quote submission is forbidden",
) : RuntimeException(message)
