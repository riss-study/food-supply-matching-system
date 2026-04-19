package dev.riss.fsm.api.review

import dev.riss.fsm.command.quote.QuoteRepository
import dev.riss.fsm.command.request.RequestRepository
import dev.riss.fsm.command.review.ReviewEntity
import dev.riss.fsm.command.review.ReviewRepository
import dev.riss.fsm.command.supplier.SupplierProfileRepository
import dev.riss.fsm.command.user.BusinessProfileRepository
import dev.riss.fsm.shared.api.PaginationMeta
import dev.riss.fsm.shared.error.ReviewNotFoundException
import dev.riss.fsm.shared.error.RequestNotFoundException
import dev.riss.fsm.shared.error.SupplierProfileNotFoundException
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate
import org.springframework.data.relational.core.query.Criteria
import org.springframework.data.relational.core.query.Query
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.ZoneOffset

data class ReviewPageResponse(
    val items: List<ReviewListItem>,
    val meta: PaginationMeta,
)

@Service
class ReviewQueryService(
    private val reviewRepository: ReviewRepository,
    private val requestRepository: RequestRepository,
    private val quoteRepository: QuoteRepository,
    private val supplierProfileRepository: SupplierProfileRepository,
    private val businessProfileRepository: BusinessProfileRepository,
    private val r2dbcEntityTemplate: R2dbcEntityTemplate,
) {
    fun checkEligibility(
        principal: AuthenticatedUserPrincipal,
        requestId: String,
        supplierId: String,
    ): Mono<EligibilityResponse> {
        return requestRepository.findById(requestId)
            .switchIfEmpty(Mono.error(RequestNotFoundException()))
            .flatMap { request ->
                if (request.state != "closed") {
                    return@flatMap Mono.just(EligibilityResponse(eligible = false, reason = "request_not_closed"))
                }
                if (request.requesterUserId != principal.userId) {
                    return@flatMap Mono.just(EligibilityResponse(eligible = false, reason = "not_request_owner"))
                }
                supplierProfileRepository.findById(supplierId)
                    .switchIfEmpty(Mono.error(SupplierProfileNotFoundException()))
                    .flatMap { _ ->
                        quoteRepository.existsByRequestIdAndSupplierProfileIdAndStateIn(
                            requestId,
                            supplierId,
                            listOf("selected")
                        ).flatMap { hasSelected ->
                            if (!hasSelected) {
                                return@flatMap Mono.just(EligibilityResponse(eligible = false, reason = "no_selected_quote"))
                            }
                            reviewRepository.existsByRequestIdAndSupplierProfileId(requestId, supplierId)
                                .map { alreadyReviewed ->
                                    if (alreadyReviewed) EligibilityResponse(eligible = false, reason = "already_reviewed")
                                    else EligibilityResponse(eligible = true, reason = null)
                                }
                        }
                    }
            }
    }

    fun listForSupplier(
        supplierId: String,
        page: Int,
        size: Int,
        order: String?,
    ): Mono<ReviewPageResponse> {
        val safePage = page.coerceAtLeast(1)
        val safeSize = size.coerceIn(1, 100)
        val direction = if (order == "asc") Sort.Direction.ASC else Sort.Direction.DESC

        return supplierProfileRepository.findById(supplierId)
            .switchIfEmpty(Mono.error(SupplierProfileNotFoundException()))
            .flatMap { _ ->
                val criteria = Criteria.where("supplier_profile_id").`is`(supplierId)
                    .and("hidden").`is`(false)
                val baseQuery = Query.query(criteria)
                val pageable = PageRequest.of(safePage - 1, safeSize, Sort.by(direction, "created_at"))

                r2dbcEntityTemplate.count(baseQuery, ReviewEntity::class.java)
                    .flatMap { total ->
                        r2dbcEntityTemplate.select(ReviewEntity::class.java)
                            .matching(baseQuery.with(pageable))
                            .all()
                            .collectList()
                            .flatMap { reviews ->
                                if (reviews.isEmpty()) {
                                    Mono.just(ReviewPageResponse(items = emptyList(), meta = pageMeta(safePage, safeSize, total)))
                                } else {
                                    resolveAuthors(reviews).map { items ->
                                        ReviewPageResponse(items = items, meta = pageMeta(safePage, safeSize, total))
                                    }
                                }
                            }
                    }
            }
    }

    private fun resolveAuthors(reviews: List<ReviewEntity>): Mono<List<ReviewListItem>> {
        val requesterIds = reviews.map { it.requesterUserId }.distinct()
        return reactor.core.publisher.Flux.fromIterable(requesterIds)
            .flatMap { userId ->
                businessProfileRepository.findByUserAccountId(userId)
                    .map { userId to maskCompanyName(it.businessName) }
                    .defaultIfEmpty(userId to ANONYMOUS_DISPLAY_NAME)
            }
            .collectMap({ it.first }, { it.second })
            .map { nameByUserId ->
                reviews.map { review ->
                    ReviewListItem(
                        reviewId = review.reviewId,
                        rating = review.rating,
                        text = review.text,
                        authorDisplayName = nameByUserId[review.requesterUserId] ?: ANONYMOUS_DISPLAY_NAME,
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

    companion object {
        private const val ANONYMOUS_DISPLAY_NAME = "익명"

        private val CORPORATE_PREFIXES = listOf(
            "주식회사 ",
            "유한회사 ",
            "합자회사 ",
            "재단법인 ",
            "사단법인 ",
            "(주)",
            "㈜",
            "(유)",
            "(합)",
            "(재)",
            "(사)",
        )

        fun maskCompanyName(name: String): String {
            if (name.isBlank()) return ANONYMOUS_DISPLAY_NAME
            val legalPrefix = CORPORATE_PREFIXES.firstOrNull { name.startsWith(it) } ?: ""
            val rest = name.removePrefix(legalPrefix)
            val visibleRest = rest.take(1)
            return "$legalPrefix$visibleRest*****"
        }
    }
}
