package dev.riss.fsm.api.requester

import dev.riss.fsm.api.auth.UserMeService
import dev.riss.fsm.command.user.BusinessProfileEntity
import dev.riss.fsm.command.user.BusinessProfileRepository
import dev.riss.fsm.command.user.RequesterBusinessProfileCommandService
import dev.riss.fsm.command.user.SubmitBusinessProfileCommand
import dev.riss.fsm.command.user.UpdateBusinessProfileCommand
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import java.time.ZoneOffset

@Service
class RequesterBusinessProfileApplicationService(
    private val commandService: RequesterBusinessProfileCommandService,
    private val businessProfileRepository: BusinessProfileRepository,
    private val userMeService: UserMeService,
) {

    fun submit(principal: AuthenticatedUserPrincipal, request: SubmitRequesterBusinessProfileRequest): Mono<RequesterBusinessProfileSubmitResponse> {
        return ensureRequester(principal)
            .flatMap {
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
                ).map { profile ->
                    RequesterBusinessProfileSubmitResponse(
                        profileId = profile.profileId,
                        approvalState = profile.approvalState,
                        submittedAt = profile.submittedAt!!.toInstant(ZoneOffset.UTC),
                    )
                }
            }
    }

    fun get(principal: AuthenticatedUserPrincipal): Mono<RequesterBusinessProfileResponse> {
        return ensureRequester(principal)
            .then(businessProfileRepository.findByUserAccountId(principal.userId))
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Business profile not found")))
            .map { entity -> toResponse(entity) }
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
            .map { entity -> toResponse(entity) }
    }

    private fun ensureRequester(principal: AuthenticatedUserPrincipal): Mono<Unit> {
        return userMeService.findMe(principal.userId)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")))
            .flatMap { me ->
                if (me.role.key() != "requester") {
                    Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Only requester accounts can access this endpoint"))
                } else {
                    Mono.just(Unit)
                }
            }
    }

    private fun toResponse(entity: BusinessProfileEntity): RequesterBusinessProfileResponse {
        val zone = ZoneOffset.UTC
        return RequesterBusinessProfileResponse(
            profileId = entity.profileId,
            businessName = entity.businessName,
            businessRegistrationNumber = entity.businessRegistrationNumber,
            contactName = entity.contactName,
            contactPhone = entity.contactPhone,
            contactEmail = entity.contactEmail,
            verificationScope = entity.verificationScope,
            approvalState = entity.approvalState,
            submittedAt = entity.submittedAt?.toInstant(zone),
            approvedAt = entity.approvedAt?.toInstant(zone),
            rejectedAt = entity.rejectedAt?.toInstant(zone),
            rejectionReason = entity.rejectionReason,
            updatedAt = entity.updatedAt.toInstant(zone),
        )
    }
}
