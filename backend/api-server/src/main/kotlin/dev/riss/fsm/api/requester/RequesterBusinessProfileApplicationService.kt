package dev.riss.fsm.api.requester

import dev.riss.fsm.command.user.RequesterBusinessProfileCommandService
import dev.riss.fsm.command.user.SubmitBusinessProfileCommand
import dev.riss.fsm.command.user.UpdateBusinessProfileCommand
import dev.riss.fsm.projection.user.RequesterBusinessProfileProjectionService
import dev.riss.fsm.query.user.RequesterBusinessProfileQueryService
import dev.riss.fsm.query.user.UserMeQueryService
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import java.time.ZoneOffset

@Service
class RequesterBusinessProfileApplicationService(
    private val commandService: RequesterBusinessProfileCommandService,
    private val queryService: RequesterBusinessProfileQueryService,
    private val userMeQueryService: UserMeQueryService,
    private val projectionService: RequesterBusinessProfileProjectionService,
) {

    fun submit(principal: AuthenticatedUserPrincipal, request: SubmitRequesterBusinessProfileRequest): Mono<RequesterBusinessProfileSubmitResponse> {
        return ensureRequester(principal)
            .flatMap { me ->
                commandService.submit(
                    userId = principal.userId,
                    request = SubmitBusinessProfileCommand(
                        businessName = request.businessName,
                        businessRegistrationNumber = request.businessRegistrationNumber,
                        contactName = request.contactName,
                        contactPhone = request.contactPhone,
                        contactEmail = request.contactEmail,
                        verificationScope = request.verificationScope,
                    ),
                ).flatMap { profile ->
                    projectionService.project(profile, principal.email, principal.role)
                        .thenReturn(
                            RequesterBusinessProfileSubmitResponse(
                                profileId = profile.profileId,
                                approvalState = profile.approvalState,
                                submittedAt = profile.submittedAt!!.toInstant(ZoneOffset.UTC),
                            ),
                        )
                }
            }
    }

    fun get(principal: AuthenticatedUserPrincipal): Mono<RequesterBusinessProfileResponse> {
        return ensureRequester(principal)
            .then(queryService.findByUserId(principal.userId))
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Business profile not found")))
            .map { document ->
                RequesterBusinessProfileResponse(
                    profileId = document.profileId,
                    businessName = document.businessName,
                    businessRegistrationNumber = document.businessRegistrationNumber,
                    contactName = document.contactName,
                    contactPhone = document.contactPhone,
                    contactEmail = document.contactEmail,
                    verificationScope = document.verificationScope,
                    approvalState = document.approvalState,
                    submittedAt = document.submittedAt,
                    approvedAt = document.approvedAt,
                    rejectedAt = document.rejectedAt,
                    rejectionReason = document.rejectionReason,
                    updatedAt = document.updatedAt,
                )
            }
    }

    fun update(principal: AuthenticatedUserPrincipal, request: UpdateRequesterBusinessProfileRequest): Mono<RequesterBusinessProfileResponse> {
        return ensureRequester(principal)
            .flatMap {
                commandService.update(
                    userId = principal.userId,
                    request = UpdateBusinessProfileCommand(
                        businessName = request.businessName,
                        businessRegistrationNumber = request.businessRegistrationNumber,
                        contactName = request.contactName,
                        contactPhone = request.contactPhone,
                        contactEmail = request.contactEmail,
                        verificationScope = request.verificationScope,
                    ),
                )
            }
            .flatMap { profile ->
                projectionService.project(profile, principal.email, principal.role).thenReturn(profile)
            }
            .flatMap { get(principal) }
    }

    private fun ensureRequester(principal: AuthenticatedUserPrincipal): Mono<Unit> {
        return userMeQueryService.findMe(principal.userId)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")))
            .flatMap { me ->
                if (me.role.key() != "requester") {
                    Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Only requester accounts can access this endpoint"))
                } else {
                    Mono.just(Unit)
                }
            }
    }
}
