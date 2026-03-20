package dev.riss.fsm.api.supplier

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import jakarta.validation.constraints.Pattern
import java.time.Instant

data class CreateSupplierProfileRequest(
    @field:Size(min = 2, max = 100)
    val companyName: String,
    @field:Size(min = 2, max = 50)
    val representativeName: String,
    @field:NotBlank
    val region: String,
    @field:Size(min = 1)
    val categories: List<String>,
    @field:Size(max = 500)
    val equipmentSummary: String?,
    @field:Min(1)
    @field:Max(1_000_000_000)
    val monthlyCapacity: Int,
    @field:Min(1)
    @field:Max(1_000_000_000)
    val moq: Int,
    val oemAvailable: Boolean,
    val odmAvailable: Boolean,
    val rawMaterialSupport: Boolean = false,
    val packagingLabelingSupport: Boolean = false,
    @field:Size(max = 2000)
    val introduction: String?,
)

data class UpdateSupplierProfileRequest(
    val companyName: String? = null,
    val representativeName: String? = null,
    val region: String? = null,
    @field:Size(min = 1)
    val categories: List<String>? = null,
    val equipmentSummary: String? = null,
    val monthlyCapacity: Int? = null,
    val moq: Int? = null,
    val oemAvailable: Boolean? = null,
    val odmAvailable: Boolean? = null,
    val rawMaterialSupport: Boolean? = null,
    val packagingLabelingSupport: Boolean? = null,
    val introduction: String? = null,
)

data class SupplierProfileResponse(
    val profileId: String,
    val companyName: String,
    val representativeName: String,
    val region: String,
    val categories: List<String>,
    val equipmentSummary: String?,
    val monthlyCapacity: Int,
    val moq: Int,
    val oemAvailable: Boolean,
    val odmAvailable: Boolean,
    val rawMaterialSupport: Boolean,
    val packagingLabelingSupport: Boolean,
    val introduction: String?,
    val verificationState: String,
    val exposureState: String,
    val certifications: List<CertificationRecordResponse>,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class CertificationRecordResponse(
    val recordId: String,
    val type: String,
    val number: String?,
    val fileAttachmentId: String,
    val status: String,
)

data class VerificationSubmissionResponse(
    val submissionId: String,
    val state: String,
    val submittedAt: Instant,
    val fileCount: Int,
)

data class LatestVerificationSubmissionResponse(
    val submissionId: String,
    val state: String,
    val submittedAt: Instant,
    val reviewedAt: Instant?,
    val reviewNotePublic: String?,
    val files: List<VerificationFileItem>,
)

data class VerificationFileItem(
    val fileId: String,
    val fileName: String,
    val status: String,
)

data class AttachmentUploadResponse(
    val attachmentId: String,
    val ownerType: String,
    val ownerId: String,
    val fileName: String,
    val contentType: String,
    val fileSize: Long,
    val storageKey: String,
    val createdAt: Instant,
)

data class SupplierSearchItemResponse(
    val profileId: String,
    val companyName: String,
    val region: String,
    val categories: List<String>,
    val monthlyCapacity: Int,
    val moq: Int,
    val oemAvailable: Boolean,
    val odmAvailable: Boolean,
    val verificationState: String,
    val exposureState: String,
    val logoUrl: String?,
)

data class SupplierCertificationSummaryResponse(
    val type: String,
    val number: String?,
    val valid: Boolean,
)

data class SupplierPortfolioImageResponse(
    val imageId: String,
    val url: String,
)

data class SupplierDetailResponse(
    val profileId: String,
    val companyName: String,
    val representativeName: String,
    val region: String,
    val categories: List<String>,
    val equipmentSummary: String?,
    val monthlyCapacity: Int,
    val moq: Int,
    val oemAvailable: Boolean,
    val odmAvailable: Boolean,
    val rawMaterialSupport: Boolean,
    val packagingLabelingSupport: Boolean,
    val introduction: String?,
    val verificationState: String,
    val logoUrl: String?,
    val certifications: List<SupplierCertificationSummaryResponse>,
    val portfolioImages: List<SupplierPortfolioImageResponse>,
)

data class SupplierCategorySummaryResponse(
    val category: String,
    val supplierCount: Int,
)

data class SupplierRegionSummaryResponse(
    val region: String,
    val supplierCount: Int,
)
