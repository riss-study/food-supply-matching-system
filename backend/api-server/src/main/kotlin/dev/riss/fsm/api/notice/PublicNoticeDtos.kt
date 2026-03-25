package dev.riss.fsm.api.notice

import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

@Schema(description = "Public notice list item")
data class PublicNoticeListItem(
    val noticeId: String,
    val title: String,
    val excerpt: String,
    val publishedAt: Instant,
    val viewCount: Long,
)

@Schema(description = "Public notice detail response")
data class PublicNoticeDetailResponse(
    val noticeId: String,
    val title: String,
    val body: String,
    val publishedAt: Instant,
    val viewCount: Long,
    val attachments: List<PublicNoticeAttachmentResponse>,
)

@Schema(description = "Public notice attachment")
data class PublicNoticeAttachmentResponse(
    val attachmentId: String,
    val fileName: String,
    val url: String,
)
