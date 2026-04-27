package dev.riss.fsm.shared.security

import dev.riss.fsm.shared.auth.UserRole
import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import java.nio.charset.StandardCharsets
import java.time.Instant
import java.util.Date
import java.util.UUID
import javax.crypto.SecretKey

class JwtTokenProvider(
    private val properties: JwtProperties,
) {
    private val signingKey: SecretKey = Keys.hmacShaKeyFor(properties.secret.toByteArray(StandardCharsets.UTF_8))

    fun createAccessToken(subject: String, email: String, role: UserRole): String {
        val now = Instant.now()
        val expiry = now.plusSeconds(properties.accessTokenTtlSeconds)

        return Jwts.builder()
            .issuer(properties.issuer)
            .subject(subject)
            .claim("email", email)
            .claim("role", role.key())
            .claim("tokenType", "access")
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .signWith(signingKey)
            .compact()
    }

    /**
     * @return 발급된 토큰 + 그 토큰의 jti (server side blacklist 용 키).
     */
    fun createRefreshToken(subject: String, email: String, role: UserRole): RefreshTokenIssued {
        val now = Instant.now()
        val expiry = now.plusSeconds(properties.refreshTokenTtlSeconds)
        val jti = UUID.randomUUID().toString()

        val token = Jwts.builder()
            .id(jti)
            .issuer(properties.issuer)
            .subject(subject)
            .claim("email", email)
            .claim("role", role.key())
            .claim("tokenType", "refresh")
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .signWith(signingKey)
            .compact()
        return RefreshTokenIssued(token = token, jti = jti, expiresAt = expiry)
    }

    fun refreshTokenTtlSeconds(): Long = properties.refreshTokenTtlSeconds

    fun accessTokenExpiresInSeconds(): Long = properties.accessTokenTtlSeconds

    fun parseClaims(token: String): Claims {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .payload
    }
}

data class RefreshTokenIssued(
    val token: String,
    val jti: String,
    val expiresAt: Instant,
)
