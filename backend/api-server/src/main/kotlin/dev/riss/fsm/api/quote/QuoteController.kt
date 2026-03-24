package dev.riss.fsm.api.quote

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
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "quotes", description = "Quote lifecycle and comparison APIs")
class QuoteController(
    private val quoteApplicationService: QuoteApplicationService,
    private val quoteQueryService: QuoteQueryService,
) {
    @PostMapping("/api/requests/{requestId}/quotes")
    @Operation(summary = "Submit quote", description = "Submit a quote for an open request")
    fun submit(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @PathVariable requestId: String,
        @Valid @RequestBody request: SubmitQuoteRequest,
    ): Mono<ResponseEntity<ApiSuccessResponse<SubmitQuoteResponse>>> {
        return quoteApplicationService.submit(principal, requestId, request)
            .map { response ->
                ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiSuccessResponse(message = "Quote submitted", data = response))
            }
    }

    @GetMapping("/api/requests/{requestId}/quotes")
    @Operation(summary = "List request quotes", description = "Get quotes for a request owned by the current requester")
    fun listForRequest(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @PathVariable requestId: String,
        @RequestParam state: String?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam sort: String?,
        @RequestParam order: String?,
    ): Mono<ApiSuccessResponse<List<RequestQuoteListItem>>> {
        return quoteQueryService.listForRequest(requestId, principal.userId, state, page, size, sort, order)
            .map { pageResponse -> ApiSuccessResponse(message = "Success", data = pageResponse.items, meta = pageResponse.meta) }
    }

    @PatchMapping("/api/quotes/{quoteId}")
    @Operation(summary = "Update quote", description = "Update a submitted quote")
    fun update(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @Parameter(description = "Quote ID") @PathVariable quoteId: String,
        @Valid @RequestBody request: UpdateQuoteRequest,
    ): Mono<ApiSuccessResponse<UpdateQuoteResponse>> {
        return quoteApplicationService.update(principal, quoteId, request)
            .map { response -> ApiSuccessResponse(message = "Quote updated", data = response) }
    }

    @PostMapping("/api/quotes/{quoteId}/withdraw")
    @Operation(summary = "Withdraw quote", description = "Withdraw a submitted quote")
    fun withdraw(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @PathVariable quoteId: String,
    ): Mono<ApiSuccessResponse<WithdrawQuoteResponse>> {
        return quoteApplicationService.withdraw(principal, quoteId)
            .map { response -> ApiSuccessResponse(message = "Quote withdrawn", data = response) }
    }

    @PostMapping("/api/quotes/{quoteId}/select")
    @Operation(summary = "Select quote", description = "Select a quote and close the request")
    fun select(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @PathVariable quoteId: String,
    ): Mono<ApiSuccessResponse<SelectQuoteResponse>> {
        return quoteApplicationService.select(principal, quoteId)
            .map { response -> ApiSuccessResponse(message = "Quote selected", data = response) }
    }

    @PostMapping("/api/quotes/{quoteId}/decline")
    @Operation(summary = "Decline quote", description = "Decline a submitted quote")
    fun decline(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @PathVariable quoteId: String,
        @Valid @RequestBody request: DeclineQuoteRequest?,
    ): Mono<ApiSuccessResponse<DeclineQuoteResponse>> {
        return quoteApplicationService.decline(principal, quoteId, request)
            .map { response -> ApiSuccessResponse(message = "Quote declined", data = response) }
    }
}
