package dev.riss.fsm.query.thread

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("thread_summary_view")
data class ThreadSummaryDocument(
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
    val lastMessage: LastMessageInfo?,
    val requesterUnreadCount: Long,
    val supplierUnreadCount: Long,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class LastMessageInfo(
    val messageId: String,
    val senderUserId: String,
    val body: String?,
    val hasAttachments: Boolean,
    val createdAt: Instant,
)
