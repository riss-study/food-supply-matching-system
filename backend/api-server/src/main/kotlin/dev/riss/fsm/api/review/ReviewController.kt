package dev.riss.fsm.api.review

import dev.riss.fsm.shared.api.ApiSuccessResponse
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Mono

@RestController
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "reviews", description = "Supplier review lifecycle for requesters")
class ReviewController(
    private val reviewApplicationService: ReviewApplicationService,
    private val reviewQueryService: ReviewQueryService,
) {
    @PostMapping("/api/reviews")
    @Operation(summary = "Create review", description = "요청자가 완료된 거래 공급자에 대해 리뷰 작성 (쌍당 1회)")
    fun create(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @Valid @RequestBody request: CreateReviewRequest,
    ): Mono<ResponseEntity<ApiSuccessResponse<CreateReviewResponse>>> {
        return reviewApplicationService.create(principal, request)
            .map { response ->
                ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiSuccessResponse(message = "Review created", data = response))
            }
    }

    @PatchMapping("/api/reviews/{reviewId}")
    @Operation(summary = "Update review", description = "작성 후 7일 이내, hidden 아님, 본인만 수정")
    fun update(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @PathVariable reviewId: String,
        @Valid @RequestBody request: UpdateReviewRequest,
    ): Mono<ApiSuccessResponse<UpdateReviewResponse>> {
        return reviewApplicationService.update(principal, reviewId, request)
            .map { response -> ApiSuccessResponse(message = "Review updated", data = response) }
    }

    @GetMapping("/api/reviews/eligibility")
    @Operation(summary = "Check review eligibility", description = "작성 가능 여부 + 불가 사유 반환")
    fun eligibility(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @RequestParam requestId: String,
        @RequestParam supplierId: String,
    ): Mono<ApiSuccessResponse<EligibilityResponse>> {
        return reviewQueryService.checkEligibility(principal, requestId, supplierId)
            .map { response -> ApiSuccessResponse(message = "Eligibility resolved", data = response) }
    }
}
