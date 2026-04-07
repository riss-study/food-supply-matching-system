package dev.riss.fsm.admin.notice

import dev.riss.fsm.shared.api.ApiSuccessResponse
import dev.riss.fsm.shared.api.PaginationMeta
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.codec.multipart.FilePart
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/admin/notices")
@Tag(name = "admin-notices", description = "Admin notice management APIs")
@SecurityRequirement(name = "bearerAuth")
class AdminNoticeController(
    private val noticeApplicationService: NoticeApplicationService,
) {

    @GetMapping
    @Operation(summary = "List notices", description = "Get all notices with optional state filter")
    fun list(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @Parameter(description = "State filter: draft, published, archived")
        @RequestParam(required = false) state: String?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sort: String,
        @RequestParam(defaultValue = "desc") order: String,
    ): Mono<ApiSuccessResponse<List<NoticeListItemResponse>>> {
        return noticeApplicationService.list(principal, state, page, size, sort, order)
            .map { result ->
                ApiSuccessResponse(
                    message = "Success",
                    data = result.items,
                    meta = PaginationMeta(
                        page = result.page,
                        size = result.size,
                        totalElements = result.totalElements,
                        totalPages = result.totalPages,
                        hasNext = result.page < result.totalPages,
                        hasPrev = result.page > 1,
                    ),
                )
            }
    }

    @GetMapping("/{noticeId}")
    @Operation(summary = "Get notice detail", description = "Get detailed notice information")
    fun detail(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @Parameter(description = "Notice ID") @PathVariable noticeId: String,
    ): Mono<ApiSuccessResponse<NoticeDetailResponse>> {
        return noticeApplicationService.detail(principal, noticeId)
            .map { ApiSuccessResponse(message = "Success", data = it) }
    }

    @PostMapping
    @Operation(summary = "Create notice", description = "Create a new notice")
    fun create(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @Valid @RequestBody request: CreateNoticeRequest,
    ): Mono<ResponseEntity<ApiSuccessResponse<CreateNoticeResponse>>> {
        return noticeApplicationService.create(principal, request)
            .map { response ->
                ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiSuccessResponse(message = "Notice created", data = response))
            }
    }

    @PostMapping("/{noticeId}/attachments")
    @Operation(summary = "Upload notice attachment", description = "Upload a file attachment to a notice")
    fun uploadAttachment(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @Parameter(description = "Notice ID") @PathVariable noticeId: String,
        @RequestPart("file") file: FilePart,
    ): Mono<ResponseEntity<ApiSuccessResponse<NoticeAttachmentResponse>>> {
        return noticeApplicationService.uploadAttachment(principal, noticeId, file)
            .map { response ->
                ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiSuccessResponse(message = "Attachment uploaded", data = response))
            }
    }

    @DeleteMapping("/{noticeId}/attachments/{attachmentId}")
    @Operation(summary = "Delete notice attachment", description = "Delete an attachment from a notice")
    fun deleteAttachment(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @Parameter(description = "Notice ID") @PathVariable noticeId: String,
        @Parameter(description = "Attachment ID") @PathVariable attachmentId: String,
    ): Mono<ResponseEntity<ApiSuccessResponse<Map<String, String>>>> {
        return noticeApplicationService.deleteAttachment(principal, noticeId, attachmentId)
            .then(Mono.just(
                ResponseEntity.ok(ApiSuccessResponse(
                    message = "Attachment deleted",
                    data = mapOf("attachmentId" to attachmentId),
                ))
            ))
    }

    @PatchMapping("/{noticeId}")
    @Operation(summary = "Update notice", description = "Update notice title, body, or state")
    fun update(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @Parameter(description = "Notice ID") @PathVariable noticeId: String,
        @Valid @RequestBody request: UpdateNoticeRequest,
    ): Mono<ApiSuccessResponse<UpdateNoticeResponse>> {
        return noticeApplicationService.update(principal, noticeId, request)
            .map { ApiSuccessResponse(message = "Notice updated", data = it) }
    }
}
