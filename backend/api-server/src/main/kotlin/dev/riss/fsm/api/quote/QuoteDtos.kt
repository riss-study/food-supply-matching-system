package dev.riss.fsm.api.quote

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant

@Schema(description = "Submit quote request")
data class SubmitQuoteRequest(
    @field:NotBlank
    @Schema(description = "예상 단가", example = "950원/개")
    val unitPriceEstimate: String,
    @field:NotBlank
    @Schema(description = "최소 주문량", example = "2,000개")
    val moq: String,
    @field:NotBlank
    @Schema(description = "납기", example = "21일")
    val leadTime: String,
    @Schema(description = "샘플 비용", example = "50,000원")
    val sampleCost: String?,
    @field:Size(max = 1000)
    val note: String?,
)

@Schema(description = "Quote update request")
data class UpdateQuoteRequest(
    @Schema(description = "예상 단가", example = "950원/개")
    val unitPriceEstimate: String?,
    @Schema(description = "최소 주문량", example = "2,000개")
    val moq: String?,
    @Schema(description = "납기", example = "21일")
    val leadTime: String?,
    @Schema(description = "샘플 비용", example = "50,000원")
    val sampleCost: String?,
    @field:Size(max = 1000)
    val note: String?,
)

data class DeclineQuoteRequest(
    @field:Size(max = 500)
    val reason: String?,
)

data class SubmitQuoteResponse(
    val quoteId: String,
    val state: String,
    val threadId: String,
    val createdAt: Instant,
)

data class UpdateQuoteResponse(
    val quoteId: String,
    val state: String,
    val version: Int,
    val updatedAt: Instant,
)

data class WithdrawQuoteResponse(
    val quoteId: String,
    val state: String,
    val withdrawnAt: Instant,
)

data class SelectQuoteResponse(
    val quoteId: String,
    val state: String,
    val requestState: String,
    val selectedAt: Instant,
)

data class DeclineQuoteResponse(
    val quoteId: String,
    val state: String,
    val declinedAt: Instant,
)

data class RequestQuoteListItem(
    val quoteId: String,
    val supplierId: String,
    val companyName: String,
    val unitPriceEstimate: String,
    val moq: String,
    val leadTime: String,
    val sampleCost: String?,
    val state: String,
    val threadId: String,
    val submittedAt: Instant,
)

data class SupplierQuoteListItem(
    val quoteId: String,
    val requestId: String,
    val requestTitle: String,
    val category: String,
    val unitPriceEstimate: String,
    val moq: String,
    val leadTime: String,
    val sampleCost: String?,
    val state: String,
    val version: Int,
    val threadId: String,
    val submittedAt: Instant,
)
