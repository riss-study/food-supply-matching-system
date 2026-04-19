package dev.riss.fsm.query.supplier

import org.springframework.stereotype.Service
import reactor.core.publisher.Mono

data class SupplierSearchQuery(
    val keyword: String? = null,
    val category: String? = null,
    val region: String? = null,
    val oem: Boolean? = null,
    val odm: Boolean? = null,
    val minCapacity: Int? = null,
    val maxMoq: Int? = null,
    val page: Int = 1,
    val size: Int = 20,
    val sort: String? = null,
    val order: String? = null,
)

data class SupplierSearchPage(
    val items: List<SupplierSearchViewDocument>,
    val page: Int,
    val size: Int,
    val totalElements: Int,
    val totalPages: Int,
    val hasNext: Boolean,
    val hasPrev: Boolean,
)

data class SupplierCategorySummary(
    val category: String,
    val supplierCount: Int,
)

data class SupplierRegionSummary(
    val region: String,
    val supplierCount: Int,
)

@Service
class SupplierQueryService(
    private val supplierSearchViewRepository: SupplierSearchViewRepository,
    private val supplierDetailViewRepository: SupplierDetailViewRepository,
) {
    fun listApproved(query: SupplierSearchQuery): Mono<SupplierSearchPage> {
        val safePage = query.page.coerceAtLeast(1)
        val safeSize = query.size.coerceIn(1, 100)

        return supplierSearchViewRepository.findAll()
            .collectList()
            .map { list ->
                list.asSequence()
                    .filter { item -> query.keyword.isNullOrBlank() || item.companyName.contains(query.keyword, ignoreCase = true) }
                    .filter { item -> query.category.isNullOrBlank() || item.categories.any { it.equals(query.category, ignoreCase = true) } }
                    .filter { item -> query.region.isNullOrBlank() || item.region.contains(query.region, ignoreCase = true) }
                    .filter { item -> query.oem == null || item.oemAvailable == query.oem }
                    .filter { item -> query.odm == null || item.odmAvailable == query.odm }
                    // 수량/단위가 자유 텍스트가 되면서 숫자 비교 불가 — 필터 비활성화
                    .filter { item ->
                        val min = query.minCapacity ?: return@filter true
                        val n = item.monthlyCapacity.filter { it.isDigit() }.toIntOrNull() ?: 0
                        n >= min
                    }
                    .filter { item ->
                        val max = query.maxMoq ?: return@filter true
                        val n = item.moq.filter { it.isDigit() }.toIntOrNull() ?: Int.MAX_VALUE
                        n <= max
                    }
                    .toList()
            }
            .map { items -> sortItems(items, query.sort, query.order) }
            .map { filtered ->
                val total = filtered.size
                val from = ((safePage - 1) * safeSize).coerceAtMost(total)
                val to = (from + safeSize).coerceAtMost(total)
                val items = filtered.subList(from, to)
                val totalPages = if (total == 0) 0 else ((total - 1) / safeSize) + 1
                SupplierSearchPage(
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

    fun detail(profileId: String): Mono<SupplierDetailViewDocument> = supplierDetailViewRepository.findById(profileId)

    private fun sortItems(items: List<SupplierSearchViewDocument>, sort: String?, order: String?): List<SupplierSearchViewDocument> {
        val sorted = when (sort) {
            "monthlyCapacity" -> items.sortedBy { it.monthlyCapacity }
            "moq" -> items.sortedBy { it.moq }
            "companyName" -> items.sortedBy { it.companyName.lowercase() }
            else -> items.sortedBy { it.updatedAt }
        }
        return if (order == "asc") sorted else sorted.reversed()
    }

    fun categories(): Mono<List<SupplierCategorySummary>> =
        supplierSearchViewRepository.aggregateCategoryCounts()
            .map { SupplierCategorySummary(category = it.category, supplierCount = it.supplierCount) }
            .collectList()

    fun regions(): Mono<List<SupplierRegionSummary>> =
        supplierSearchViewRepository.aggregateRegionCounts()
            .map { SupplierRegionSummary(region = it.region, supplierCount = it.supplierCount) }
            .collectList()
}
