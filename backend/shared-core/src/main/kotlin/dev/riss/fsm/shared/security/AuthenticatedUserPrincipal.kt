package dev.riss.fsm.shared.security

import dev.riss.fsm.shared.auth.UserRole

data class AuthenticatedUserPrincipal(
    val userId: String,
    val email: String,
    val role: UserRole,
)
