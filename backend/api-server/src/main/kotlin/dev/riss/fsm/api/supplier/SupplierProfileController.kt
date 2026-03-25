package dev.riss.fsm.api.supplier

import dev.riss.fsm.shared.api.ApiSuccessResponse
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.http.codec.multipart.FilePart
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/supplier")
@Tag(name = "supplier-profile")
@SecurityRequirement(name = "bearerAuth")
class SupplierProfileController(
    private val service: SupplierProfileApplicationService,
) {

    @PostMapping("/profile")
    @Operation(summary = "Create supplier profile", description = "Create supplier profile in draft state")
    fun create(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @Valid @RequestBody request: CreateSupplierProfileRequest,
    ): Mono<ResponseEntity<ApiSuccessResponse<SupplierProfileResponse>>> {
        return service.create(principal, request)
            .map { ResponseEntity.status(HttpStatus.CREATED).body(ApiSuccessResponse(message = "Supplier profile created", data = it)) }
    }

    @GetMapping("/profile")
    @Operation(summary = "Get supplier profile", description = "Get current supplier profile")
    fun get(@AuthenticationPrincipal principal: AuthenticatedUserPrincipal): Mono<ApiSuccessResponse<SupplierProfileResponse>> {
        return service.get(principal).map { ApiSuccessResponse(message = "Success", data = it) }
    }

    @PatchMapping("/profile")
    @Operation(summary = "Update supplier profile", description = "Update supplier profile in draft/hold/rejected states")
    fun update(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @Valid @RequestBody request: UpdateSupplierProfileRequest,
    ): Mono<ApiSuccessResponse<SupplierProfileResponse>> {
        return service.update(principal, request).map { ApiSuccessResponse(message = "Profile updated", data = it) }
    }

    @PostMapping("/verification-submissions", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @Operation(summary = "Submit verification files", description = "Submit supplier verification package")
    fun submitVerification(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @RequestPart("businessRegistrationDoc") businessRegistrationDoc: FilePart,
        @RequestPart("certifications", required = false) certifications: Flux<FilePart>?,
        @RequestPart("portfolioImages", required = false) portfolioImages: Flux<FilePart>?,
    ): Mono<ResponseEntity<ApiSuccessResponse<VerificationSubmissionResponse>>> {
        val certificationListMono = certifications?.collectList() ?: Mono.just(emptyList())
        val portfolioListMono = portfolioImages?.collectList() ?: Mono.just(emptyList())

        return Mono.zip(certificationListMono, portfolioListMono)
            .flatMap { tuple ->
                service.submitVerification(
                    principal,
                    businessRegistrationDoc,
                    tuple.t1,
                    tuple.t2,
                )
            }
            .map { ResponseEntity.status(HttpStatus.CREATED).body(ApiSuccessResponse(message = "Verification submitted", data = it)) }
    }

    @GetMapping("/verification-submissions/latest")
    @Operation(summary = "Get latest verification submission", description = "Get latest verification submission status")
    fun latestVerification(@AuthenticationPrincipal principal: AuthenticatedUserPrincipal): Mono<ApiSuccessResponse<LatestVerificationSubmissionResponse>> {
        return service.latestVerification(principal).map { ApiSuccessResponse(message = "Success", data = it) }
    }
}
