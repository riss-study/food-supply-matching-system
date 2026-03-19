package dev.riss.fsm.api.auth

import dev.riss.fsm.shared.api.ApiSuccessResponse
import dev.riss.fsm.shared.auth.UserRole
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import org.springframework.http.ResponseEntity
import reactor.core.publisher.Mono
import java.time.Instant

class AuthControllerIntegrationTest {

    private val authApplicationService = mock(AuthApplicationService::class.java)
    private val controller = AuthController(authApplicationService)

    @Test
    fun signupCreatesAccountEnvelope() {
        val request = SignupRequest(email = "requester@example.com", password = "SecurePass123!", role = UserRole.REQUESTER, businessName = "Example Foods")
        val response = SignupResponse(userId = "usr_test", email = request.email, role = request.role, createdAt = Instant.now())
        `when`(authApplicationService.signup(request)).thenReturn(Mono.just(response))

        val result = controller.signup(request).block() as ResponseEntity<ApiSuccessResponse<SignupResponse>>

        assertEquals(201, result.statusCode.value())
        assertEquals(100, result.body?.code)
        assertEquals("requester@example.com", result.body?.data?.email)
    }

    @Test
    fun loginReturnsTokenEnvelope() {
        val request = LoginRequest(email = "login@example.com", password = "SecurePass123!")
        val response = LoginResponse(
            accessToken = "access-token",
            refreshToken = "refresh-token",
            expiresIn = 3600,
            user = AuthenticatedUserResponse(userId = "usr_test", email = "login@example.com", role = UserRole.REQUESTER),
        )
        `when`(authApplicationService.login(request)).thenReturn(Mono.just(response))

        val result = controller.login(request).block()!!

        assertEquals(100, result.code)
        assertEquals("access-token", result.data.accessToken)
    }

    @Test
    fun meReturnsAuthenticatedEnvelope() {
        val principal = AuthenticatedUserPrincipal(userId = "usr_test", email = "me@example.com", role = UserRole.REQUESTER)
        val response = MeResponse(
            userId = principal.userId,
            email = principal.email,
            role = principal.role,
            businessApprovalState = "not_submitted",
            createdAt = Instant.now(),
        )
        `when`(authApplicationService.me(principal)).thenReturn(Mono.just(response))

        val result = controller.me(principal).block()!!

        assertEquals(100, result.code)
        assertEquals("not_submitted", result.data.businessApprovalState)
    }
}
