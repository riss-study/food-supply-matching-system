package dev.riss.fsm.api.request

import dev.riss.fsm.command.request.RequestEntity
import dev.riss.fsm.command.request.TargetedSupplierLinkRepository
import dev.riss.fsm.command.supplier.SupplierProfileRepository
import dev.riss.fsm.query.request.SupplierRequestFeedRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import reactor.kotlin.core.publisher.switchIfEmpty
import java.time.ZoneOffset

@Service
class SupplierRequestService(
    private val supplierRequestFeedRepository: SupplierRequestFeedRepository,
    private val targetedSupplierLinkRepository: TargetedSupplierLinkRepository,
    private val supplierProfileRepository: SupplierProfileRepository,
) {

    fun getFeed(
        supplierUserId: String,
        category: String?,
        page: Int,
        size: Int,
    ): Mono<SupplierRequestFeedPage> {
        val safePage = page.coerceAtLeast(1)
        val safeSize = size.coerceIn(1, 100)

        return supplierProfileRepository.findBySupplierUserId(supplierUserId)
            .switchIfEmpty { Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Supplier profile not found")) }
            .flatMap { profile ->
                targetedSupplierLinkRepository.findAllBySupplierProfileId(profile.profileId)
                    .map { it.requestId }
                    .collectList()
                    .flatMap { targetedRequestIds ->
                        supplierRequestFeedRepository.findAll()
                            .filter { doc ->
                                if (doc.mode == "targeted") {
                                    doc.requestId in targetedRequestIds
                                } else {
                                    true
                                }
                            }
                            .filter { doc -> category == null || doc.category == category }
                            .collectList()
                            .map { list ->
                                val sorted = list.sortedByDescending { it.createdAt }
                                val total = sorted.size
                                val from = ((safePage - 1) * safeSize).coerceAtMost(total)
                                val to = (from + safeSize).coerceAtMost(total)
                                val items = sorted.subList(from, to)
                                val totalPages = if (total == 0) 0 else ((total - 1) / safeSize) + 1

                                val responseItems = items.map { doc ->
                                    val min = doc.targetPriceMin
                                    val max = doc.targetPriceMax
                                    val targetPriceRange = if (min != null && max != null) {
                                        PriceRangeDto(min = min, max = max)
                                    } else {
                                        null
                                    }

                                    SupplierRequestFeedItem(
                                        requestId = doc.requestId,
                                        requesterBusinessName = doc.requesterBusinessName,
                                        title = doc.title,
                                        category = doc.category,
                                        desiredVolume = doc.desiredVolume,
                                        targetPriceRange = targetPriceRange,
                                        certificationRequirement = doc.certificationRequirement,
                                        mode = doc.mode,
                                        hasQuoted = doc.hasQuoted,
                                        createdAt = doc.createdAt,
                                    )
                                }

                                SupplierRequestFeedPage(
                                    items = responseItems,
                                    page = safePage,
                                    size = safeSize,
                                    totalElements = total,
                                    totalPages = totalPages,
                                    hasNext = safePage < totalPages,
                                    hasPrev = safePage > 1 && totalPages > 0,
                                )
                            }
                    }
            }
    }

    fun getDetail(
        supplierUserId: String,
        request: RequestEntity,
    ): Mono<SupplierRequestDetail> {
        return supplierProfileRepository.findBySupplierUserId(supplierUserId)
            .flatMap { profile ->
                supplierRequestFeedRepository.findAllByModeAndRequestIdIn(request.mode, listOf(request.requestId))
                    .filter { it.isTargeted == (request.mode == "targeted") }
                    .next()
                    .map { feedItem ->
                        val min = request.targetPriceMin
                        val max = request.targetPriceMax
                        val targetPriceRange = if (min != null && max != null) {
                            PriceRangeDto(min = min, max = max)
                        } else {
                            null
                        }

                        SupplierRequestDetail(
                            requestId = request.requestId,
                            mode = request.mode,
                            title = request.title,
                            category = request.category,
                            desiredVolume = request.desiredVolume,
                            targetPriceRange = targetPriceRange,
                            certificationRequirement = request.certificationRequirement?.split(",")?.filter { it.isNotBlank() },
                            rawMaterialRule = request.rawMaterialRule,
                            packagingRequirement = request.packagingRequirement,
                            deliveryRequirement = request.deliveryRequirement,
                            notes = request.notes,
                            state = request.state,
                            requesterBusinessName = feedItem.requesterBusinessName,
                            hasQuoted = feedItem.hasQuoted,
                            createdAt = request.createdAt.toInstant(ZoneOffset.UTC),
                        )
                    }
            }
    }
}
