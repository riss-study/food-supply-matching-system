package dev.riss.fsm.api.auth

import dev.riss.fsm.shared.api.ApiSuccessResponse
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api")
@Tag(name = "auth")
class AuthController(
    private val authApplicationService: AuthApplicationService,
) {

    @PostMapping("/auth/signup")
    @Operation(summary = "Signup", description = "Create a user account with email, password, and role")
    fun signup(@Valid @RequestBody request: SignupRequest): Mono<ResponseEntity<ApiSuccessResponse<SignupResponse>>> {
        return authApplicationService.signup(request)
            .map { response ->
                ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiSuccessResponse(message = "Account created successfully", data = response))
            }
    }

    @PostMapping("/auth/login")
    @Operation(summary = "Login", description = "Authenticate a user and issue JWT tokens")
    fun login(@Valid @RequestBody request: LoginRequest): Mono<ApiSuccessResponse<LoginResponse>> {
        return authApplicationService.login(request)
            .map { response -> ApiSuccessResponse(message = "Login successful", data = response) }
    }

    @PostMapping("/auth/refresh")
    @Operation(summary = "Refresh access token", description = "Exchange a refresh token for a new access token")
    fun refresh(@Valid @RequestBody request: RefreshRequest): Mono<ApiSuccessResponse<RefreshResponse>> {
        return authApplicationService.refresh(request)
            .map { response -> ApiSuccessResponse(message = "Access token refreshed", data = response) }
    }

    @PostMapping("/auth/logout")
    @Operation(summary = "Logout", description = "Revoke a refresh token (client should also clear local storage)")
    fun logout(@Valid @RequestBody request: RefreshRequest): Mono<ApiSuccessResponse<Unit>> {
        return authApplicationService.logout(request)
            .thenReturn(ApiSuccessResponse(message = "Logged out", data = Unit))
    }

    @GetMapping("/me")
    @Operation(summary = "Me", description = "Get the currently authenticated user", security = [SecurityRequirement(name = "bearerAuth")])
    fun me(@AuthenticationPrincipal principal: AuthenticatedUserPrincipal): Mono<ApiSuccessResponse<MeResponse>> {
        return authApplicationService.me(principal)
            .map { response -> ApiSuccessResponse(message = "Success", data = response) }
    }
}
