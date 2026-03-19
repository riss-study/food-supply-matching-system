package dev.riss.fsm.shared.error

class BusinessApprovalRequiredException(
    override val message: String = "Business approval required",
) : RuntimeException(message)
