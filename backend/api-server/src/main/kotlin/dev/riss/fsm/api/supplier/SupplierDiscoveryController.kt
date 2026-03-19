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

    @GetMapping("/{supplierId}")
    @Operation(summary = "Get supplier detail", description = "Returns supplier detail read model")
    fun detail(@PathVariable supplierId: String): Mono<ApiSuccessResponse<Map<String, Any?>>> {
        return supplierQueryService.detail(supplierId)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found")))
            .map {
                ApiSuccessResponse(
                    message = "Success",
                    data = mapOf(
                        "profileId" to it.profileId,
                        "companyName" to it.companyName,
                        "representativeName" to it.representativeName,
                        "region" to it.region,
                        "categories" to it.categories,
                        "equipmentSummary" to it.equipmentSummary,
                        "monthlyCapacity" to it.monthlyCapacity,
                        "moq" to it.moq,
                        "oemAvailable" to it.oemAvailable,
                        "odmAvailable" to it.odmAvailable,
                        "rawMaterialSupport" to it.rawMaterialSupport,
                        "packagingLabelingSupport" to it.packagingLabelingSupport,
                        "introduction" to it.introduction,
                        "verificationState" to it.verificationState,
                        "exposureState" to it.exposureState,
                        "certifications" to it.certifications,
                    )
                )
            }
    }
}
