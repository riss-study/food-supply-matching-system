package dev.riss.fsm.api.thread

import dev.riss.fsm.shared.api.ApiSuccessResponse
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.http.codec.multipart.FilePart
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api")
@Tag(name = "threads")
@SecurityRequirement(name = "bearerAuth")
class ThreadController(
    private val threadApplicationService: ThreadApplicationService,
) {
    @PostMapping("/requests/{requestId}/threads")
    @Operation(summary = "Create thread", description = "Requester manually creates or reuses a thread with a supplier for a request")
    fun createThread(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @PathVariable requestId: String,
        @Valid @RequestBody request: CreateThreadRequest,
    ): Mono<ResponseEntity<ApiSuccessResponse<CreateThreadResponse>>> {
        return threadApplicationService.createThread(principal, requestId, request)
            .map { response ->
                ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiSuccessResponse(message = "Thread created", data = response))
            }
    }

    @GetMapping("/threads")
    @Operation(summary = "List my threads", description = "List requester or supplier threads")
    fun listThreads(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @RequestParam(defaultValue = "false") unreadOnly: Boolean,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): Mono<ApiSuccessResponse<List<ThreadSummaryResponse>>> {
        return threadApplicationService.listThreads(principal, unreadOnly, page, size)
            .map { pageResponse -> ApiSuccessResponse(message = "Success", data = pageResponse.items, meta = pageResponse.meta) }
    }

    @GetMapping("/threads/{threadId}")
    @Operation(summary = "Get thread detail", description = "Get thread detail and paged messages")
    fun getThreadDetail(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @PathVariable threadId: String,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "50") size: Int,
    ): Mono<ApiSuccessResponse<ThreadDetailResponse>> {
        return threadApplicationService.getThreadDetail(principal, threadId, page, size)
            .map { detail -> ApiSuccessResponse(message = "Success", data = detail) }
    }

    @PostMapping("/threads/{threadId}/messages")
    @Operation(summary = "Send thread message", description = "Send a text message or attachment message to a thread")
    fun sendMessage(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @PathVariable threadId: String,
        @Valid @RequestBody request: SendThreadMessageRequest,
    ): Mono<ResponseEntity<ApiSuccessResponse<SendThreadMessageResponse>>> {
        return threadApplicationService.sendMessage(principal, threadId, request)
            .map { response ->
                ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiSuccessResponse(message = "Message sent", data = response))
            }
    }

    @PostMapping("/threads/{threadId}/read")
    @Operation(summary = "Mark thread as read", description = "Mark a thread as read for the current participant")
    fun markRead(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @PathVariable threadId: String,
    ): Mono<ApiSuccessResponse<MarkThreadReadResponse>> {
        return threadApplicationService.markThreadAsRead(principal, threadId)
            .map { response -> ApiSuccessResponse(message = "Thread marked as read", data = response) }
    }

    @PostMapping("/threads/{threadId}/attachments", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @Operation(summary = "Upload thread attachment", description = "Upload an attachment scoped to a thread")
    fun uploadAttachment(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @PathVariable threadId: String,
        @RequestPart("file") file: FilePart,
    ): Mono<ResponseEntity<ApiSuccessResponse<UploadThreadAttachmentResponse>>> {
        return threadApplicationService.uploadAttachment(principal, threadId, file)
            .map { response ->
                ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiSuccessResponse(message = "Attachment uploaded", data = response))
            }
    }

    @GetMapping("/threads/{threadId}/attachments/{attachmentId}")
    @Operation(summary = "Download thread attachment", description = "Download a thread attachment file")
    fun downloadAttachment(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @PathVariable threadId: String,
        @PathVariable attachmentId: String,
    ): Mono<ResponseEntity<org.springframework.core.io.FileSystemResource>> {
        return threadApplicationService.downloadAttachment(principal, threadId, attachmentId)
    }
}
