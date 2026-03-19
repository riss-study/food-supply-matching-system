package dev.riss.fsm.query.admin.review

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("admin_review_detail_view")
data class AdminReviewDetailDocument(
    @Id
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

data class AdminReviewFileItem(
    val fileId: String,
    val fileName: String,
    val status: String,
)
