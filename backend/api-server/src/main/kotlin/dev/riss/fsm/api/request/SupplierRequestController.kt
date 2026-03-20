package dev.riss.fsm.api.request

import dev.riss.fsm.shared.api.ApiSuccessResponse
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Mono
import java.time.Instant
import dev.riss.fsm.shared.api.PaginationMeta

data class SupplierRequestFeedItem(
    val requestId: String,
    val requesterBusinessName: String,
    val title: String,
    val category: String,
    val desiredVolume: Int,
    val targetPriceRange: PriceRangeDto?,
    val certificationRequirement: List<String>?,
    val mode: String,
    val hasQuoted: Boolean,
    val createdAt: Instant,
)

data class PriceRangeDto(
    val min: Int,
    val max: Int,
)

data class SupplierRequestFeedPage(
    val items: List<SupplierRequestFeedItem>,
    val page: Int,
    val size: Int,
    val totalElements: Int,
    val totalPages: Int,
    val hasNext: Boolean,
    val hasPrev: Boolean,
)

data class SupplierRequestDetail(
    val requestId: String,
    val mode: String,
    val title: String,
    val category: String,
    val desiredVolume: Int,
    val targetPriceRange: PriceRangeDto?,
    val certificationRequirement: List<String>?,
    val rawMaterialRule: String?,
    val packagingRequirement: String?,
    val deliveryRequirement: String?,
    val notes: String?,
    val state: String,
    val requesterBusinessName: String,
    val hasQuoted: Boolean,
    val createdAt: Instant,
)

@RestController
@RequestMapping("/api/supplier/requests")
@Tag(name = "supplier-requests", description = "Supplier request feed APIs")
@SecurityRequirement(name = "bearerAuth")
class SupplierRequestController(
    private val supplierRequestService: SupplierRequestService,
    private val requestAccessGuard: RequestAccessGuard,
    private val requestQueryService: RequestQueryService,
) {

    @GetMapping
    @Operation(
        summary = "Get supplier request feed",
        description = "Get list of requests visible to the supplier (public open requests + targeted requests where supplier is selected)"
    )
    fun getFeed(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @Parameter(description = "Filter by category")
        @RequestParam category: String?,
        @Parameter(description = "Page number (1-based)")
        @RequestParam(defaultValue = "1") page: Int,
        @Parameter(description = "Page size")
        @RequestParam(defaultValue = "20") size: Int,
    ): Mono<ApiSuccessResponse<List<SupplierRequestFeedItem>>> {
        return supplierRequestService.getFeed(
            supplierUserId = principal.userId,
            category = category,
            page = page,
            size = size,
        ).map { result ->
            ApiSuccessResponse(
                message = "Success",
                data = result.items,
                meta = PaginationMeta(
                    page = result.page,
                    size = result.size,
                    totalElements = result.totalElements.toLong(),
                    totalPages = result.totalPages,
                    hasNext = result.hasNext,
                    hasPrev = result.hasPrev,
                ),
            )
        }
    }

    @GetMapping("/{requestId}")
    @Operation(
        summary = "Get request detail (supplier view)",
        description = "Get detailed information of a request accessible to the supplier"
    )
    fun getDetail(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @Parameter(description = "Request ID")
        @PathVariable requestId: String,
    ): Mono<ApiSuccessResponse<SupplierRequestDetail>> {
        return requestAccessGuard.checkRequestAccess(principal, requestId)
            .flatMap { request ->
                supplierRequestService.getDetail(
                    supplierUserId = principal.userId,
                    request = request,
                )
            }
            .map { detail -> ApiSuccessResponse(message = "Success", data = detail) }
    }
}
