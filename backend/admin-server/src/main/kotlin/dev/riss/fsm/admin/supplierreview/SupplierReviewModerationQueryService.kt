package dev.riss.fsm.admin.supplierreview

import dev.riss.fsm.command.review.ReviewEntity
import dev.riss.fsm.command.supplier.SupplierProfileRepository
import dev.riss.fsm.command.user.BusinessProfileRepository
import dev.riss.fsm.shared.api.PaginationMeta
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate
import org.springframework.data.relational.core.query.Criteria
import org.springframework.data.relational.core.query.Query
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.time.ZoneOffset

data class AdminSupplierReviewPage(
    val items: List<AdminSupplierReviewListItem>,
    val meta: PaginationMeta,
)

@Service
class SupplierReviewModerationQueryService(
    private val r2dbcEntityTemplate: R2dbcEntityTemplate,
    private val supplierProfileRepository: SupplierProfileRepository,
    private val businessProfileRepository: BusinessProfileRepository,
) {
    fun list(
        hidden: String?,
        supplierId: String?,
        page: Int,
        size: Int,
        order: String?,
    ): Mono<AdminSupplierReviewPage> {
        val safePage = page.coerceAtLeast(1)
        val safeSize = size.coerceIn(1, 100)
        val direction = if (order == "asc") Sort.Direction.ASC else Sort.Direction.DESC

        val baseQuery = buildCriteriaQuery(hidden, supplierId)
        val pageable = PageRequest.of(safePage - 1, safeSize, Sort.by(direction, "created_at"))

        return r2dbcEntityTemplate.count(baseQuery, ReviewEntity::class.java)
            .flatMap { total ->
                r2dbcEntityTemplate.select(ReviewEntity::class.java)
                    .matching(baseQuery.with(pageable))
                    .all()
                    .collectList()
                    .flatMap { reviews ->
                        if (reviews.isEmpty()) {
                            Mono.just(AdminSupplierReviewPage(emptyList(), pageMeta(safePage, safeSize, total)))
                        } else {
                            resolveCompanyNames(reviews).map { items ->
                                AdminSupplierReviewPage(items, pageMeta(safePage, safeSize, total))
                            }
                        }
                    }
            }
    }

    private fun buildCriteriaQuery(hidden: String?, supplierId: String?): Query {
        val hasSupplier = !supplierId.isNullOrBlank()
        val hiddenFlag: Boolean? = when (hidden) {
            "true" -> true
            "false" -> false
            else -> null
        }
        val criteria: Criteria? = when {
            hiddenFlag != null && hasSupplier ->
                Criteria.where("hidden").`is`(hiddenFlag).and("supplier_profile_id").`is`(supplierId!!)
            hiddenFlag != null ->
                Criteria.where("hidden").`is`(hiddenFlag)
            hasSupplier ->
                Criteria.where("supplier_profile_id").`is`(supplierId!!)
            else -> null
        }
        return if (criteria == null) Query.empty() else Query.query(criteria)
    }

    private fun resolveCompanyNames(reviews: List<ReviewEntity>): Mono<List<AdminSupplierReviewListItem>> {
        val requesterIds = reviews.map { it.requesterUserId }.distinct()
        val supplierIds = reviews.map { it.supplierProfileId }.distinct()

        val requesterNamesMono: Mono<Map<String, String?>> = Flux.fromIterable(requesterIds)
            .flatMap { id ->
                businessProfileRepository.findByUserAccountId(id)
                    .map<Pair<String, String?>> { entity -> id to entity.businessName }
                    .defaultIfEmpty(id to null)
            }
            .collectList()
            .map { pairs -> pairs.toMap() }

        val supplierNamesMono: Mono<Map<String, String>> = Flux.fromIterable(supplierIds)
            .flatMap { id ->
                supplierProfileRepository.findById(id)
                    .map<Pair<String, String>> { entity -> id to entity.companyName }
                    .defaultIfEmpty(id to "")
            }
            .collectList()
            .map { pairs -> pairs.toMap() }

        return Mono.zip(requesterNamesMono, supplierNamesMono)
            .map { tuple ->
                val requesterNames: Map<String, String?> = tuple.t1
                val supplierNames: Map<String, String> = tuple.t2
                reviews.map { review ->
                    AdminSupplierReviewListItem(
                        reviewId = review.reviewId,
                        rating = review.rating,
                        text = review.text,
                        hidden = review.hidden,
                        requesterUserId = review.requesterUserId,
                        requesterCompanyName = requesterNames[review.requesterUserId],
                        supplierProfileId = review.supplierProfileId,
                        supplierCompanyName = supplierNames[review.supplierProfileId] ?: "",
                        requestId = review.requestId,
                        quoteId = review.quoteId,
                        createdAt = review.createdAt.toInstant(ZoneOffset.UTC),
                        updatedAt = review.updatedAt.toInstant(ZoneOffset.UTC),
                    )
                }
            }
    }

    private fun pageMeta(page: Int, size: Int, total: Long): PaginationMeta {
        val totalPages = if (total == 0L) 0 else ((total - 1) / size).toInt() + 1
        return PaginationMeta(
            page = page,
            size = size,
            totalElements = total,
            totalPages = totalPages,
            hasNext = page < totalPages,
            hasPrev = page > 1 && totalPages > 0,
        )
    }
}
