package dev.riss.fsm.shared.error

class DuplicateActiveQuoteException(
    override val message: String = "Active quote already exists for this request",
) : RuntimeException(message)
