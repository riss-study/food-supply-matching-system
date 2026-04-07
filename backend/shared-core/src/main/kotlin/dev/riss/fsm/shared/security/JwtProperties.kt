package dev.riss.fsm.shared.security

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "security.jwt")
data class JwtProperties(
    val issuer: String = "dev.riss.fsm",
    val secret: String,
    val accessTokenTtlSeconds: Long = 3600,
    val refreshTokenTtlSeconds: Long = 604800,
)
