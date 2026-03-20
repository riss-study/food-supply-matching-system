package dev.riss.fsm.api.request

import dev.riss.fsm.shared.api.ApiSuccessResponse
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
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
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/requests")
@Tag(name = "requests", description = "Request lifecycle management APIs")
@SecurityRequirement(name = "bearerAuth")
class RequestController(
    private val requestApplicationService: RequestApplicationService,
    private val requestQueryService: RequestQueryService,
) {

    @PostMapping
    @Operation(
        summary = "Create request",
        description = "Create a new request. Requires approved requester business profile."
    )
    fun create(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @Valid @RequestBody request: CreateRequestRequest,
    ): Mono<ResponseEntity<ApiSuccessResponse<CreateRequestResponse>>> {
        return requestApplicationService.create(principal, request)
            .map { response ->
                ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiSuccessResponse(message = "Request created", data = response))
            }
    }

    @GetMapping
    @Operation(
        summary = "List my requests",
        description = "Get list of requests created by the current requester with optional state filter"
    )
    fun list(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @Parameter(description = "Filter by state: draft, open, closed, cancelled")
        @RequestParam state: String?,
        @Parameter(description = "Page number (1-based)")
        @RequestParam(defaultValue = "1") page: Int,
        @Parameter(description = "Page size")
        @RequestParam(defaultValue = "20") size: Int,
    ): Mono<ApiSuccessResponse<List<RequestListItemResponse>>> {
        return requestQueryService.listByRequester(
            requesterUserId = principal.userId,
            state = state,
            page = page,
            size = size,
        ).map { page -> ApiSuccessResponse(message = "Success", data = page.items, meta = page.meta) }
    }

    @GetMapping("/{requestId}")
    @Operation(
        summary = "Get request detail",
        description = "Get detailed information of a specific request. Only accessible by request owner."
    )
    fun get(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @Parameter(description = "Request ID")
        @PathVariable requestId: String,
    ): Mono<ApiSuccessResponse<RequestDetailResponse>> {
        return requestQueryService.getDetail(principal, requestId)
            .map { detail -> ApiSuccessResponse(message = "Success", data = detail) }
    }

    @PatchMapping("/{requestId}")
    @Operation(
        summary = "Update request",
        description = "Update a request. Only allowed in draft or open state. Only request owner can update."
    )
    fun update(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @Parameter(description = "Request ID")
        @PathVariable requestId: String,
        @Valid @RequestBody request: UpdateRequestRequest,
    ): Mono<ApiSuccessResponse<UpdateRequestResponse>> {
        return requestApplicationService.update(principal, requestId, request)
            .map { response -> ApiSuccessResponse(message = "Request updated", data = response) }
    }

    @PostMapping("/{requestId}/publish")
    @Operation(
        summary = "Publish request",
        description = "Publish a draft request so suppliers can see it. Only request owner can publish."
    )
    fun publish(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @Parameter(description = "Request ID")
        @PathVariable requestId: String,
    ): Mono<ApiSuccessResponse<PublishRequestResponse>> {
        return requestApplicationService.publish(principal, requestId)
            .map { response -> ApiSuccessResponse(message = "Request published", data = response) }
    }

    @PostMapping("/{requestId}/close")
    @Operation(
        summary = "Close request",
        description = "Close an open request. Only request owner can close."
    )
    fun close(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @Parameter(description = "Request ID")
        @PathVariable requestId: String,
    ): Mono<ApiSuccessResponse<CloseRequestResponse>> {
        return requestApplicationService.close(principal, requestId)
            .map { response -> ApiSuccessResponse(message = "Request closed", data = response) }
    }

    @PostMapping("/{requestId}/cancel")
    @Operation(
        summary = "Cancel request",
        description = "Cancel a draft or open request. Only request owner can cancel."
    )
    fun cancel(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @Parameter(description = "Request ID")
        @PathVariable requestId: String,
        @RequestBody request: CancelRequestRequest?,
    ): Mono<ApiSuccessResponse<CancelRequestResponse>> {
        return requestApplicationService.cancel(principal, requestId, request)
            .map { response -> ApiSuccessResponse(message = "Request cancelled", data = response) }
    }
}
