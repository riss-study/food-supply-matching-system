package dev.riss.fsm.query.admin.review

import org.springframework.stereotype.Service
import reactor.core.publisher.Mono

data class AdminReviewQuery(
    val state: String? = null,
    val page: Int = 1,
    val size: Int = 20,
)

data class AdminReviewQueuePage(
    val items: List<AdminReviewQueueItemDocument>,
    val page: Int,
    val size: Int,
    val totalElements: Int,
    val totalPages: Int,
    val hasNext: Boolean,
    val hasPrev: Boolean,
)

@Service
class AdminReviewQueryService(
    private val queueRepository: AdminReviewQueueViewRepository,
    private val detailRepository: AdminReviewDetailViewRepository,
) {
    fun queue(query: AdminReviewQuery): Mono<AdminReviewQueuePage> {
        val safePage = query.page.coerceAtLeast(1)
        val safeSize = query.size.coerceIn(1, 100)
        return queueRepository.findAll()
            .collectList()
            .map { list ->
                list.asSequence()
                    .filter { item -> query.state.isNullOrBlank() || item.state == query.state }
                    .sortedByDescending { it.submittedAt }
                    .toList()
            }
            .map { filtered ->
                val total = filtered.size
                val from = ((safePage - 1) * safeSize).coerceAtMost(total)
                val to = (from + safeSize).coerceAtMost(total)
                val items = filtered.subList(from, to)
                val totalPages = if (total == 0) 0 else ((total - 1) / safeSize) + 1
                AdminReviewQueuePage(
                    items = items,
                    page = safePage,
                    size = safeSize,
                    totalElements = total,
                    totalPages = totalPages,
                    hasNext = safePage < totalPages,
                    hasPrev = safePage > 1 && totalPages > 0,
                )
            }
    }

    fun detail(reviewId: String): Mono<AdminReviewDetailDocument> = detailRepository.findById(reviewId)
}
