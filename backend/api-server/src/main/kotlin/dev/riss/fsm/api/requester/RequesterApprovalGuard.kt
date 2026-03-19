package dev.riss.fsm.api.requester

import dev.riss.fsm.query.user.UserMeQueryService
import dev.riss.fsm.shared.error.BusinessApprovalRequiredException
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono

@Service
class RequesterApprovalGuard(
    private val userMeQueryService: UserMeQueryService,
) {
    fun requireApprovedRequester(principal: AuthenticatedUserPrincipal): Mono<Void> {
        return userMeQueryService.findMe(principal.userId)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")))
            .flatMap { me ->
                if (me.role.key() != "requester") {
                    Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Only requester accounts can access this endpoint"))
                } else if (me.businessApprovalState != "approved") {
                    Mono.error(BusinessApprovalRequiredException())
                } else {
                    Mono.empty()
                }
            }
    }
}
