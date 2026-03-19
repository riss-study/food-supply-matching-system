package dev.riss.fsm.api.requester

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.time.Instant

data class SubmitRequesterBusinessProfileRequest(
    @field:NotBlank
    @field:Size(min = 2, max = 100)
    val businessName: String,
    @field:Pattern(regexp = "^\\d{3}-\\d{2}-\\d{5}$", message = "business registration number must match 123-45-67890")
    val businessRegistrationNumber: String,
    @field:NotBlank
    @field:Size(min = 2, max = 50)
    val contactName: String,
    @field:Pattern(regexp = "^01[0-9]-\\d{3,4}-\\d{4}$", message = "contact phone must match 010-1234-5678")
    val contactPhone: String,
    @field:Email
    val contactEmail: String,
    @field:Pattern(regexp = "^(domestic|overseas)$", message = "verificationScope must be domestic or overseas")
    val verificationScope: String,
)

data class UpdateRequesterBusinessProfileRequest(
    val businessName: String? = null,
    val businessRegistrationNumber: String? = null,
    val contactName: String? = null,
    val contactPhone: String? = null,
    val contactEmail: String? = null,
    val verificationScope: String? = null,
)

data class RequesterBusinessProfileResponse(
    val profileId: String,
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

data class RequesterBusinessProfileSubmitResponse(
    val profileId: String,
    val approvalState: String,
    val submittedAt: Instant,
)
