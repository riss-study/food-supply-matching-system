package dev.riss.fsm.api.quote

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.Size
import java.time.Instant

@Schema(description = "Submit quote request")
data class SubmitQuoteRequest(
    @field:Min(1)
    val unitPriceEstimate: String,
    @field:Min(1)
    val moq: String,
    @field:Min(1)
    val leadTime: String,
    @field:Min(0)
    val sampleCost: String?,
    @field:Size(max = 1000)
    val note: String?,
)

@Schema(description = "Quote update request")
data class UpdateQuoteRequest(
    @field:Min(1)
    val unitPriceEstimate: String?,
    @field:Min(1)
    val moq: String?,
    @field:Min(1)
    val leadTime: String?,
    @field:Min(0)
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
