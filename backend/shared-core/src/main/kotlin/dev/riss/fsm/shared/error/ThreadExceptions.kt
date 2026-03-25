package dev.riss.fsm.shared.error

class ThreadNotFoundException(
    override val message: String = "Thread not found",
) : RuntimeException(message)

class ThreadAccessDeniedException(
    override val message: String = "Access denied to this thread",
) : RuntimeException(message)

class ContactShareAlreadyRequestedException(
    override val message: String = "Contact share request is already in progress",
) : RuntimeException(message)

class ContactShareApprovalConflictException(
    override val message: String = "Contact share approval is not allowed in the current state",
) : RuntimeException(message)

class ContactShareRevokeForbiddenException(
    override val message: String = "Contact share cannot be revoked after mutual approval",
) : RuntimeException(message)

class ContactShareNotRequestedException(
    override val message: String = "Contact share has not been requested",
) : RuntimeException(message)
