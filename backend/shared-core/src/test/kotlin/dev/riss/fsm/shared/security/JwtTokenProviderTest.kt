package dev.riss.fsm.shared.security

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class JwtTokenProviderTest {

    private val provider = JwtTokenProvider(JwtProperties())

    @Test
    fun `create and parse access token`() {
        val token = provider.createAccessToken(subject = "user-1", roles = listOf("REQUESTER"))
        val claims = provider.parseClaims(token)

        assertEquals("user-1", claims.subject)
        assertTrue((claims["roles"] as List<*>).contains("REQUESTER"))
    }
}
