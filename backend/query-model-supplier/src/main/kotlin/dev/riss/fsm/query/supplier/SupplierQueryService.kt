package dev.riss.fsm.query.supplier

import org.springframework.data.domain.Sort
import org.springframework.data.mongodb.core.ReactiveMongoTemplate
import org.springframework.data.mongodb.core.query.Criteria
import org.springframework.data.mongodb.core.query.Query
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

// Dormant Mongo-backed implementation retained until Stage 8 physically removes the module.
// No longer a Spring bean; replaced by dev.riss.fsm.api.supplier.SupplierQueryService (R2DBC).
class SupplierQueryService(
    private val supplierSearchViewRepository: SupplierSearchViewRepository,
    private val supplierDetailViewRepository: SupplierDetailViewRepository,
    private val mongoTemplate: ReactiveMongoTemplate,
) {
    fun listApproved(query: SupplierSearchQuery): Mono<SupplierSearchPage> {
        val safePage = query.page.coerceAtLeast(1)
        val safeSize = query.size.coerceIn(1, 100)

        val criteriaList = buildList {
            query.keyword?.takeIf { it.isNotBlank() }?.let {
                add(Criteria.where("companyName").regex(java.util.regex.Pattern.quote(it), "i"))
            }
            query.category?.takeIf { it.isNotBlank() }?.let {
                add(Criteria.where("categories").regex("^${java.util.regex.Pattern.quote(it)}$", "i"))
            }
            query.region?.takeIf { it.isNotBlank() }?.let {
                add(Criteria.where("region").regex(java.util.regex.Pattern.quote(it), "i"))
            }
            query.oem?.let { add(Criteria.where("oemAvailable").`is`(it)) }
            query.odm?.let { add(Criteria.where("odmAvailable").`is`(it)) }
        }

        val baseCriteria = if (criteriaList.isEmpty()) Criteria() else Criteria().andOperator(*criteriaList.toTypedArray())
        val sortOrder = buildSort(query.sort, query.order)

        val countQuery = Query(baseCriteria)
        val pagedQuery = Query(baseCriteria).with(sortOrder).skip(((safePage - 1) * safeSize).toLong()).limit(safeSize)

        return mongoTemplate.count(countQuery, SupplierSearchViewDocument::class.java)
            .zipWith(mongoTemplate.find(pagedQuery, SupplierSearchViewDocument::class.java).collectList())
            .map { tuple ->
                val total = tuple.t1
                val pagedItems = tuple.t2
                // 수량/단위가 자유 텍스트 (예: "1,000kg") 인 한계로 minCapacity / maxMoq 는 페이지 내 post-filter 로 적용.
                // 실제 정규화된 숫자 컬럼은 BE-future 에 기록됨 (open-items.md BE-5 후보).
                val postFiltered = pagedItems.filter { item: SupplierSearchViewDocument ->
                    val capOk = query.minCapacity?.let { min ->
                        (item.monthlyCapacity.filter { it.isDigit() }.toIntOrNull() ?: 0) >= min
                    } ?: true
                    val moqOk = query.maxMoq?.let { max ->
                        (item.moq.filter { it.isDigit() }.toIntOrNull() ?: Int.MAX_VALUE) <= max
                    } ?: true
                    capOk && moqOk
                }
                val totalInt = total.toInt()
                val totalPages = if (totalInt == 0) 0 else ((totalInt - 1) / safeSize) + 1
                SupplierSearchPage(
                    items = postFiltered,
                    page = safePage,
                    size = safeSize,
                    totalElements = totalInt,
                    totalPages = totalPages,
                    hasNext = safePage < totalPages,
                    hasPrev = safePage > 1 && totalPages > 0,
                )
            }
    }

    fun detail(profileId: String): Mono<SupplierDetailViewDocument> = supplierDetailViewRepository.findById(profileId)

    private fun buildSort(sort: String?, order: String?): Sort {
        val direction = if (order == "asc") Sort.Direction.ASC else Sort.Direction.DESC
        val field = when (sort) {
            "companyName" -> "companyName"
            "monthlyCapacity" -> "monthlyCapacity"
            "moq" -> "moq"
            "updatedAt" -> "updatedAt"
            null, "" -> "updatedAt"
            else -> "updatedAt"
        }
        return Sort.by(direction, field)
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
