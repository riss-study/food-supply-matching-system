package dev.riss.fsm.shared.error

class RequestNotFoundException(
    override val message: String = "Request not found",
) : RuntimeException(message)

class RequestAccessForbiddenException(
    override val message: String = "Not the request owner",
) : RuntimeException(message)

class RequestStateTransitionException(
    override val message: String,
) : RuntimeException(message)
