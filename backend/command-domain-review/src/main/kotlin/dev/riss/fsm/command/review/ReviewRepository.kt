package dev.riss.fsm.command.review

import org.springframework.data.r2dbc.repository.Query
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.repository.reactive.ReactiveCrudRepository
import reactor.core.publisher.Mono

interface ReviewRepository : ReactiveCrudRepository<ReviewEntity, String> {
    fun existsByRequestIdAndSupplierProfileId(requestId: String, supplierProfileId: String): Mono<Boolean>

    @Query(
        """
        SELECT
          COUNT(*) AS review_count,
          COALESCE(CAST(AVG(rating) AS DOUBLE), 0.0) AS avg_rating
        FROM review
        WHERE supplier_profile_id = :supplierProfileId
          AND hidden = FALSE
        """,
    )
    fun aggregateRatingBySupplier(supplierProfileId: String): Mono<RatingAggregate>
}

data class RatingAggregate(
    @Column("review_count")
    val reviewCount: Long,
    @Column("avg_rating")
    val avgRating: Double,
)
