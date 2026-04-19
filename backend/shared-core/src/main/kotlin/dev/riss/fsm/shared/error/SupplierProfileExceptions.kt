package dev.riss.fsm.shared.error

class SupplierProfileAlreadyExistsException(
    override val message: String = "Supplier profile already exists",
) : RuntimeException(message)

class SupplierProfileNotFoundException(
    override val message: String = "Supplier profile not found",
) : RuntimeException(message)

class ApprovedSupplierProfileImmutableException(
    override val message: String = "Approved supplier profile cannot be updated",
) : RuntimeException(message)

class SupplierProfileStateImmutableException(
    override val message: String = "Supplier profile is not editable in the current state",
) : RuntimeException(message)
