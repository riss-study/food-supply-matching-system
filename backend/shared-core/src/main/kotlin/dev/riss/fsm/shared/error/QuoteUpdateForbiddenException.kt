package dev.riss.fsm.shared.error

class QuoteUpdateForbiddenException(
    override val message: String = "Quote update is forbidden",
) : RuntimeException(message)
