package dev.riss.fsm.api.bootstrap

import dev.riss.fsm.shared.api.ApiSuccessResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/bootstrap")
@Tag(name = "bootstrap")
class ApiBootstrapController {

    @GetMapping("/health")
    @Operation(summary = "API foundation health", description = "Task 01 bootstrap readiness endpoint for api-server")
    fun health(): ApiSuccessResponse<Map<String, String>> {
        return ApiSuccessResponse(
            data = mapOf(
                "service" to "api-server",
                "status" to "UP",
                "mode" to "foundation"
            )
        )
    }
}
