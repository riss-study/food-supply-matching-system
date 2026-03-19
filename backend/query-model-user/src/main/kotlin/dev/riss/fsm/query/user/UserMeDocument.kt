package dev.riss.fsm.query.user

import dev.riss.fsm.shared.auth.UserRole
import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("user_me_view")
data class UserMeDocument(
    @Id
    val userId: String,
    val email: String,
    val role: UserRole,
    val businessApprovalState: String?,
    val createdAt: Instant,
)
