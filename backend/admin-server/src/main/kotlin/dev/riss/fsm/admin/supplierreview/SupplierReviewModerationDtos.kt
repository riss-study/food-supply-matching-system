package dev.riss.fsm.admin.supplierreview

import java.time.Instant

data class SupplierReviewModerationResponse(
    val reviewId: String,
    val hidden: Boolean,
    val updatedAt: Instant,
)

data class AdminSupplierReviewListItem(
    val reviewId: String,
    val rating: Int,
    val text: String?,
    val hidden: Boolean,
    val requesterUserId: String,
    val requesterCompanyName: String?,
    val supplierProfileId: String,
    val supplierCompanyName: String,
    val requestId: String,
    val quoteId: String,
    val createdAt: Instant,
    val updatedAt: Instant,
)
