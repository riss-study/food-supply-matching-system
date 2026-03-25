package dev.riss.fsm.query.thread

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("thread_detail_view")
data class ThreadDetailDocument(
    @Id
    val threadId: String,
    val requestId: String,
    val requesterUserId: String,
    val supplierProfileId: String,
    val quoteId: String?,
    val contactShareState: String,
    val requestTitle: String,
    val requesterBusinessName: String,
    val supplierCompanyName: String,
    val createdAt: Instant,
    val updatedAt: Instant,
)
