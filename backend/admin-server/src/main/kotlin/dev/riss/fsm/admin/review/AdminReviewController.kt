package dev.riss.fsm.admin.review

import dev.riss.fsm.shared.api.ApiSuccessResponse
import dev.riss.fsm.shared.api.PaginationMeta
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.ExampleObject
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Mono
import java.time.LocalDate

@RestController
@RequestMapping("/api/admin/reviews")
@Tag(name = "admin-reviews")
@SecurityRequirement(name = "bearerAuth")
class AdminReviewController(
    private val service: AdminReviewApplicationService,
) {

    @GetMapping
    @Operation(summary = "Review queue", description = "List verification submissions for admin review")
    @ApiResponse(
        responseCode = "200",
        description = "Review queue fetched successfully",
        content = [Content(examples = [ExampleObject(value = "{\"code\":100,\"message\":\"Success\",\"data\":[{\"reviewId\":\"vsub_1\",\"supplierProfileId\":\"sprof_1\",\"companyName\":\"Example Foods\",\"state\":\"submitted\",\"submittedAt\":\"2026-03-20T00:00:00Z\",\"pendingDays\":1,\"verificationState\":\"submitted\"}],\"meta\":{\"page\":1,\"size\":20,\"totalElements\":1,\"totalPages\":1}}")])]
    )
    fun queue(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @Parameter(description = "Review state filter")
        @RequestParam(required = false) state: String?,
        @Parameter(description = "Submitted date from (inclusive)")
        @RequestParam(required = false) fromDate: LocalDate?,
        @Parameter(description = "Submitted date to (inclusive)")
        @RequestParam(required = false) toDate: LocalDate?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @Parameter(description = "Sort field: submittedAt, pendingDays, state, companyName")
        @RequestParam(required = false) sort: String?,
        @Parameter(description = "Sort order: asc or desc")
        @RequestParam(required = false) order: String?,
    ): Mono<ApiSuccessResponse<List<AdminReviewQueueItemResponse>>> {
        return service.queue(principal, state, fromDate, toDate, page, size, sort, order)
            .map { result ->
                ApiSuccessResponse(
                    message = "Success",
                    data = result.items.map {
                        AdminReviewQueueItemResponse(
                            reviewId = it.reviewId,
                            supplierProfileId = it.supplierProfileId,
                            companyName = it.companyName,
                            state = it.state,
                            submittedAt = it.submittedAt,
                            pendingDays = it.pendingDays,
                            verificationState = it.verificationState,
                        )
                    },
                    meta = PaginationMeta(
                        page = result.page,
                        size = result.size,
                        totalElements = result.totalElements.toLong(),
                        totalPages = result.totalPages,
                        hasNext = result.page < result.totalPages,
                        hasPrev = result.page > 1,
                    ),
                )
            }
    }

    @GetMapping("/{reviewId}")
    @Operation(summary = "Review detail", description = "Get supplier review detail")
    @ApiResponse(
        responseCode = "200",
        description = "Review detail fetched successfully",
        content = [Content(examples = [ExampleObject(value = "{\"code\":100,\"message\":\"Success\",\"data\":{\"reviewId\":\"vsub_1\",\"supplierProfileId\":\"sprof_1\",\"companyName\":\"Example Foods\",\"state\":\"submitted\",\"files\":[{\"fileId\":\"att_1\",\"fileName\":\"biz.pdf\",\"status\":\"submitted\",\"downloadUrl\":null}],\"reviewHistory\":[{\"actionType\":\"review_hold\",\"actorUserId\":\"adm_1\",\"createdAt\":\"2026-03-20T01:00:00Z\"}]}}")])]
    )
    fun detail(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @PathVariable reviewId: String,
    ): Mono<ApiSuccessResponse<AdminReviewDetailResponse>> {
        return service.detail(principal, reviewId)
            .map { ApiSuccessResponse(message = "Success", data = it) }
    }

    @PostMapping("/{reviewId}/approve")
    @Operation(summary = "Approve review", description = "공급사 검수 제출 건을 승인. exposureState 는 approved 로 변경되고 audit_log 에 기록됨.")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "Review approved",
                content = [Content(examples = [ExampleObject(value = "{\"code\":100,\"message\":\"Review approved\",\"data\":{\"reviewId\":\"vsub_1\",\"state\":\"approved\"}}")])]
            ),
            ApiResponse(responseCode = "403", description = "관리자 권한 없음", content = [Content(schema = Schema(ref = "#/components/schemas/ApiErrorResponse"))]),
            ApiResponse(responseCode = "404", description = "리뷰 없음", content = [Content(schema = Schema(ref = "#/components/schemas/ApiErrorResponse"))]),
            ApiResponse(responseCode = "409", description = "이미 결정됨", content = [Content(schema = Schema(ref = "#/components/schemas/ApiErrorResponse"))])
        ]
    )
    fun approve(@AuthenticationPrincipal principal: AuthenticatedUserPrincipal, @PathVariable reviewId: String, @RequestBody request: ReviewDecisionRequest): Mono<ApiSuccessResponse<ReviewDecisionResponse>> {
        return service.approve(principal, reviewId, request).map { ApiSuccessResponse(message = "Review approved", data = it) }
    }

    @PostMapping("/{reviewId}/hold")
    @Operation(summary = "Hold review", description = "검수를 보류 처리. 사유는 request body 의 note 에 기록되며 audit_log 에 반영.")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "Review put on hold",
                content = [Content(examples = [ExampleObject(value = "{\"code\":100,\"message\":\"Review put on hold\",\"data\":{\"reviewId\":\"vsub_1\",\"state\":\"hold\"}}")])]
            ),
            ApiResponse(responseCode = "403", description = "관리자 권한 없음", content = [Content(schema = Schema(ref = "#/components/schemas/ApiErrorResponse"))]),
            ApiResponse(responseCode = "404", description = "리뷰 없음", content = [Content(schema = Schema(ref = "#/components/schemas/ApiErrorResponse"))])
        ]
    )
    fun hold(@AuthenticationPrincipal principal: AuthenticatedUserPrincipal, @PathVariable reviewId: String, @RequestBody request: ReviewDecisionRequest): Mono<ApiSuccessResponse<ReviewDecisionResponse>> {
        return service.hold(principal, reviewId, request).map { ApiSuccessResponse(message = "Review put on hold", data = it) }
    }

    @PostMapping("/{reviewId}/reject")
    @Operation(summary = "Reject review", description = "검수를 반려 처리. 사유는 request body 의 note 에 기록되며 audit_log 에 반영.")
    @ApiResponses(
        value = [
            ApiResponse(
                responseCode = "200",
                description = "Review rejected",
                content = [Content(examples = [ExampleObject(value = "{\"code\":100,\"message\":\"Review rejected\",\"data\":{\"reviewId\":\"vsub_1\",\"state\":\"rejected\"}}")])]
            ),
            ApiResponse(responseCode = "403", description = "관리자 권한 없음", content = [Content(schema = Schema(ref = "#/components/schemas/ApiErrorResponse"))]),
            ApiResponse(responseCode = "404", description = "리뷰 없음", content = [Content(schema = Schema(ref = "#/components/schemas/ApiErrorResponse"))])
        ]
    )
    fun reject(@AuthenticationPrincipal principal: AuthenticatedUserPrincipal, @PathVariable reviewId: String, @RequestBody request: ReviewDecisionRequest): Mono<ApiSuccessResponse<ReviewDecisionResponse>> {
        return service.reject(principal, reviewId, request).map { ApiSuccessResponse(message = "Review rejected", data = it) }
    }
}
