package dev.riss.fsm.api.quote

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.Size
import java.time.Instant

@Schema(description = "Submit quote request")
data class SubmitQuoteRequest(
    @field:Min(1)
    val unitPriceEstimate: Int,
    @field:Min(1)
    val moq: Int,
    @field:Min(1)
    val leadTime: Int,
    @field:Min(0)
    val sampleCost: Int?,
    @field:Size(max = 1000)
    val note: String?,
)

@Schema(description = "Quote update request")
data class UpdateQuoteRequest(
    @field:Min(1)
    val unitPriceEstimate: Int?,
    @field:Min(1)
    val moq: Int?,
    @field:Min(1)
    val leadTime: Int?,
    @field:Min(0)
    val sampleCost: Int?,
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
    val unitPriceEstimate: Int,
    val moq: Int,
    val leadTime: Int,
    val sampleCost: Int?,
    val state: String,
    val threadId: String,
    val submittedAt: Instant,
)

data class SupplierQuoteListItem(
    val quoteId: String,
    val requestId: String,
    val requestTitle: String,
    val category: String,
    val unitPriceEstimate: Int,
    val moq: Int,
    val leadTime: Int,
    val sampleCost: Int?,
    val state: String,
    val version: Int,
    val threadId: String,
    val submittedAt: Instant,
)
