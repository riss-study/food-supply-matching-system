package dev.riss.fsm.admin.supplierreview

import dev.riss.fsm.shared.api.ApiSuccessResponse
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Mono

@RestController
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "admin-supplier-reviews", description = "Admin moderation for requester-submitted supplier reviews")
class SupplierReviewModerationController(
    private val moderationService: SupplierReviewModerationApplicationService,
    private val queryService: SupplierReviewModerationQueryService,
) {
    @org.springframework.web.bind.annotation.GetMapping("/api/admin/supplier-reviews")
    @Operation(summary = "List supplier reviews (admin)", description = "모더레이션 대상 리뷰 목록. hidden 포함. 필터: hidden=true|false|all, supplierId. §2.7 페이지네이션.")
    fun list(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @org.springframework.web.bind.annotation.RequestParam(required = false) hidden: String?,
        @org.springframework.web.bind.annotation.RequestParam(required = false) supplierId: String?,
        @org.springframework.web.bind.annotation.RequestParam(defaultValue = "1") page: Int,
        @org.springframework.web.bind.annotation.RequestParam(defaultValue = "20") size: Int,
        @org.springframework.web.bind.annotation.RequestParam(required = false) sort: String?,
        @org.springframework.web.bind.annotation.RequestParam(required = false) order: String?,
    ): Mono<ApiSuccessResponse<List<AdminSupplierReviewListItem>>> =
        moderationService.ensureAdminAccess(principal).then(
            queryService.list(hidden, supplierId, page, size, order)
                .map { pageResponse ->
                    ApiSuccessResponse(
                        message = "Admin reviews listed",
                        data = pageResponse.items,
                        meta = pageResponse.meta,
                    )
                }
        )

    @PostMapping("/api/admin/supplier-reviews/{reviewId}/hide")
    @Operation(summary = "Hide supplier review", description = "리뷰를 숨김 처리. hidden 리뷰는 공개 목록/ratingAvg 에서 제외. 멱등.")
    fun hide(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @PathVariable reviewId: String,
    ): Mono<ApiSuccessResponse<SupplierReviewModerationResponse>> =
        moderationService.hide(principal, reviewId)
            .map { response -> ApiSuccessResponse(message = "Review hidden", data = response) }

    @PostMapping("/api/admin/supplier-reviews/{reviewId}/unhide")
    @Operation(summary = "Unhide supplier review", description = "숨김 해제. 멱등.")
    fun unhide(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @PathVariable reviewId: String,
    ): Mono<ApiSuccessResponse<SupplierReviewModerationResponse>> =
        moderationService.unhide(principal, reviewId)
            .map { response -> ApiSuccessResponse(message = "Review unhidden", data = response) }
}
