package dev.riss.fsm.api.auth

import org.springframework.data.redis.core.ReactiveStringRedisTemplate
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import java.time.Duration
import java.time.Instant

/**
 * refresh token 폐기 (revocation) 저장소.
 *
 * Redis SETEX 로 jti 별 폐기 마크 + TTL = (token expiry - now). TTL 지나면 자동 만료.
 * cleanup 작업 / DB 테이블 / 인덱스 불필요.
 *
 * 키: `refresh:revoked:{jti}` → 값은 의미 없는 마커 ("1").
 *
 * Redis 장애 시 — fail-closed 정책. 보안 측면에서는 옳으나 가용성 영향:
 *   - isRevoked Redis 다운 → 503 (refresh 거부, retry 가능). 토큰 자체는 살아있음.
 *   - revoke (logout) Redis 다운 → 503. 클라이언트는 retry 후 재시도. 그 사이 토큰은 폐기 안 됨 (위험)
 *     하지만 access 가 곧 만료되니 영향 제한적. 본격 안정화는 outbox 패턴 또는 sentinel/cluster 도입.
 */
@Component
class RefreshTokenRevocationStore(
    private val redis: ReactiveStringRedisTemplate,
) {
    fun isRevoked(jti: String): Mono<Boolean> =
        redis.hasKey(keyOf(jti))
            .onErrorMap { error ->
                ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Token revocation store unavailable", error)
            }

    fun revoke(jti: String, expiresAt: Instant): Mono<Boolean> {
        val ttl = Duration.between(Instant.now(), expiresAt)
        // 이미 만료된 토큰이면 굳이 저장 안 함 (parseClaims 가 자체 거부).
        if (ttl.isNegative || ttl.isZero) return Mono.just(true)
        return redis.opsForValue().set(keyOf(jti), "1", ttl)
            .onErrorMap { error ->
                ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Token revocation store unavailable", error)
            }
    }

    private fun keyOf(jti: String): String = "refresh:revoked:$jti"
}
