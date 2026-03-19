package dev.riss.fsm.query.user

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("requester_business_profile_view")
data class RequesterBusinessProfileDocument(
    @Id
    val profileId: String,
    val userId: String,
    val businessName: String,
    val businessRegistrationNumber: String,
    val contactName: String,
    val contactPhone: String,
    val contactEmail: String,
    val verificationScope: String,
    val approvalState: String,
    val submittedAt: Instant?,
    val approvedAt: Instant?,
    val rejectedAt: Instant?,
    val rejectionReason: String?,
    val updatedAt: Instant,
)
