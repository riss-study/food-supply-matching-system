package dev.riss.fsm.admin.auth

import dev.riss.fsm.command.user.AuthCommandService
import dev.riss.fsm.shared.api.ApiSuccessResponse
import dev.riss.fsm.shared.auth.UserRole
import dev.riss.fsm.shared.security.JwtTokenProvider
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono

data class AdminLoginRequest(
    val email: String,
    val password: String,
)

data class AdminLoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long,
    val user: AdminUserResponse,
)

data class AdminUserResponse(
    val userId: String,
    val email: String,
    val role: UserRole,
)

@RestController
@RequestMapping("/api/admin/auth")
@Tag(name = "admin-auth", description = "Admin authentication")
class AdminAuthController(
    private val authCommandService: AuthCommandService,
    private val jwtTokenProvider: JwtTokenProvider,
) {

    @PostMapping("/login")
    @Operation(summary = "Admin login", description = "Authenticate an admin user")
    fun login(@Valid @RequestBody request: AdminLoginRequest): Mono<ApiSuccessResponse<AdminLoginResponse>> {
        return authCommandService.authenticate(request.email, request.password)
            .flatMap { user ->
                if (user.role != UserRole.ADMIN) {
                    Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "관리자 계정만 로그인할 수 있습니다."))
                } else {
                    Mono.just(
                        ApiSuccessResponse(
                            message = "Login successful",
                            data = AdminLoginResponse(
                                accessToken = jwtTokenProvider.createAccessToken(user.userId, user.email, user.role),
                                refreshToken = jwtTokenProvider.createRefreshToken(user.userId, user.email, user.role).token,
                                expiresIn = jwtTokenProvider.accessTokenExpiresInSeconds(),
                                user = AdminUserResponse(
                                    userId = user.userId,
                                    email = user.email,
                                    role = user.role,
                                ),
                            ),
                        )
                    )
                }
            }
    }
}
