package dev.riss.fsm.shared.security

import dev.riss.fsm.shared.api.ApiErrorResponse
import org.springframework.core.io.buffer.DataBufferFactory
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.web.server.ServerWebExchange
import reactor.core.publisher.Mono
import tools.jackson.module.kotlin.jacksonObjectMapper

object SecurityErrorResponseWriter {
    private val objectMapper = jacksonObjectMapper()

    fun write(exchange: ServerWebExchange, status: HttpStatus, code: Int, message: String): Mono<Void> {
        val response = exchange.response
        response.statusCode = status
        response.headers.contentType = MediaType.APPLICATION_JSON
        val payload = objectMapper.writeValueAsBytes(ApiErrorResponse(code = code, message = message))
        return response.writeWith(Mono.just(toBuffer(response.bufferFactory(), payload)))
    }

    private fun toBuffer(factory: DataBufferFactory, payload: ByteArray) = factory.wrap(payload)
}
