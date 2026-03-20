package dev.riss.fsm.api.request

import dev.riss.fsm.command.request.RequestRepository
import dev.riss.fsm.command.request.TargetedSupplierLinkRepository
import dev.riss.fsm.command.supplier.SupplierProfileRepository
import dev.riss.fsm.query.user.RequesterBusinessProfileQueryService
import dev.riss.fsm.shared.api.PaginationMeta
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.time.ZoneOffset

data class RequestListPageResponse(
    val items: List<RequestListItemResponse>,
    val meta: PaginationMeta,
)

@Service
class RequestQueryService(
    private val requestRepository: RequestRepository,
    private val targetedSupplierLinkRepository: TargetedSupplierLinkRepository,
    private val requesterBusinessProfileQueryService: RequesterBusinessProfileQueryService,
    private val supplierProfileRepository: SupplierProfileRepository,
    private val requestAccessGuard: RequestAccessGuard,
) {
    fun listByRequester(
        requesterUserId: String,
        state: String?,
        page: Int,
        size: Int,
    ): Mono<RequestListPageResponse> {
        val safePage = page.coerceAtLeast(1)
        val safeSize = size.coerceIn(1, 100)

        return requestRepository.findAllByRequesterUserId(requesterUserId)
            .filter { entity -> state == null || entity.state == state }
            .collectList()
            .map { items ->
                val sorted = items.sortedByDescending { it.createdAt }
                val total = sorted.size
                val totalPages = if (total == 0) 0 else ((total - 1) / safeSize) + 1
                val from = ((safePage - 1) * safeSize).coerceAtMost(total)
                val to = (from + safeSize).coerceAtMost(total)
                val pageItems = sorted.subList(from, to).map { entity ->
                    RequestListItemResponse(
                        requestId = entity.requestId,
                        title = entity.title,
                        category = entity.category,
                        state = entity.state,
                        mode = entity.mode,
                        quoteCount = 0,
                        createdAt = entity.createdAt.toInstant(ZoneOffset.UTC),
                        expiresAt = null,
                    )
                }

                RequestListPageResponse(
                    items = pageItems,
                    meta = PaginationMeta(
                        page = safePage,
                        size = safeSize,
                        totalElements = total.toLong(),
                        totalPages = totalPages,
                        hasNext = safePage < totalPages,
                        hasPrev = safePage > 1 && totalPages > 0,
                    ),
                )
            }
    }

    fun getDetail(
        principal: AuthenticatedUserPrincipal,
        requestId: String,
    ): Mono<RequestDetailResponse> {
        return requestAccessGuard.checkRequestAccess(principal, requestId)
            .flatMap { entity ->
                val requesterMono = requesterBusinessProfileQueryService.findByUserId(entity.requesterUserId)
                    .map { profile ->
                        RequestDetailRequester(
                            businessName = profile.businessName,
                            contactName = profile.contactName,
                        )
                    }

                val targetSuppliersMono = if (entity.mode == "targeted") {
                    targetedSupplierLinkRepository.findAllByRequestId(entity.requestId)
                        .flatMap { link ->
                            supplierProfileRepository.findById(link.supplierProfileId)
                                .map { supplier ->
                                    RequestDetailTargetSupplier(
                                        supplierProfileId = supplier.profileId,
                                        companyName = supplier.companyName,
                                    )
                                }
                        }
                        .collectList()
                } else {
                    Mono.just(emptyList())
                }

                Mono.zip(requesterMono, targetSuppliersMono)
                    .map { tuple ->
                        RequestDetailResponse(
                            requestId = entity.requestId,
                            mode = entity.mode,
                            title = entity.title,
                            category = entity.category,
                            desiredVolume = entity.desiredVolume,
                            targetPriceRange = if (entity.targetPriceMin != null || entity.targetPriceMax != null) {
                                CreateRequestPriceRange(
                                    min = entity.targetPriceMin,
                                    max = entity.targetPriceMax,
                                )
                            } else {
                                null
                            },
                            certificationRequirement = entity.certificationRequirement?.split(",")?.filter { it.isNotBlank() },
                            rawMaterialRule = entity.rawMaterialRule,
                            packagingRequirement = entity.packagingRequirement,
                            deliveryRequirement = entity.deliveryRequirement,
                            notes = entity.notes,
                            state = entity.state,
                            requester = tuple.t1,
                            targetSuppliers = tuple.t2.ifEmpty { null },
                            createdAt = entity.createdAt.toInstant(ZoneOffset.UTC),
                        )
                    }
            }
    }

    fun getTargetedSupplierIds(requestId: String): Flux<String> {
        return targetedSupplierLinkRepository.findAllByRequestId(requestId).map { it.supplierProfileId }
    }
}
