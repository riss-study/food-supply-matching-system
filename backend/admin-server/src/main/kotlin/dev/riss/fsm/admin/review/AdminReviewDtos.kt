package dev.riss.fsm.admin.review

import dev.riss.fsm.query.admin.review.AdminReviewFileItem
import jakarta.validation.constraints.NotBlank
import java.time.Instant

data class ReviewDecisionRequest(
    val noteInternal: String? = null,
    val notePublic: String? = null,
    val reasonCode: String? = null,
)

data class AdminReviewQueueItemResponse(
    val reviewId: String,
    val supplierProfileId: String,
    val companyName: String,
    val state: String,
    val submittedAt: Instant,
    val pendingDays: Long,
    val verificationState: String,
)

data class AdminReviewDetailResponse(
    val reviewId: String,
    val supplierProfileId: String,
    val companyName: String,
    val representativeName: String,
    val region: String,
    val categories: List<String>,
    val state: String,
    val submittedAt: Instant,
    val reviewedAt: Instant?,
    val reviewNoteInternal: String?,
    val reviewNotePublic: String?,
    val files: List<AdminReviewFileItem>,
)

data class ReviewDecisionResponse(
    val reviewId: String,
    val state: String,
    val supplierVerificationState: String,
    val exposureState: String,
    val reviewedAt: Instant,
)
