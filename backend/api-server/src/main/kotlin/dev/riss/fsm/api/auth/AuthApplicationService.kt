package dev.riss.fsm.api.auth

import dev.riss.fsm.command.user.AuthCommandService
import dev.riss.fsm.projection.user.UserAuthProjectionService
import dev.riss.fsm.query.user.UserMeQueryService
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
    private val userAuthProjectionService: UserAuthProjectionService,
    private val userMeQueryService: UserMeQueryService,
    private val jwtTokenProvider: JwtTokenProvider,
) {

    fun signup(request: SignupRequest): Mono<SignupResponse> {
        return authCommandService.register(request.email, request.password, request.role, request.businessName)
            .flatMap { user ->
                userAuthProjectionService.projectSignedUpUser(
                    userId = user.userId,
                    email = user.email,
                    role = user.role,
                    businessApprovalState = if (user.role == dev.riss.fsm.shared.auth.UserRole.REQUESTER) "not_submitted" else null,
                    createdAt = user.createdAt.toInstant(ZoneOffset.UTC),
                ).thenReturn(user)
            }
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
        return userMeQueryService.findMe(principal.userId)
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
