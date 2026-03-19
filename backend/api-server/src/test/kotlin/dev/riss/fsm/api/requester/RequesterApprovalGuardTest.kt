package dev.riss.fsm.api.requester

import dev.riss.fsm.query.user.UserMeQueryService
import dev.riss.fsm.query.user.UserMeView
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

    private val userMeQueryService = mock(UserMeQueryService::class.java)
    private val guard = RequesterApprovalGuard(userMeQueryService)

    @Test
    fun `rejects unapproved requester`() {
        `when`(userMeQueryService.findMe("usr_1")).thenReturn(
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
