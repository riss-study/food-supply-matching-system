package dev.riss.fsm.projection.review

import dev.riss.fsm.command.review.ReviewRepository
import dev.riss.fsm.query.supplier.SupplierDetailViewRepository
import dev.riss.fsm.query.supplier.SupplierSearchViewRepository
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono

@Service
class ReviewProjectionService(
    private val reviewRepository: ReviewRepository,
    private val supplierSearchViewRepository: SupplierSearchViewRepository,
    private val supplierDetailViewRepository: SupplierDetailViewRepository,
) {
    fun recomputeFor(supplierProfileId: String): Mono<Void> {
        return reviewRepository.findAllBySupplierProfileIdAndHiddenFalse(supplierProfileId)
            .collectList()
            .flatMap { visibleReviews ->
                val count = visibleReviews.size
                val avg = if (count == 0) 0.0
                else visibleReviews.sumOf { it.rating }.toDouble() / count
                applyRating(supplierProfileId, avg, count)
            }
    }

    fun backfillAll(): Mono<Void> {
        return supplierDetailViewRepository.findAll()
            .flatMap { doc -> recomputeFor(doc.profileId) }
            .then()
    }

    private fun applyRating(supplierProfileId: String, avg: Double, count: Int): Mono<Void> {
        val roundedAvg = kotlin.math.round(avg * 100.0) / 100.0

        val detailUpdate = supplierDetailViewRepository.findById(supplierProfileId)
            .flatMap { doc ->
                supplierDetailViewRepository.save(doc.copy(ratingAvg = roundedAvg, ratingCount = count))
            }
            .then()

        val searchUpdate = supplierSearchViewRepository.findById(supplierProfileId)
            .flatMap { doc ->
                supplierSearchViewRepository.save(doc.copy(ratingAvg = roundedAvg, ratingCount = count))
            }
            .then()

        return detailUpdate.then(searchUpdate)
    }
}
