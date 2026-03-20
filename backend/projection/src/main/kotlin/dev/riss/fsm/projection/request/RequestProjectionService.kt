package dev.riss.fsm.projection.request

import dev.riss.fsm.command.request.RequestEntity
import dev.riss.fsm.query.request.RequesterRequestSummaryDocument
import dev.riss.fsm.query.request.RequesterRequestSummaryRepository
import dev.riss.fsm.query.request.SupplierRequestFeedDocument
import dev.riss.fsm.query.request.SupplierRequestFeedRepository
import dev.riss.fsm.query.user.RequesterBusinessProfileQueryService
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.ZoneOffset

@Service
class RequestProjectionService(
    private val requesterRequestSummaryRepository: RequesterRequestSummaryRepository,
    private val supplierRequestFeedRepository: SupplierRequestFeedRepository,
    private val requesterBusinessProfileQueryService: RequesterBusinessProfileQueryService,
) {

    fun projectRequestCreated(request: RequestEntity): Mono<RequestEntity> {
        val summary = RequesterRequestSummaryDocument(
            requestId = request.requestId,
            requesterUserId = request.requesterUserId,
            title = request.title,
            category = request.category,
            state = request.state,
            mode = request.mode,
            quoteCount = 0,
            createdAt = request.createdAt.toInstant(ZoneOffset.UTC),
            updatedAt = request.updatedAt.toInstant(ZoneOffset.UTC),
        )

        return requesterRequestSummaryRepository.save(summary)
            .thenReturn(request)
    }

    fun projectRequestPublished(request: RequestEntity): Mono<RequestEntity> {
        val updateSummary = requesterRequestSummaryRepository.findById(request.requestId)
            .flatMap { existing ->
                requesterRequestSummaryRepository.save(
                    existing.copy(
                        state = request.state,
                        updatedAt = request.updatedAt.toInstant(ZoneOffset.UTC),
                    )
                )
            }
            .thenReturn(request)

        val saveFeed = requesterBusinessProfileQueryService.findByUserId(request.requesterUserId)
            .map { profile ->
                SupplierRequestFeedDocument(
                    feedItemId = request.requestId,
                    requestId = request.requestId,
                    requesterBusinessName = profile.businessName,
                    title = request.title,
                    category = request.category,
                    desiredVolume = request.desiredVolume,
                    targetPriceMin = request.targetPriceMin,
                    targetPriceMax = request.targetPriceMax,
                    certificationRequirement = request.certificationRequirement?.split(",")?.filter { it.isNotBlank() },
                    mode = request.mode,
                    isTargeted = request.mode == "targeted",
                    hasQuoted = false,
                    createdAt = request.createdAt.toInstant(ZoneOffset.UTC),
                )
            }
            .flatMap { feedItem -> supplierRequestFeedRepository.save(feedItem) }

        return Mono.zip(updateSummary, saveFeed.thenReturn(request))
            .map { it.t1 }
    }

    fun projectRequestClosed(request: RequestEntity): Mono<RequestEntity> {
        val updateSummary = requesterRequestSummaryRepository.findById(request.requestId)
            .flatMap { existing ->
                requesterRequestSummaryRepository.save(
                    existing.copy(
                        state = request.state,
                        updatedAt = request.updatedAt.toInstant(ZoneOffset.UTC),
                    )
                )
            }

        val removeFeed = supplierRequestFeedRepository.findAllByModeAndRequestIdIn(
            request.mode,
            listOf(request.requestId)
        )
            .flatMap { supplierRequestFeedRepository.delete(it) }
            .then()

        return Mono.`when`(updateSummary, removeFeed).thenReturn(request)
    }

    fun projectRequestCancelled(request: RequestEntity): Mono<RequestEntity> {
        val updateSummary = requesterRequestSummaryRepository.findById(request.requestId)
            .flatMap { existing ->
                requesterRequestSummaryRepository.save(
                    existing.copy(
                        state = request.state,
                        updatedAt = request.updatedAt.toInstant(ZoneOffset.UTC),
                    )
                )
            }

        val removeFeed = supplierRequestFeedRepository.findAllByModeAndRequestIdIn(
            request.mode,
            listOf(request.requestId)
        )
            .flatMap { supplierRequestFeedRepository.delete(it) }
            .then()

        return Mono.`when`(updateSummary, removeFeed).thenReturn(request)
    }

    fun projectRequestUpdated(request: RequestEntity): Mono<RequestEntity> {
        val updateSummary = requesterRequestSummaryRepository.findById(request.requestId)
            .flatMap { existing ->
                requesterRequestSummaryRepository.save(
                    existing.copy(
                        title = request.title,
                        category = request.category,
                        state = request.state,
                        mode = request.mode,
                        updatedAt = request.updatedAt.toInstant(ZoneOffset.UTC),
                    )
                )
            }

        val updateFeed = supplierRequestFeedRepository.findById(request.requestId)
            .flatMap { existing ->
                supplierRequestFeedRepository.save(
                    existing.copy(
                        title = request.title,
                        category = request.category,
                        desiredVolume = request.desiredVolume,
                        targetPriceMin = request.targetPriceMin,
                        targetPriceMax = request.targetPriceMax,
                        certificationRequirement = request.certificationRequirement?.split(",")?.filter { it.isNotBlank() },
                        mode = request.mode,
                        isTargeted = request.mode == "targeted",
                    )
                )
            }
            .switchIfEmpty(Mono.empty<SupplierRequestFeedDocument>())

        return Mono.`when`(updateSummary, updateFeed).thenReturn(request)
    }
}
