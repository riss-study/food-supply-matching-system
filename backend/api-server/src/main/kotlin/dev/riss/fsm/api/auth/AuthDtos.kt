package dev.riss.fsm.api.auth

import dev.riss.fsm.shared.auth.UserRole
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.time.Instant

data class SignupRequest(
    @field:Email
    val email: String,
    @field:Size(min = 8, max = 100)
    @field:Pattern(
        regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z\\d]).+$",
        message = "password must include letters, numbers, and special characters",
    )
    val password: String,
    val role: UserRole,
    @field:NotBlank
    @field:Size(min = 2, max = 100)
    val businessName: String,
)

data class SignupResponse(
    val userId: String,
    val email: String,
    val role: UserRole,
    val createdAt: Instant,
)

data class LoginRequest(
    @field:Email
    val email: String,
    @field:NotBlank
    val password: String,
)

data class LoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long,
    val user: AuthenticatedUserResponse,
)

data class AuthenticatedUserResponse(
    val userId: String,
    val email: String,
    val role: UserRole,
)

data class MeResponse(
    val userId: String,
    val email: String,
    val role: UserRole,
    val businessApprovalState: String?,
    val createdAt: Instant,
)
