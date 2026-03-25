package dev.riss.fsm.admin.stats

import com.fasterxml.jackson.annotation.JsonProperty
import java.time.LocalDate

data class UsersStats(
    val total: Long,
    val requesters: Long,
    val suppliers: Long,
    val admins: Long,
)

data class SupplierStateStats(
    val approved: Long,
    val submitted: Long,
    @JsonProperty("under_review")
    val underReview: Long,
    val hold: Long,
    val rejected: Long,
    val suspended: Long,
    val draft: Long,
)

data class ReviewStats(
    val pending: Long,
    val avgReviewDays: Double,
    val totalReviewed: Long,
)

data class RequestStats(
    val total: Long,
    val open: Long,
    val closed: Long,
    val cancelled: Long,
    val draft: Long,
)

data class StatsPeriod(
    val from: LocalDate?,
    val to: LocalDate?,
)

data class AdminStatsSummaryResponse(
    val users: UsersStats,
    val suppliersByState: SupplierStateStats,
    val reviews: ReviewStats,
    val requests: RequestStats,
    val period: StatsPeriod,
)
