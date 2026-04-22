package dev.riss.fsm.api.supplier

import dev.riss.fsm.api.review.ReviewQueryService
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
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/suppliers")
@Tag(name = "supplier-discovery")
class SupplierDiscoveryController(
    private val supplierQueryService: SupplierQueryService,
    private val reviewQueryService: ReviewQueryService,
) {
    @GetMapping
    @Operation(summary = "List approved suppliers", description = "Returns approved and visible suppliers. 정렬/필터는 MariaDB R2DBC 쿼리로 처리됨.")
    @ApiResponse(
        responseCode = "200",
        description = "Supplier list",
        content = [Content(examples = [ExampleObject(value = "{\"code\":100,\"message\":\"Success\",\"data\":[{\"profileId\":\"sprof_1\",\"companyName\":\"Example Foods\",\"region\":\"수도권\",\"categories\":[\"bakery\"],\"monthlyCapacity\":\"1,000kg\",\"moq\":\"100kg\",\"oemAvailable\":true,\"odmAvailable\":false,\"verificationState\":\"approved\",\"exposureState\":\"visible\",\"logoUrl\":null}],\"meta\":{\"page\":1,\"size\":20,\"totalElements\":8,\"totalPages\":1,\"hasNext\":false,\"hasPrev\":false}}")])]
    )
    fun list(
        @Parameter(description = "Company name keyword")
        @RequestParam(required = false) keyword: String?,
        @Parameter(description = "Category filter")
        @RequestParam(required = false) category: String?,
        @Parameter(description = "Region filter")
        @RequestParam(required = false) region: String?,
        @Parameter(description = "OEM available filter")
        @RequestParam(required = false) oem: Boolean?,
        @Parameter(description = "ODM available filter")
        @RequestParam(required = false) odm: Boolean?,
        @Parameter(description = "Minimum monthly capacity")
        @RequestParam(required = false) minCapacity: Int?,
        @Parameter(description = "Maximum MOQ")
        @RequestParam(required = false) maxMoq: Int?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @Parameter(description = "Sort field: updatedAt, monthlyCapacity, moq, companyName")
        @RequestParam(required = false) sort: String?,
        @Parameter(description = "Sort order: asc or desc")
        @RequestParam(required = false) order: String?,
    ): Mono<ApiSuccessResponse<List<SupplierSearchItemResponse>>> {
        return supplierQueryService.listApproved(
            SupplierSearchQuery(
                keyword = keyword,
                category = category,
                region = region,
                oem = oem,
                odm = odm,
                minCapacity = minCapacity,
                maxMoq = maxMoq,
                page = page,
                size = size,
                sort = sort,
                order = order,
            )
        ).map { result ->
            ApiSuccessResponse(
                message = "Success",
                data = result.items.map {
                    SupplierSearchItemResponse(
                        profileId = it.profileId,
                        companyName = it.companyName,
                        region = it.region,
                        categories = it.categories,
                        monthlyCapacity = it.monthlyCapacity,
                        moq = it.moq,
                        oemAvailable = it.oemAvailable,
                        odmAvailable = it.odmAvailable,
                        verificationState = it.verificationState,
                        exposureState = it.exposureState,
                        logoUrl = it.logoUrl,
                        ratingAvg = it.ratingAvg,
                        ratingCount = it.ratingCount,
                    )
                },
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

    @GetMapping("/{supplierId}")
    @Operation(summary = "Get supplier detail", description = "Returns supplier detail read model")
    @ApiResponses(
        value = [
            ApiResponse(responseCode = "200", description = "Supplier detail"),
            ApiResponse(responseCode = "404", description = "Supplier not found", content = [Content(schema = Schema(ref = "#/components/schemas/ApiErrorResponse"))])
        ]
    )
    fun detail(@PathVariable supplierId: String): Mono<ApiSuccessResponse<SupplierDetailResponse>> {
        val detailMono = supplierQueryService.detail(supplierId)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found")))
        val recentReviewsMono = reviewQueryService.listForSupplier(supplierId, page = 1, size = 3, order = null)
            .map { it.items }
            .onErrorReturn(emptyList())

        return detailMono.zipWith(recentReviewsMono)
            .map { tuple ->
                val doc = tuple.t1
                val recent = tuple.t2
                ApiSuccessResponse(
                    message = "Success",
                    data = SupplierDetailResponse(
                        profileId = doc.profileId,
                        companyName = doc.companyName,
                        representativeName = doc.representativeName,
                        region = doc.region,
                        categories = doc.categories,
                        equipmentSummary = doc.equipmentSummary,
                        monthlyCapacity = doc.monthlyCapacity,
                        moq = doc.moq,
                        oemAvailable = doc.oemAvailable,
                        odmAvailable = doc.odmAvailable,
                        rawMaterialSupport = doc.rawMaterialSupport,
                        packagingLabelingSupport = doc.packagingLabelingSupport,
                        introduction = doc.introduction,
                        verificationState = doc.verificationState,
                        logoUrl = doc.logoUrl,
                        certifications = doc.certifications.map { cert ->
                            SupplierCertificationSummaryResponse(
                                type = cert.type,
                                number = cert.number,
                                valid = cert.valid,
                            )
                        },
                        portfolioImages = doc.portfolioImages.map { image ->
                            SupplierPortfolioImageResponse(
                                imageId = image.imageId,
                                url = image.url,
                            )
                        },
                        ratingAvg = doc.ratingAvg,
                        ratingCount = doc.ratingCount,
                        recentReviews = recent.map { item ->
                            SupplierRecentReviewResponse(
                                reviewId = item.reviewId,
                                rating = item.rating,
                                text = item.text,
                                authorDisplayName = item.authorDisplayName,
                                createdAt = item.createdAt,
                            )
                        },
                    )
                )
            }
    }

    @GetMapping("/categories")
    @Operation(summary = "List supplier categories", description = "Returns category list with supplier counts")
    fun categories(): Mono<ApiSuccessResponse<List<SupplierCategorySummaryResponse>>> {
        return supplierQueryService.categories()
            .map { items ->
                ApiSuccessResponse(
                    message = "Success",
                    data = items.map { SupplierCategorySummaryResponse(category = it.category, supplierCount = it.supplierCount) },
                )
            }
    }

    @GetMapping("/regions")
    @Operation(summary = "List supplier regions", description = "Returns region list with supplier counts")
    fun regions(): Mono<ApiSuccessResponse<List<SupplierRegionSummaryResponse>>> {
        return supplierQueryService.regions()
            .map { items ->
                ApiSuccessResponse(
                    message = "Success",
                    data = items.map { SupplierRegionSummaryResponse(region = it.region, supplierCount = it.supplierCount) },
                )
            }
    }
}
