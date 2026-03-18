package dev.riss.fsm.shared.security

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

    fun createAccessToken(subject: String, roles: Collection<String>): String {
        val now = Instant.now()
        val expiry = now.plusSeconds(properties.accessTokenTtlSeconds)

        return Jwts.builder()
            .issuer(properties.issuer)
            .subject(subject)
            .claim("roles", roles.toList())
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .signWith(signingKey)
            .compact()
    }

    fun parseClaims(token: String): Claims {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .payload
    }
}
