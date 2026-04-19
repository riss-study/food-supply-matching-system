package dev.riss.fsm.command.request

import dev.riss.fsm.shared.error.RequestAccessForbiddenException
import dev.riss.fsm.shared.error.RequestNotFoundException
import dev.riss.fsm.shared.error.RequestStateTransitionException
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.LocalDateTime
import java.util.UUID

@Service
class RequestCommandService(
    private val requestRepository: RequestRepository,
    private val targetedSupplierLinkRepository: TargetedSupplierLinkRepository,
) {
    fun create(command: CreateRequestCommand): Mono<RequestEntity> {
        val entity = RequestEntity(
            requestId = "req_${UUID.randomUUID()}",
            requesterUserId = command.requesterUserId,
            mode = command.mode,
            title = command.title,
            category = command.category,
            desiredVolume = command.desiredVolume,
            targetPriceMin = command.targetPriceMin,
            targetPriceMax = command.targetPriceMax,
            certificationRequirement = command.certificationRequirement?.joinToString(","),
            rawMaterialRule = command.rawMaterialRule,
            packagingRequirement = command.packagingRequirement,
            deliveryRequirement = command.deliveryRequirement,
            notes = command.notes,
            state = "draft",
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now(),
        ).apply { newEntity = true }

        return requestRepository.save(entity)
            .flatMap { savedRequest ->
                if (command.mode == "targeted" && command.targetSupplierIds != null) {
                    val links = command.targetSupplierIds.map { supplierId ->
                        TargetedSupplierLinkEntity(
                            linkId = "tsl_${UUID.randomUUID()}",
                            requestId = savedRequest.requestId,
                            supplierProfileId = supplierId,
                            createdAt = LocalDateTime.now(),
                        ).apply { newEntity = true }
                    }
                    targetedSupplierLinkRepository.saveAll(links).collectList()
                        .thenReturn(savedRequest)
                } else {
                    Mono.just(savedRequest)
                }
            }
    }

    fun update(requestId: String, requesterUserId: String, command: UpdateRequestCommand): Mono<RequestEntity> {
        return requestRepository.findById(requestId)
            .switchIfEmpty(Mono.error(RequestNotFoundException()))
            .flatMap { request ->
                if (request.requesterUserId != requesterUserId) {
                    return@flatMap Mono.error(RequestAccessForbiddenException())
                }
                if (request.state !in setOf("draft", "open")) {
                    return@flatMap Mono.error(RequestStateTransitionException("Request can only be updated in draft or open state"))
                }

                val updatedEntity = request.copy(
                    title = command.title ?: request.title,
                    desiredVolume = command.desiredVolume ?: request.desiredVolume,
                    targetPriceMin = command.targetPriceMin ?: request.targetPriceMin,
                    targetPriceMax = command.targetPriceMax ?: request.targetPriceMax,
                    certificationRequirement = command.certificationRequirement?.joinToString(",") ?: request.certificationRequirement,
                    rawMaterialRule = command.rawMaterialRule ?: request.rawMaterialRule,
                    packagingRequirement = command.packagingRequirement ?: request.packagingRequirement,
                    deliveryRequirement = command.deliveryRequirement ?: request.deliveryRequirement,
                    notes = command.notes ?: request.notes,
                    updatedAt = LocalDateTime.now(),
                )
                requestRepository.save(updatedEntity)
            }
    }

    fun publish(requestId: String, requesterUserId: String): Mono<RequestEntity> {
        return requestRepository.findById(requestId)
            .switchIfEmpty(Mono.error(RequestNotFoundException()))
            .flatMap { request ->
                if (request.requesterUserId != requesterUserId) {
                    return@flatMap Mono.error(RequestAccessForbiddenException())
                }
                if (request.state != "draft") {
                    return@flatMap Mono.error(RequestStateTransitionException("Only draft requests can be published"))
                }

                val publishedEntity = request.copy(
                    state = "open",
                    updatedAt = LocalDateTime.now(),
                )
                requestRepository.save(publishedEntity)
            }
    }

    fun close(requestId: String, requesterUserId: String): Mono<RequestEntity> {
        return requestRepository.findById(requestId)
            .switchIfEmpty(Mono.error(RequestNotFoundException()))
            .flatMap { request ->
                if (request.requesterUserId != requesterUserId) {
                    return@flatMap Mono.error(RequestAccessForbiddenException())
                }
                if (request.state != "open") {
                    return@flatMap Mono.error(RequestStateTransitionException("Only open requests can be closed"))
                }

                val closedEntity = request.copy(
                    state = "closed",
                    updatedAt = LocalDateTime.now(),
                )
                requestRepository.save(closedEntity)
            }
    }

    fun cancel(requestId: String, requesterUserId: String, reason: String?): Mono<RequestEntity> {
        return requestRepository.findById(requestId)
            .switchIfEmpty(Mono.error(RequestNotFoundException()))
            .flatMap { request ->
                if (request.requesterUserId != requesterUserId) {
                    return@flatMap Mono.error(RequestAccessForbiddenException())
                }
                if (request.state !in setOf("draft", "open")) {
                    return@flatMap Mono.error(RequestStateTransitionException("Only draft or open requests can be cancelled"))
                }

                val cancelledEntity = request.copy(
                    state = "cancelled",
                    updatedAt = LocalDateTime.now(),
                )
                requestRepository.save(cancelledEntity)
            }
    }

    fun getTargetedSuppliers(requestId: String): reactor.core.publisher.Flux<TargetedSupplierLinkEntity> {
        return targetedSupplierLinkRepository.findAllByRequestId(requestId)
    }
}

data class CreateRequestCommand(
    val requesterUserId: String,
    val mode: String,
    val title: String,
    val category: String,
    val desiredVolume: String,
    val targetPriceMin: String?,
    val targetPriceMax: String?,
    val certificationRequirement: List<String>?,
    val rawMaterialRule: String?,
    val packagingRequirement: String?,
    val deliveryRequirement: String?,
    val notes: String?,
    val targetSupplierIds: List<String>? = null,
)

data class UpdateRequestCommand(
    val title: String? = null,
    val desiredVolume: String? = null,
    val targetPriceMin: String? = null,
    val targetPriceMax: String? = null,
    val certificationRequirement: List<String>? = null,
    val rawMaterialRule: String? = null,
    val packagingRequirement: String? = null,
    val deliveryRequirement: String? = null,
    val notes: String? = null,
)
