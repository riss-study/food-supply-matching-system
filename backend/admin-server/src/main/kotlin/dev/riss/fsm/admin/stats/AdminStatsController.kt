package dev.riss.fsm.admin.stats

import dev.riss.fsm.shared.api.ApiSuccessResponse
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Mono
import java.time.LocalDate

@RestController
@RequestMapping("/api/admin/stats")
@Tag(name = "admin-stats", description = "Admin statistics APIs")
@SecurityRequirement(name = "bearerAuth")
class AdminStatsController(
    private val adminStatsApplicationService: AdminStatsApplicationService,
) {
    @GetMapping("/summary")
    @Operation(summary = "Get summary stats", description = "Get admin dashboard summary statistics")
    fun summary(
        @AuthenticationPrincipal principal: AuthenticatedUserPrincipal,
        @Parameter(description = "Optional from date filter")
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        fromDate: LocalDate?,
        @Parameter(description = "Optional to date filter")
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        toDate: LocalDate?,
    ): Mono<ApiSuccessResponse<AdminStatsSummaryResponse>> {
        return adminStatsApplicationService.getStatsSummary(principal, fromDate, toDate)
            .map { ApiSuccessResponse(message = "Success", data = it) }
    }
}
