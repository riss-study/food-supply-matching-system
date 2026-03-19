package dev.riss.fsm.shared.security

import dev.riss.fsm.shared.auth.UserRole
import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import java.nio.charset.StandardCharsets
import java.time.Instant
import java.util.Date
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

    fun createRefreshToken(subject: String, email: String, role: UserRole): String {
        val now = Instant.now()
        val expiry = now.plusSeconds(properties.refreshTokenTtlSeconds)

        return Jwts.builder()
            .issuer(properties.issuer)
            .subject(subject)
            .claim("email", email)
            .claim("role", role.key())
            .claim("tokenType", "refresh")
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .signWith(signingKey)
            .compact()
    }

    fun accessTokenExpiresInSeconds(): Long = properties.accessTokenTtlSeconds

    fun parseClaims(token: String): Claims {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .payload
    }
}
