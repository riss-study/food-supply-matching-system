package dev.riss.fsm.api.request

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.time.Instant

@Schema(description = "Price range for a request")
data class CreateRequestPriceRange(
    @Schema(description = "Minimum price", example = "500원/kg")
    val min: String?,
    @Schema(description = "Maximum price", example = "1000원/kg")
    val max: String?,
)

@Schema(description = "Request to create a new request")
data class CreateRequestRequest(
    @field:Pattern(regexp = "^(public|targeted)$")
    @Schema(description = "Request mode: public or targeted", example = "public", required = true)
    val mode: String,
    @field:Size(min = 5, max = 200)
    @Schema(description = "Request title", example = "수제 과자 제조 의뢰", required = true)
    val title: String,
    @field:NotBlank
    @Schema(description = "Product category", example = "snack", required = true)
    val category: String,
    @field:NotBlank
    @Schema(description = "Desired volume", example = "10,000개", required = true)
    val desiredVolume: String,
    @Schema(description = "Target price range")
    val targetPriceRange: CreateRequestPriceRange?,
    @Schema(description = "Required certifications", example = "[\"HACCP\"]")
    val certificationRequirement: List<String>?,
    @field:Pattern(regexp = "^(requester_provided|supplier_provided)?$")
    @Schema(description = "Raw material provision rule", example = "supplier_provided")
    val rawMaterialRule: String?,
    @field:Pattern(regexp = "^(private_label|bulk|none)?$")
    @Schema(description = "Packaging requirement", example = "private_label")
    val packagingRequirement: String?,
    @Schema(description = "Delivery requirement date (YYYY-MM-DD)", example = "2026-06-01")
    val deliveryRequirement: String?,
    @field:Size(max = 2000)
    @Schema(description = "Additional notes", example = "유기농 원재료 사용 필수")
    val notes: String?,
    @Schema(description = "Target supplier IDs for targeted mode (required when mode=targeted)", example = "[\"sprof_123\"]")
    val targetSupplierIds: List<String>?,
)

@Schema(description = "Response after creating a request")
data class CreateRequestResponse(
    @Schema(description = "Request ID", example = "req_01HQX...")
    val requestId: String,
    @Schema(description = "Request state", example = "draft")
    val state: String,
    @Schema(description = "Creation timestamp")
    val createdAt: Instant,
)

@Schema(description = "Request to update an existing request")
data class UpdateRequestRequest(
    @field:Size(min = 5, max = 200)
    @Schema(description = "Request title", example = "수제 과자 제조 의뢰")
    val title: String?,
    @Schema(description = "Desired volume", example = "15000")
    val desiredVolume: String?,
    @Schema(description = "Target price range")
    val targetPriceRange: CreateRequestPriceRange?,
    @Schema(description = "Required certifications", example = "[\"HACCP\", \"ISO22000\"]")
    val certificationRequirement: List<String>?,
    @field:Pattern(regexp = "^(requester_provided|supplier_provided)?$")
    @Schema(description = "Raw material provision rule", example = "supplier_provided")
    val rawMaterialRule: String?,
    @field:Pattern(regexp = "^(private_label|bulk|none)?$")
    @Schema(description = "Packaging requirement", example = "private_label")
    val packagingRequirement: String?,
    @Schema(description = "Delivery requirement date (YYYY-MM-DD)", example = "2026-07-01")
    val deliveryRequirement: String?,
    @field:Size(max = 2000)
    @Schema(description = "Additional notes", example = "수정된 비고 내용")
    val notes: String?,
)

@Schema(description = "Response after updating a request")
data class UpdateRequestResponse(
    @Schema(description = "Request ID", example = "req_01HQX...")
    val requestId: String,
    @Schema(description = "Request state", example = "open")
    val state: String,
    @Schema(description = "Last update timestamp")
    val updatedAt: Instant,
)

