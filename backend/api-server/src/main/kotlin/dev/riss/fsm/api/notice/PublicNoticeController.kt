package dev.riss.fsm.api.notice

import dev.riss.fsm.shared.api.ApiSuccessResponse
import dev.riss.fsm.shared.api.PaginationMeta
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/notices")
@Tag(name = "notices", description = "Public notice APIs")
class PublicNoticeController(
    private val publicNoticeApplicationService: PublicNoticeApplicationService,
) {

    @GetMapping
    @Operation(summary = "List published notices", description = "Get all published notices")
    fun list(
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "publishedAt") sort: String,
        @RequestParam(defaultValue = "desc") order: String,
    ): Mono<ApiSuccessResponse<List<PublicNoticeListItem>>> {
        return publicNoticeApplicationService.list(page, size, sort, order)
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
    @Operation(summary = "Get notice detail", description = "Get published notice detail with view count increment")
    fun detail(
        @Parameter(description = "Notice ID") @PathVariable noticeId: String,
    ): Mono<ApiSuccessResponse<PublicNoticeDetailResponse>> {
        return publicNoticeApplicationService.detail(noticeId)
            .map { ApiSuccessResponse(message = "Success", data = it) }
    }

    @GetMapping("/{noticeId}/attachments/{attachmentId}")
    @Operation(summary = "Download notice attachment", description = "Download a published notice attachment file")
    fun downloadAttachment(
        @PathVariable noticeId: String,
        @PathVariable attachmentId: String,
    ): Mono<ResponseEntity<org.springframework.core.io.FileSystemResource>> {
        return publicNoticeApplicationService.downloadAttachment(noticeId, attachmentId)
    }
}
