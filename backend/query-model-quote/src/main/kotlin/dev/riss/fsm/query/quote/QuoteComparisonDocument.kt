package dev.riss.fsm.query.quote

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("quote_comparison_view")
data class QuoteComparisonDocument(
    @Id
    val quoteId: String,
    val requestId: String,
    val supplierProfileId: String,
    val companyName: String,
    val requestTitle: String,
    val requestCategory: String,
    val requestDesiredVolume: String,
    val unitPriceEstimate: Int,
    val moq: Int,
    val leadTime: Int,
    val sampleCost: Int?,
    val note: String?,
    val state: String,
    val version: Int,
    val threadId: String,
    val submittedAt: Instant,
    val updatedAt: Instant,
)
