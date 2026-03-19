package dev.riss.fsm.admin.review

import dev.riss.fsm.shared.api.ApiSuccessResponse
import dev.riss.fsm.shared.api.PaginationMeta
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
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

@RestController
@RequestMapping("/api/admin/reviews")
@Tag(name = "admin-reviews")
@SecurityRequirement(name = "bearerAuth")
class AdminReviewController(
    private val service: AdminReviewApplicationService,
) {

    @GetMapping
    @Operation(summary = "Review queue", description = "List verification submissions for admin review")
    fun queue(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @RequestParam(required = false) state: String?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): Mono<ApiSuccessResponse<List<AdminReviewQueueItemResponse>>> {
        return service.queue(principal, state, page, size)
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
                    ),
                )
            }
    }

    @GetMapping("/{reviewId}")
    @Operation(summary = "Review detail", description = "Get supplier review detail")
    fun detail(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @PathVariable reviewId: String,
    ): Mono<ApiSuccessResponse<AdminReviewDetailResponse>> {
        return service.detail(principal, reviewId)
            .map {
                ApiSuccessResponse(
                    message = "Success",
                    data = AdminReviewDetailResponse(
                        reviewId = it.reviewId,
                        supplierProfileId = it.supplierProfileId,
                        companyName = it.companyName,
                        representativeName = it.representativeName,
                        region = it.region,
                        categories = it.categories,
                        state = it.state,
                        submittedAt = it.submittedAt,
                        reviewedAt = it.reviewedAt,
                        reviewNoteInternal = it.reviewNoteInternal,
                        reviewNotePublic = it.reviewNotePublic,
                        files = it.files,
                    )
                )
            }
    }

    @PostMapping("/{reviewId}/approve")
    fun approve(@AuthenticationPrincipal principal: AuthenticatedUserPrincipal, @PathVariable reviewId: String, @RequestBody request: ReviewDecisionRequest): Mono<ApiSuccessResponse<ReviewDecisionResponse>> {
        return service.approve(principal, reviewId, request).map { ApiSuccessResponse(message = "Review approved", data = it) }
    }

    @PostMapping("/{reviewId}/hold")
    fun hold(@AuthenticationPrincipal principal: AuthenticatedUserPrincipal, @PathVariable reviewId: String, @RequestBody request: ReviewDecisionRequest): Mono<ApiSuccessResponse<ReviewDecisionResponse>> {
        return service.hold(principal, reviewId, request).map { ApiSuccessResponse(message = "Review put on hold", data = it) }
    }

    @PostMapping("/{reviewId}/reject")
    fun reject(@AuthenticationPrincipal principal: AuthenticatedUserPrincipal, @PathVariable reviewId: String, @RequestBody request: ReviewDecisionRequest): Mono<ApiSuccessResponse<ReviewDecisionResponse>> {
        return service.reject(principal, reviewId, request).map { ApiSuccessResponse(message = "Review rejected", data = it) }
    }
}
