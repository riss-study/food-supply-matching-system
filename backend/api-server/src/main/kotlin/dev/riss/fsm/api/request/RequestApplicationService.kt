package dev.riss.fsm.api.request

import dev.riss.fsm.api.requester.RequesterApprovalGuard
import dev.riss.fsm.command.request.CreateRequestCommand
import dev.riss.fsm.command.request.RequestCommandService
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.ZoneOffset

@Service
class RequestApplicationService(
    private val requesterApprovalGuard: RequesterApprovalGuard,
    private val requestCommandService: RequestCommandService,
) {
    fun create(principal: AuthenticatedUserPrincipal, request: CreateRequestRequest): Mono<CreateRequestResponse> {
        return requesterApprovalGuard.requireApprovedRequester(principal)
            .then(
                requestCommandService.create(
                    CreateRequestCommand(
                        requesterUserId = principal.userId,
                        mode = request.mode,
                        title = request.title,
                        category = request.category,
                        desiredVolume = request.desiredVolume,
                        targetPriceMin = request.targetPriceRange?.min,
                        targetPriceMax = request.targetPriceRange?.max,
                        certificationRequirement = request.certificationRequirement,
                        rawMaterialRule = request.rawMaterialRule,
                        packagingRequirement = request.packagingRequirement,
                        deliveryRequirement = request.deliveryRequirement,
                        notes = request.notes,
                    )
                )
            )
            .map { entity ->
                CreateRequestResponse(
                    requestId = entity.requestId,
                    state = entity.state,
                    createdAt = entity.createdAt.toInstant(ZoneOffset.UTC),
                )
            }
    }
}
