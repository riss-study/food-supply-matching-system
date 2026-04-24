package dev.riss.fsm.query.admin.review

import reactor.core.publisher.Mono
import java.time.LocalDate
import java.util.Comparator

data class AdminReviewQuery(
    val state: String? = null,
    val fromDate: LocalDate? = null,
    val toDate: LocalDate? = null,
    val page: Int = 1,
    val size: Int = 20,
    val sort: String? = null,
    val order: String? = null,
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

// Dormant Mongo-backed query service. Superseded by admin-server direct R2DBC read path
// (Phase 3 Task A, Stage 6). Class retained until Stage 8 removes the query-model-admin-review module.
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
                val filtered = list.asSequence()
                    .filter { item -> query.state.isNullOrBlank() || item.state == query.state }
                    .filter { item -> query.fromDate == null || !item.submittedAt.atZone(java.time.ZoneOffset.UTC).toLocalDate().isBefore(query.fromDate) }
                    .filter { item -> query.toDate == null || !item.submittedAt.atZone(java.time.ZoneOffset.UTC).toLocalDate().isAfter(query.toDate) }
                    .toList()

                sortQueueItems(filtered, query.sort, query.order)
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

    private fun sortQueueItems(
        items: List<AdminReviewQueueItemDocument>,
        sort: String?,
        order: String?,
    ): List<AdminReviewQueueItemDocument> {
        val comparator = when (sort) {
            "pendingDays" -> compareBy<AdminReviewQueueItemDocument> { it.pendingDays }
            "state" -> compareBy { it.state }
            "companyName" -> compareBy { it.companyName }
            else -> compareBy { it.submittedAt }
        }

        val sorted = items.sortedWith(comparator)
        return if (order == "asc") sorted else sorted.reversed()
    }
}
