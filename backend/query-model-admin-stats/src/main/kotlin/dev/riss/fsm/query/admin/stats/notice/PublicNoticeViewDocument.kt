package dev.riss.fsm.query.admin.stats.notice

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("public_notice_view")
data class PublicNoticeViewDocument(
    @Id
    val noticeId: String,
    val title: String,
    val excerpt: String,
    val publishedAt: Instant,
    val viewCount: Long,
)
