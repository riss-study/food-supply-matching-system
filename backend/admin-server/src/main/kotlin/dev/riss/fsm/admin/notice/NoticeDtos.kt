package dev.riss.fsm.admin.notice

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.time.Instant

data class CreateNoticeRequest(
    @field:NotBlank
    @field:Size(min = 5, max = 200)
    val title: String,
    @field:NotBlank
    @field:Size(min = 10, max = 5000)
    val body: String,
    @field:Pattern(regexp = "draft|published")
    val state: String? = "draft",
    val publishImmediately: Boolean = false,
)

data class UpdateNoticeRequest(
    @field:Size(min = 5, max = 200)
    val title: String?,
    @field:Size(min = 10, max = 5000)
    val body: String?,
    @field:Pattern(regexp = "draft|published|archived")
    val state: String?,
)

data class NoticeListItemResponse(
    val noticeId: String,
    val title: String,
    val excerpt: String,
    val state: String,
    val author: String,
    val authorId: String,
    val publishedAt: Instant?,
    val viewCount: Long,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class NoticeAttachmentResponse(
    val attachmentId: String,
    val fileName: String,
    val contentType: String,
    val fileSize: Long,
    val url: String,
    val createdAt: Instant,
)

data class NoticeDetailResponse(
    val noticeId: String,
    val title: String,
    val body: String,
    val state: String,
    val authorId: String,
    val publishedAt: Instant?,
    val viewCount: Long,
    val attachments: List<NoticeAttachmentResponse>,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class CreateNoticeResponse(
    val noticeId: String,
    val state: String,
    val createdAt: Instant,
)

data class UpdateNoticeResponse(
    val noticeId: String,
    val state: String,
    val publishedAt: Instant?,
    val updatedAt: Instant,
)
