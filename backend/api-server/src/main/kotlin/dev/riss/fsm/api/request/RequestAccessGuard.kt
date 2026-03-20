package dev.riss.fsm.api.request

import dev.riss.fsm.command.request.RequestEntity
import dev.riss.fsm.command.request.RequestRepository
import dev.riss.fsm.command.request.TargetedSupplierLinkRepository
import dev.riss.fsm.command.supplier.SupplierProfileRepository
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import reactor.kotlin.core.publisher.switchIfEmpty

@Component
class RequestAccessGuard(
    private val requestRepository: RequestRepository,
    private val targetedSupplierLinkRepository: TargetedSupplierLinkRepository,
    private val supplierProfileRepository: SupplierProfileRepository,
) {

    fun checkRequestAccess(
        principal: AuthenticatedUserPrincipal,
        requestId: String,
    ): Mono<RequestEntity> {
        return requestRepository.findById(requestId)
            .switchIfEmpty { Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found")) }
            .flatMap { request ->
                when {
                    request.requesterUserId == principal.userId -> Mono.just(request)
                    request.mode == "public" && request.state == "open" -> checkSupplierApproved(principal).then(Mono.just(request))
                    request.mode == "targeted" -> checkTargetedSupplier(principal, requestId).then(Mono.just(request))
                    else -> Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to this request"))
                }
            }
    }

    fun checkCanSubmitQuote(
        principal: AuthenticatedUserPrincipal,
        requestId: String,
    ): Mono<RequestEntity> {
        return requestRepository.findById(requestId)
            .switchIfEmpty { Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found")) }
            .flatMap { request ->
                if (request.state != "open") {
                    return@flatMap Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Request is not open for quotes"))
                }

                when {
                    request.mode == "public" -> checkSupplierApproved(principal).then(Mono.just(request))
                    request.mode == "targeted" -> checkTargetedSupplier(principal, requestId).then(Mono.just(request))
                    else -> Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to this request"))
                }
            }
    }

    private fun checkSupplierApproved(principal: AuthenticatedUserPrincipal): Mono<Void> {
        return supplierProfileRepository.findBySupplierUserId(principal.userId)
            .switchIfEmpty { Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Supplier profile not found")) }
            .flatMap { profile ->
                if (profile.verificationState != "approved") {
                    Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Supplier must be approved to access requests"))
                } else {
                    Mono.empty()
                }
            }
    }

    private fun checkTargetedSupplier(
        principal: AuthenticatedUserPrincipal,
        requestId: String,
    ): Mono<Void> {
        return supplierProfileRepository.findBySupplierUserId(principal.userId)
            .switchIfEmpty { Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Supplier profile not found")) }
            .flatMap { profile ->
                if (profile.verificationState != "approved") {
                    return@flatMap Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Supplier must be approved"))
                }

                targetedSupplierLinkRepository.existsByRequestIdAndSupplierProfileId(
                    requestId,
                    profile.profileId
                )
                    .flatMap { exists ->
                        if (!exists) {
                            Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Supplier is not targeted for this request"))
                        } else {
                            Mono.empty()
                        }
                    }
            }
    }

    fun getSupplierProfileId(userId: String): Mono<String> {
        return supplierProfileRepository.findBySupplierUserId(userId)
            .map { it.profileId }
    }
}
