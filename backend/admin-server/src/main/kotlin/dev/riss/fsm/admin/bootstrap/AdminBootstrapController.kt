package dev.riss.fsm.admin.bootstrap

import dev.riss.fsm.shared.api.ApiSuccessResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/bootstrap")
@Tag(name = "admin-bootstrap")
class AdminBootstrapController {

    @GetMapping("/health")
    @Operation(summary = "Admin foundation health", description = "Task 01 bootstrap readiness endpoint for admin-server")
    fun health(): ApiSuccessResponse<Map<String, String>> {
        return ApiSuccessResponse(
            data = mapOf(
                "service" to "admin-server",
                "status" to "UP",
                "mode" to "foundation"
            )
        )
    }
}
