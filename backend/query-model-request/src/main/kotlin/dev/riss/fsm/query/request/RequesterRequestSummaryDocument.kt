package dev.riss.fsm.query.request

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("requester_request_summary_view")
data class RequesterRequestSummaryDocument(
    @Id
    val requestId: String,
    val requesterUserId: String,
    val title: String,
    val category: String,
    val state: String,
    val mode: String,
    val quoteCount: Int,
    val createdAt: Instant,
    val updatedAt: Instant,
)
