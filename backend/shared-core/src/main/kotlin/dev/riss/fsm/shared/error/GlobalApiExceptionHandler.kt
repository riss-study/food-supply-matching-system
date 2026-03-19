package dev.riss.fsm.shared.error

import dev.riss.fsm.shared.api.ApiErrorDetail
import dev.riss.fsm.shared.api.ApiErrorResponse
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.validation.FieldError
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.bind.support.WebExchangeBindException
import org.springframework.web.server.ResponseStatusException

@RestControllerAdvice
class GlobalApiExceptionHandler {

    @ExceptionHandler(BusinessApprovalRequiredException::class)
    fun handleBusinessApprovalRequired(exception: BusinessApprovalRequiredException): ResponseEntity<ApiErrorResponse> {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            ApiErrorResponse(
                code = 4034,
                message = exception.message ?: "Business approval required",
            )
        )
    }

    @ExceptionHandler(WebExchangeBindException::class)
    fun handleValidation(exception: WebExchangeBindException): ResponseEntity<ApiErrorResponse> {
        val details = exception.bindingResult.allErrors.map { error ->
            val field = (error as? FieldError)?.field
            ApiErrorDetail(
                field = field,
                message = error.defaultMessage ?: "Validation failed",
                reason = error.code,
                rejectedValue = (error as? FieldError)?.rejectedValue?.toString(),
            )
        }

        return ResponseEntity.badRequest().body(
            ApiErrorResponse(
                code = 4000,
                message = "Validation failed",
                errors = details,
            )
        )
    }

    @ExceptionHandler(ResponseStatusException::class)
    fun handleResponseStatus(exception: ResponseStatusException): ResponseEntity<ApiErrorResponse> {
        return ResponseEntity.status(exception.statusCode).body(
            ApiErrorResponse(
                code = exception.statusCode.value() * 10,
                message = exception.reason ?: exception.statusCode.toString(),
            )
        )
    }

    @ExceptionHandler(Exception::class)
    fun handleGeneric(exception: Exception): ResponseEntity<ApiErrorResponse> {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            ApiErrorResponse(
                code = 5000,
                message = exception.message ?: "Internal server error",
            )
        )
    }
}
