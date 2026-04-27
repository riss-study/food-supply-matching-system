package dev.riss.fsm.api.auth

import org.springframework.data.redis.core.ReactiveStringRedisTemplate
import org.springframework.stereotype.Component
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
 */
@Component
class RefreshTokenRevocationStore(
    private val redis: ReactiveStringRedisTemplate,
) {
    fun isRevoked(jti: String): Mono<Boolean> =
        redis.hasKey(keyOf(jti))

    fun revoke(jti: String, expiresAt: Instant): Mono<Boolean> {
        val ttl = Duration.between(Instant.now(), expiresAt)
        // 이미 만료된 토큰이면 굳이 저장 안 함 (parseClaims 가 자체 거부).
        if (ttl.isNegative || ttl.isZero) return Mono.just(true)
        return redis.opsForValue().set(keyOf(jti), "1", ttl)
    }

    private fun keyOf(jti: String): String = "refresh:revoked:$jti"
}
