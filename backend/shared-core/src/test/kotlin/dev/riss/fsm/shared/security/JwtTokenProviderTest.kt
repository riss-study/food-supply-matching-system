package dev.riss.fsm.shared.security

import dev.riss.fsm.shared.auth.UserRole
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class JwtTokenProviderTest {

    private val provider = JwtTokenProvider(JwtProperties())

    @Test
    fun `create and parse access token`() {
        val token = provider.createAccessToken(subject = "user-1", email = "user@example.com", role = UserRole.REQUESTER)
        val claims = provider.parseClaims(token)

        assertEquals("user-1", claims.subject)
        assertEquals("user@example.com", claims["email"])
        assertEquals("requester", claims["role"])
        assertEquals("access", claims["tokenType"])
    }

    @Test
    fun `create and parse refresh token`() {
        val token = provider.createRefreshToken(subject = "user-1", email = "user@example.com", role = UserRole.REQUESTER)
        val claims = provider.parseClaims(token)

        assertEquals("user-1", claims.subject)
        assertEquals("refresh", claims["tokenType"])
        assertTrue(provider.accessTokenExpiresInSeconds() > 0)
    }
}
