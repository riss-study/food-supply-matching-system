package dev.riss.fsm.api.requester

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
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/requester/business-profile")
@Tag(name = "requester-business-profile")
@SecurityRequirement(name = "bearerAuth")
class RequesterBusinessProfileController(
    private val service: RequesterBusinessProfileApplicationService,
) {

    @PostMapping
    @Operation(summary = "Submit requester business profile", description = "Submit requester business profile to enter the approval gate")
    fun submit(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @Valid @RequestBody request: SubmitRequesterBusinessProfileRequest,
    ): Mono<ResponseEntity<ApiSuccessResponse<RequesterBusinessProfileSubmitResponse>>> {
        return service.submit(principal, request)
            .map { response ->
                ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiSuccessResponse(message = "Business profile submitted", data = response))
            }
    }

    @GetMapping
    @Operation(summary = "Get requester business profile", description = "Get the current requester business profile")
    fun get(@AuthenticationPrincipal principal: AuthenticatedUserPrincipal): Mono<ApiSuccessResponse<RequesterBusinessProfileResponse>> {
        return service.get(principal)
            .map { response -> ApiSuccessResponse(message = "Success", data = response) }
    }

    @PatchMapping
    @Operation(summary = "Update requester business profile", description = "Update the requester business profile in submitted/rejected states")
    fun update(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @RequestBody request: UpdateRequesterBusinessProfileRequest,
    ): Mono<ApiSuccessResponse<RequesterBusinessProfileResponse>> {
        return service.update(principal, request)
            .map { response -> ApiSuccessResponse(message = "Profile updated", data = response) }
    }
}
