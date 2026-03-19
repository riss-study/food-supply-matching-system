package dev.riss.fsm.api.request

import dev.riss.fsm.shared.api.ApiSuccessResponse
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/requests")
@Tag(name = "requests")
@SecurityRequirement(name = "bearerAuth")
class RequestController(
    private val requestApplicationService: RequestApplicationService,
) {
    @PostMapping
    @Operation(summary = "Create request", description = "Create a requester request. Requires approved requester business profile.")
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
}
