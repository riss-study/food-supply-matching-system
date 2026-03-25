package dev.riss.fsm.shared.error

class ThreadNotFoundException(
    override val message: String = "Thread not found",
) : RuntimeException(message)

class ThreadAccessDeniedException(
    override val message: String = "Access denied to this thread",
) : RuntimeException(message)