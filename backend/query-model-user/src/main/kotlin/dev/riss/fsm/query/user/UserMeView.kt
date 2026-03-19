package dev.riss.fsm.query.user

import dev.riss.fsm.shared.auth.UserRole
import java.time.LocalDateTime

data class UserMeView(
    val userId: String,
    val email: String,
    val role: UserRole,
    val businessApprovalState: String?,
    val createdAt: LocalDateTime,
)