@Schema(description = "Requester information in request detail")
data class RequestDetailRequester(
    @Schema(description = "Business name", example = "주식회사 예시")
    val businessName: String,
    @Schema(description = "Contact name", example = "홍길동")
    val contactName: String,
)

@Schema(description = "Target supplier information in request detail")
data class RequestDetailTargetSupplier(
    @Schema(description = "Supplier profile ID", example = "sprof_01")
    val supplierProfileId: String,
    @Schema(description = "Company name", example = "예시 식품")
    val companyName: String,
)

@Schema(description = "Request detail response")
data class RequestDetailResponse(
    @Schema(description = "Request ID", example = "req_01HQX...")
    val requestId: String,
    @Schema(description = "Request mode", example = "public")
    val mode: String,
    @Schema(description = "Request title", example = "수제 과자 제조 의뢰")
    val title: String,
    @Schema(description = "Product category", example = "snack")
    val category: String,
    @Schema(description = "Desired volume", example = "10000")
    val desiredVolume: String,
    @Schema(description = "Target price range")
    val targetPriceRange: CreateRequestPriceRange?,
    @Schema(description = "Required certifications", example = "[\"HACCP\"]")
    val certificationRequirement: List<String>?,
    @Schema(description = "Raw material provision rule", example = "supplier_provided")
    val rawMaterialRule: String?,
    @Schema(description = "Packaging requirement", example = "private_label")
    val packagingRequirement: String?,
    @Schema(description = "Delivery requirement date", example = "2026-06-01")
    val deliveryRequirement: String?,
    @Schema(description = "Additional notes")
    val notes: String?,
    @Schema(description = "Request state", example = "open")
    val state: String,
    @Schema(description = "Requester information")
    val requester: RequestDetailRequester?,
    @Schema(description = "Target suppliers (for targeted mode)")
    val targetSuppliers: List<RequestDetailTargetSupplier>?,
    @Schema(description = "Active(received) quote count — submitted/selected/declined 합계")
    val quoteCount: Int,
    @Schema(description = "Creation timestamp")
    val createdAt: Instant,
)

@Schema(description = "Response after publishing a request")
data class PublishRequestResponse(
    @Schema(description = "Request ID", example = "req_01HQX...")
    val requestId: String,
    @Schema(description = "Request state", example = "open")
    val state: String,
    @Schema(description = "Publish timestamp")
    val publishedAt: Instant,
)

@Schema(description = "Request summary item in list")
data class RequestListItemResponse(
    @Schema(description = "Request ID", example = "req_01HQX...")
    val requestId: String,
    @Schema(description = "Request title", example = "수제 과자 제조 의뢰")
    val title: String,
    @Schema(description = "Product category", example = "snack")
    val category: String,
    @Schema(description = "Request state", example = "open")
    val state: String,
    @Schema(description = "Request mode", example = "public")
    val mode: String,
    @Schema(description = "Number of quotes received", example = "3")
    val quoteCount: Int,
    @Schema(description = "Creation timestamp")
    val createdAt: Instant,
    @Schema(description = "Expiration timestamp")
    val expiresAt: Instant?,
)

@Schema(description = "Request to cancel a request")
data class CancelRequestRequest(
    @field:Size(max = 500)
    @Schema(description = "Cancellation reason", example = "프로젝트 무산")
    val reason: String?,
)

@Schema(description = "Response after closing a request")
data class CloseRequestResponse(
    @Schema(description = "Request ID", example = "req_01HQX...")
    val requestId: String,
    @Schema(description = "Request state", example = "closed")
    val state: String,
    @Schema(description = "Close timestamp")
    val closedAt: Instant,
)

@Schema(description = "Response after cancelling a request")
data class CancelRequestResponse(
    @Schema(description = "Request ID", example = "req_01HQX...")
    val requestId: String,
    @Schema(description = "Request state", example = "cancelled")
    val state: String,
    @Schema(description = "Cancel timestamp")
    val cancelledAt: Instant,
)
