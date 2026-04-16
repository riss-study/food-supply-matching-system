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
    val unitPriceEstimate: String,
    val moq: String,
    val leadTime: String,
    val sampleCost: String?,
    val note: String?,
    val state: String,
    val version: Int,
    val threadId: String,
    val submittedAt: Instant,
    val updatedAt: Instant,
)
