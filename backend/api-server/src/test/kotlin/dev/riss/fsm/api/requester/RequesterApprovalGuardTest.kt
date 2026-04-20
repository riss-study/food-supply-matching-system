package dev.riss.fsm.api.requester

import dev.riss.fsm.api.auth.UserMeService
import dev.riss.fsm.api.auth.UserMeView
import dev.riss.fsm.shared.auth.UserRole
import dev.riss.fsm.shared.error.BusinessApprovalRequiredException
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import reactor.core.publisher.Mono
import java.time.LocalDateTime

class RequesterApprovalGuardTest {

    private val userMeService = mock(UserMeService::class.java)
    private val guard = RequesterApprovalGuard(userMeService)

    @Test
    fun `rejects unapproved requester`() {
        `when`(userMeService.findMe("usr_1")).thenReturn(
            Mono.just(
                UserMeView(
                    userId = "usr_1",
                    email = "req@example.com",
                    role = UserRole.REQUESTER,
                    businessApprovalState = "submitted",
                    createdAt = LocalDateTime.now(),
                ),
            ),
        )

        assertThrows(BusinessApprovalRequiredException::class.java) {
            guard.requireApprovedRequester(AuthenticatedUserPrincipal("usr_1", "req@example.com", UserRole.REQUESTER)).block()
        }
    }
}
