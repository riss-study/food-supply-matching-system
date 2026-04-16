package dev.riss.fsm.query.request

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("supplier_request_feed_view")
data class SupplierRequestFeedDocument(
    @Id
    val feedItemId: String,
    val requestId: String,
    val requesterBusinessName: String,
    val title: String,
    val category: String,
    val desiredVolume: String,
    val targetPriceMin: String?,
    val targetPriceMax: String?,
    val certificationRequirement: List<String>?,
    val mode: String,
    val isTargeted: Boolean,
    val hasQuoted: Boolean,
    val createdAt: Instant,
)
