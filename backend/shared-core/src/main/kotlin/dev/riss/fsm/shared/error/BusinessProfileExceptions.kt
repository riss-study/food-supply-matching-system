package dev.riss.fsm.shared.error

class BusinessProfileNotFoundException(
    override val message: String = "Business profile not found",
) : RuntimeException(message)

class BusinessProfileAlreadySubmittedException(
    override val message: String = "Business profile already submitted or approved",
) : RuntimeException(message)

class ApprovedBusinessProfileImmutableException(
    override val message: String = "Approved business profile cannot be updated",
) : RuntimeException(message)

class BusinessProfilePartialUpdateNotAllowedException(
    override val message: String = "Business profile must be submitted or rejected before partial update",
) : RuntimeException(message)
