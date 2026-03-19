package dev.riss.fsm.query.admin.review

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("admin_review_queue_view")
data class AdminReviewQueueItemDocument(
    @Id
    val reviewId: String,
    val supplierProfileId: String,
    val companyName: String,
    val state: String,
    val submittedAt: Instant,
    val pendingDays: Long,
    val verificationState: String,
)
