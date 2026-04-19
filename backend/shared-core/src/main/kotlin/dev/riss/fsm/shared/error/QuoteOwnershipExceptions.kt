package dev.riss.fsm.shared.error

class QuoteNotFoundException(
    override val message: String = "Quote not found",
) : RuntimeException(message)

class QuoteOwnerMismatchException(
    override val message: String = "Not the quote owner",
) : RuntimeException(message)
