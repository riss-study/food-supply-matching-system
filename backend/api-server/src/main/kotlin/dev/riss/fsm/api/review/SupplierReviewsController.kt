package dev.riss.fsm.api.review

import dev.riss.fsm.shared.api.ApiSuccessResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Mono

@RestController
@Tag(name = "suppliers", description = "Public supplier review listing")
class SupplierReviewsController(
    private val reviewQueryService: ReviewQueryService,
) {
    @GetMapping("/api/suppliers/{supplierId}/reviews")
    @Operation(summary = "List supplier reviews", description = "공개 리뷰 목록. hidden 은 제외, 작성자 회사명은 마스킹.")
    fun list(
        @PathVariable supplierId: String,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(required = false) sort: String?,
        @RequestParam(required = false) order: String?,
    ): Mono<ApiSuccessResponse<List<ReviewListItem>>> {
        return reviewQueryService.listForSupplier(supplierId, page, size, order)
            .map { pageResponse ->
                ApiSuccessResponse(
                    message = "Reviews listed",
                    data = pageResponse.items,
                    meta = pageResponse.meta,
                )
            }
    }
}
