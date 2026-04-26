package dev.riss.fsm.api.quote

import dev.riss.fsm.api.request.RequestAccessGuard
import dev.riss.fsm.shared.api.ApiSuccessResponse
import dev.riss.fsm.shared.auth.UserRole
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/api/supplier/quotes")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "supplier-quotes", description = "Supplier quote management APIs")
class SupplierQuoteController(
    private val quoteQueryService: QuoteQueryService,
    private val requestAccessGuard: RequestAccessGuard,
) {
    @GetMapping
    @Operation(summary = "List my quotes", description = "Get the current supplier's submitted quotes")
    fun list(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): Mono<ApiSuccessResponse<List<SupplierQuoteListItem>>> {
        if (principal.role != UserRole.SUPPLIER) {
            return Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Supplier role required"))
        }
        return requestAccessGuard.getSupplierProfileId(principal.userId)
            .flatMap { supplierProfileId -> quoteQueryService.listForSupplier(supplierProfileId, page, size) }
            .map { pageResponse -> ApiSuccessResponse(message = "Success", data = pageResponse.items, meta = pageResponse.meta) }
    }
}
