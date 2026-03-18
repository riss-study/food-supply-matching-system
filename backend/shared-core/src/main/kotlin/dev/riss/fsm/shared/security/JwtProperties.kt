package dev.riss.fsm.shared.security

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "security.jwt")
data class JwtProperties(
    val issuer: String = "dev.riss.fsm",
    val secret: String = "task01-local-secret-task01-local-secret",
    val accessTokenTtlSeconds: Long = 7200,
)
