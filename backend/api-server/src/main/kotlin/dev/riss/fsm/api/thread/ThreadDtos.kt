package dev.riss.fsm.api.thread

import dev.riss.fsm.shared.api.PaginationMeta
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant

data class ThreadListPageResponse(
    val items: List<ThreadSummaryResponse>,
    val meta: PaginationMeta,
)

data class CreateThreadRequest(
    @field:NotBlank
    @Schema(description = "Target supplier profile id", example = "sprof_123")
    val supplierId: String,
)

data class CreateThreadResponse(
    val threadId: String,
    val requestId: String,
    val supplierProfileId: String,
    val createdAt: Instant,
    val created: Boolean,
)

data class ThreadOtherPartyResponse(
    val displayName: String,
    val type: String,
    val role: String,
    val profileId: String?,
)

data class ThreadSummaryResponse(
    val threadId: String,
    val requestId: String,
    val requestTitle: String,
    val otherParty: ThreadOtherPartyResponse,
    val unreadCount: Long,
    val contactShareState: String,
    val lastMessage: ThreadLastMessageResponse?,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class ThreadLastMessageResponse(
    val messageId: String,
    val senderUserId: String,
    val body: String?,
    val hasAttachments: Boolean,
    val sentAt: Instant,
    val read: Boolean,
    val createdAt: Instant,
)

data class ThreadDetailResponse(
    val threadId: String,
    val requestId: String,
    val requestTitle: String,
    val otherParty: ThreadOtherPartyResponse,
    val contactShareState: String,
    val contactShareRequestedByRole: String?,
    val requesterApproved: Boolean,
    val supplierApproved: Boolean,
    val sharedContact: ThreadSharedContactResponse?,
    val messages: List<ThreadMessageResponse>,
    val meta: PaginationMeta,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class ThreadParticipantContactResponse(
    val name: String,
    val phone: String?,
    val email: String?,
)

data class ThreadSharedContactResponse(
    val requester: ThreadParticipantContactResponse,
    val supplier: ThreadParticipantContactResponse,
)

data class ThreadMessageResponse(
    val messageId: String,
    val senderUserId: String,
    val senderType: String,
    val body: String?,
    val attachments: List<ThreadAttachmentResponse>,
    val sentAt: Instant,
    val createdAt: Instant,
)

data class ThreadAttachmentResponse(
    val attachmentId: String,
    val fileName: String,
    val contentType: String,
    val fileSize: Long,
    val url: String,
    val createdAt: Instant,
)

data class SendThreadMessageRequest(
    @field:Size(max = 2000)
    val body: String? = null,
    @field:Size(max = 10)
    val attachmentIds: List<String>? = null,
)

data class SendThreadMessageResponse(
    val messageId: String,
    val threadId: String,
    val createdAt: Instant,
)

data class MarkThreadReadResponse(
    val threadId: String,
    val unreadCount: Long,
    val readAt: Instant,
)

data class UploadThreadAttachmentResponse(
    val attachmentId: String,
    val fileName: String,
    val contentType: String,
    val fileSize: Long,
    val url: String,
    val createdAt: Instant,
)

data class ContactShareActionResponse(
    val threadId: String,
    val contactShareState: String,
    val requestedBy: String?,
    val requestedAt: Instant?,
    val approvedAt: Instant?,
    val revokedAt: Instant?,
    val contactShareRequestedByRole: String?,
    val requesterApproved: Boolean,
    val supplierApproved: Boolean,
    val sharedContact: ThreadSharedContactResponse?,
)
