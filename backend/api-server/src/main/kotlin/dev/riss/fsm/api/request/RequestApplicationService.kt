package dev.riss.fsm.api.request

import dev.riss.fsm.api.requester.RequesterApprovalGuard
import dev.riss.fsm.command.request.CreateRequestCommand
import dev.riss.fsm.command.request.RequestCommandService
import dev.riss.fsm.command.request.UpdateRequestCommand
import dev.riss.fsm.projection.request.RequestProjectionService
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import java.time.ZoneOffset

@Service
class RequestApplicationService(
    private val requesterApprovalGuard: RequesterApprovalGuard,
    private val requestCommandService: RequestCommandService,
    private val requestProjectionService: RequestProjectionService,
) {
    fun create(principal: AuthenticatedUserPrincipal, request: CreateRequestRequest): Mono<CreateRequestResponse> {
        if (request.mode == "targeted" && request.targetSupplierIds.isNullOrEmpty()) {
            return Mono.error(ResponseStatusException(HttpStatus.BAD_REQUEST, "targetSupplierIds are required for targeted mode"))
        }
        if (request.targetPriceRange?.min != null && request.targetPriceRange.max != null && request.targetPriceRange.min > request.targetPriceRange.max) {
            return Mono.error(ResponseStatusException(HttpStatus.BAD_REQUEST, "targetPriceRange.min must be less than or equal to max"))
        }

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
                        targetSupplierIds = request.targetSupplierIds,
                    )
                )
            )
            .flatMap { entity -> requestProjectionService.projectRequestCreated(entity) }
            .map { entity ->
                CreateRequestResponse(
                    requestId = entity.requestId,
                    state = entity.state,
                    createdAt = entity.createdAt.toInstant(ZoneOffset.UTC),
                )
            }
    }

    fun update(principal: AuthenticatedUserPrincipal, requestId: String, request: UpdateRequestRequest): Mono<UpdateRequestResponse> {
        if (request.targetPriceRange?.min != null && request.targetPriceRange.max != null && request.targetPriceRange.min > request.targetPriceRange.max) {
            return Mono.error(ResponseStatusException(HttpStatus.BAD_REQUEST, "targetPriceRange.min must be less than or equal to max"))
        }

        return requestCommandService.update(
            requestId = requestId,
            requesterUserId = principal.userId,
            command = UpdateRequestCommand(
                title = request.title,
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
            .flatMap { entity -> requestProjectionService.projectRequestUpdated(entity) }
            .map { entity ->
                UpdateRequestResponse(
                    requestId = entity.requestId,
                    state = entity.state,
                    updatedAt = entity.updatedAt.toInstant(ZoneOffset.UTC),
                )
            }
    }

    fun publish(principal: AuthenticatedUserPrincipal, requestId: String): Mono<PublishRequestResponse> {
        return requestCommandService.publish(
            requestId = requestId,
            requesterUserId = principal.userId,
        )
            .flatMap { entity -> requestProjectionService.projectRequestPublished(entity) }
            .map { entity ->
                PublishRequestResponse(
                    requestId = entity.requestId,
                    state = entity.state,
                    publishedAt = entity.updatedAt.toInstant(ZoneOffset.UTC),
                )
            }
    }

    fun close(principal: AuthenticatedUserPrincipal, requestId: String): Mono<CloseRequestResponse> {
        return requestCommandService.close(
            requestId = requestId,
            requesterUserId = principal.userId,
        )
            .flatMap { entity -> requestProjectionService.projectRequestClosed(entity) }
            .map { entity ->
                CloseRequestResponse(
                    requestId = entity.requestId,
                    state = entity.state,
                    closedAt = entity.updatedAt.toInstant(ZoneOffset.UTC),
                )
            }
    }

    fun cancel(principal: AuthenticatedUserPrincipal, requestId: String, request: CancelRequestRequest?): Mono<CancelRequestResponse> {
        return requestCommandService.cancel(
            requestId = requestId,
            requesterUserId = principal.userId,
            reason = request?.reason,
        )
            .flatMap { entity -> requestProjectionService.projectRequestCancelled(entity) }
            .map { entity ->
                CancelRequestResponse(
                    requestId = entity.requestId,
                    state = entity.state,
                    cancelledAt = entity.updatedAt.toInstant(ZoneOffset.UTC),
                )
            }
    }
}
