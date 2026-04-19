package dev.riss.fsm.api.notice

import dev.riss.fsm.shared.api.ApiSuccessResponse
import dev.riss.fsm.shared.api.PaginationMeta
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.ExampleObject
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
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
    @Operation(summary = "List published notices", description = "Get all published notices (pagination + sort).")
    @ApiResponse(
        responseCode = "200",
        description = "Published notices",
        content = [Content(examples = [ExampleObject(value = "{\"code\":100,\"message\":\"Success\",\"data\":[{\"noticeId\":\"notice_1\",\"title\":\"서비스 오픈 안내\",\"publishedAt\":\"2026-04-01T09:00:00Z\",\"viewCount\":123}],\"meta\":{\"page\":1,\"size\":20,\"totalElements\":5,\"totalPages\":1,\"hasNext\":false,\"hasPrev\":false}}")])]
    )
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
    @Operation(summary = "Get notice detail", description = "Get published notice detail. 조회 시 viewCount 가 1 증가.")
    @ApiResponses(
        value = [
            ApiResponse(responseCode = "200", description = "Notice detail"),
            ApiResponse(responseCode = "404", description = "Notice not found or not published", content = [Content(schema = Schema(ref = "#/components/schemas/ApiErrorResponse"))])
        ]
    )
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
