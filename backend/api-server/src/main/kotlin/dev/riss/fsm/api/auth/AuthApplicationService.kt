package dev.riss.fsm.api.auth

import dev.riss.fsm.command.user.AuthCommandService
import dev.riss.fsm.shared.auth.UserRole
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import dev.riss.fsm.shared.security.JwtTokenProvider
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import java.time.ZoneOffset

@Service
class AuthApplicationService(
    private val authCommandService: AuthCommandService,
    private val userMeService: UserMeService,
    private val jwtTokenProvider: JwtTokenProvider,
) {

    fun signup(request: SignupRequest): Mono<SignupResponse> {
        // 권한 상승 방지: 외부 signup 으로는 ADMIN 계정 생성 불가.
        // ADMIN 계정은 DB seed 또는 운영 도구로만 부여.
        if (request.role == UserRole.ADMIN) {
            return Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Admin signup is not allowed"))
        }
        return authCommandService.register(request.email, request.password, request.role, request.businessName)
            .map { user ->
                SignupResponse(
                    userId = user.userId,
                    email = user.email,
                    role = user.role,
                    createdAt = user.createdAt.toInstant(ZoneOffset.UTC),
                )
            }
    }

    fun login(request: LoginRequest): Mono<LoginResponse> {
        return authCommandService.authenticate(request.email, request.password)
            .map { user ->
                LoginResponse(
                    accessToken = jwtTokenProvider.createAccessToken(user.userId, user.email, user.role),
                    refreshToken = jwtTokenProvider.createRefreshToken(user.userId, user.email, user.role),
                    expiresIn = jwtTokenProvider.accessTokenExpiresInSeconds(),
                    user = AuthenticatedUserResponse(
                        userId = user.userId,
                        email = user.email,
                        role = user.role,
                    ),
                )
            }
    }

    fun me(principal: AuthenticatedUserPrincipal): Mono<MeResponse> {
        return userMeService.findMe(principal.userId)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")))
            .map { view ->
                MeResponse(
                    userId = view.userId,
                    email = view.email,
                    role = view.role,
                    businessApprovalState = view.businessApprovalState,
                    createdAt = view.createdAt.toInstant(ZoneOffset.UTC),
                )
            }
    }
}
