package dev.riss.fsm.api.supplier

import dev.riss.fsm.query.supplier.SupplierQueryService
import dev.riss.fsm.query.supplier.SupplierSearchQuery
import dev.riss.fsm.shared.api.ApiSuccessResponse
import dev.riss.fsm.shared.api.PaginationMeta
import io.swagger.v3.oas.annotations.Operation
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
) {
    @GetMapping
    @Operation(summary = "List approved suppliers", description = "Returns approved and visible supplier search view entries")
    fun list(
        @RequestParam(required = false) keyword: String?,
        @RequestParam(required = false) category: String?,
        @RequestParam(required = false) region: String?,
        @RequestParam(required = false) oem: Boolean?,
        @RequestParam(required = false) odm: Boolean?,
        @RequestParam(required = false) minCapacity: Int?,
        @RequestParam(required = false) maxMoq: Int?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
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
    fun detail(@PathVariable supplierId: String): Mono<ApiSuccessResponse<SupplierDetailResponse>> {
        return supplierQueryService.detail(supplierId)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found")))
            .map {
                ApiSuccessResponse(
                    message = "Success",
                    data = SupplierDetailResponse(
                        profileId = it.profileId,
                        companyName = it.companyName,
                        representativeName = it.representativeName,
                        region = it.region,
                        categories = it.categories,
                        equipmentSummary = it.equipmentSummary,
                        monthlyCapacity = it.monthlyCapacity,
                        moq = it.moq,
                        oemAvailable = it.oemAvailable,
                        odmAvailable = it.odmAvailable,
                        rawMaterialSupport = it.rawMaterialSupport,
                        packagingLabelingSupport = it.packagingLabelingSupport,
                        introduction = it.introduction,
                        verificationState = it.verificationState,
                        logoUrl = it.logoUrl,
                        certifications = it.certifications.map { cert ->
                            SupplierCertificationSummaryResponse(
                                type = cert.type,
                                number = cert.number,
                                valid = cert.valid,
                            )
                        },
                        portfolioImages = it.portfolioImages.map { image ->
                            SupplierPortfolioImageResponse(
                                imageId = image.imageId,
                                url = image.url,
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
