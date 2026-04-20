package dev.riss.fsm.admin.supplierreview

import java.time.Instant

data class SupplierReviewModerationResponse(
    val reviewId: String,
    val hidden: Boolean,
    val updatedAt: Instant,
)
