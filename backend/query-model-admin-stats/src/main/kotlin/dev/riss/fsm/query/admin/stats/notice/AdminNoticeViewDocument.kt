package dev.riss.fsm.query.admin.stats.notice

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("admin_notice_view")
data class AdminNoticeViewDocument(
    @Id
    val noticeId: String,
    val title: String,
    val excerpt: String,
    val state: String,
    val authorId: String,
    val publishedAt: Instant?,
    val viewCount: Long,
    val createdAt: Instant,
    val updatedAt: Instant,
)
