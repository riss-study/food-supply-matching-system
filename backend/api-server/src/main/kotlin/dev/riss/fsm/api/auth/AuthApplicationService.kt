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
    private val revocationStore: RefreshTokenRevocationStore,
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
                val refresh = jwtTokenProvider.createRefreshToken(user.userId, user.email, user.role)
                LoginResponse(
                    accessToken = jwtTokenProvider.createAccessToken(user.userId, user.email, user.role),
                    refreshToken = refresh.token,
                    expiresIn = jwtTokenProvider.accessTokenExpiresInSeconds(),
                    user = AuthenticatedUserResponse(
                        userId = user.userId,
                        email = user.email,
                        role = user.role,
                    ),
                )
            }
    }

    /**
     * refresh token 으로 새 access token 발급.
     *  - tokenType=="refresh" 검증 (access 또는 forge 차단).
     *  - 서명/만료 검증 (parseClaims throw).
     *  - jti 가 RefreshTokenRevocationStore 에 폐기 등록되어 있으면 거부 (logout 후 재사용 차단).
     */
    fun refresh(request: RefreshRequest): Mono<RefreshResponse> {
        return Mono.fromCallable { jwtTokenProvider.parseClaims(request.refreshToken) }
            .onErrorMap { error ->
                if (error is ResponseStatusException) error
                else ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token")
            }
            .flatMap { claims ->
                if (claims["tokenType"]?.toString() != "refresh") {
                    return@flatMap Mono.error(ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token required"))
                }
                val jti = claims.id ?: return@flatMap Mono.error(ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing jti"))
                val userId = claims.subject ?: return@flatMap Mono.error(ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing token subject"))
                val email = claims["email"]?.toString() ?: return@flatMap Mono.error(ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing token email"))
                val role = UserRole.fromKey(claims["role"]?.toString() ?: return@flatMap Mono.error(ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing token role")))

                revocationStore.isRevoked(jti).flatMap { revoked ->
                    if (revoked) {
                        Mono.error(ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token has been revoked"))
                    } else {
                        Mono.just(RefreshResponse(
                            accessToken = jwtTokenProvider.createAccessToken(userId, email, role),
                            expiresIn = jwtTokenProvider.accessTokenExpiresInSeconds(),
                        ))
                    }
                }
            }
    }

    /**
     * logout: 클라이언트가 보낸 refresh token 의 jti 를 revocation store 에 등록.
     *  - TTL = 토큰 만료까지 남은 시간 → 만료 후 자동 정리.
     *  - 이미 만료된 토큰이면 no-op.
     *  - 잘못된 / 변조된 토큰은 401.
     */
    fun logout(request: RefreshRequest): Mono<Void> {
        return Mono.fromCallable { jwtTokenProvider.parseClaims(request.refreshToken) }
            .onErrorMap { error ->
                if (error is ResponseStatusException) error
                else ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token")
            }
            .flatMap { claims ->
                if (claims["tokenType"]?.toString() != "refresh") {
                    return@flatMap Mono.error(ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token required"))
                }
                val jti = claims.id ?: return@flatMap Mono.error(ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing jti"))
                val expiresAt = claims.expiration?.toInstant() ?: return@flatMap Mono.error(ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing expiration"))
                revocationStore.revoke(jti, expiresAt).then()
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
