package dev.riss.fsm.admin.bootstrap

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ServerWebExchange

@RestController
class AdminSwaggerUiController {

    @GetMapping("/swagger-ui.html")
    fun redirect(exchange: ServerWebExchange) {
        exchange.response.statusCode = HttpStatus.FOUND
        exchange.response.headers.location = exchange.request.uri.resolve("/webjars/swagger-ui/index.html?configUrl=/v3/api-docs/swagger-config")
    }
}
