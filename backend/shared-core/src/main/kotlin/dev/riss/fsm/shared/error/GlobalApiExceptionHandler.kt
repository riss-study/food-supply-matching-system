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

    @ExceptionHandler(QuoteSubmissionForbiddenException::class)
    fun handleQuoteSubmissionForbidden(exception: QuoteSubmissionForbiddenException): ResponseEntity<ApiErrorResponse> {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            ApiErrorResponse(
                code = 4037,
                message = exception.message ?: "Quote submission is forbidden",
            )
        )
    }

    @ExceptionHandler(QuoteUpdateForbiddenException::class)
    fun handleQuoteUpdateForbidden(exception: QuoteUpdateForbiddenException): ResponseEntity<ApiErrorResponse> {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            ApiErrorResponse(
                code = 4038,
                message = exception.message ?: "Quote update is forbidden",
            )
        )
    }

    @ExceptionHandler(DuplicateActiveQuoteException::class)
    fun handleDuplicateActiveQuote(exception: DuplicateActiveQuoteException): ResponseEntity<ApiErrorResponse> {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
            ApiErrorResponse(
                code = 4095,
                message = exception.message ?: "Active quote already exists",
            )
        )
    }

    @ExceptionHandler(ThreadNotFoundException::class)
    fun handleThreadNotFound(exception: ThreadNotFoundException): ResponseEntity<ApiErrorResponse> {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            ApiErrorResponse(
                code = 4041,
                message = exception.message ?: "Thread not found",
            )
        )
    }

    @ExceptionHandler(ThreadAccessDeniedException::class)
    fun handleThreadAccessDenied(exception: ThreadAccessDeniedException): ResponseEntity<ApiErrorResponse> {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            ApiErrorResponse(
                code = 4039,
                message = exception.message ?: "Access denied to this thread",
            )
        )
    }

    @ExceptionHandler(ContactShareAlreadyRequestedException::class)
    fun handleContactShareAlreadyRequested(exception: ContactShareAlreadyRequestedException): ResponseEntity<ApiErrorResponse> {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
            ApiErrorResponse(
                code = 4096,
                message = exception.message ?: "Contact share request is already in progress",
            )
        )
    }

    @ExceptionHandler(ContactShareApprovalConflictException::class)
    fun handleContactShareApprovalConflict(exception: ContactShareApprovalConflictException): ResponseEntity<ApiErrorResponse> {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
            ApiErrorResponse(
                code = 4097,
                message = exception.message ?: "Contact share approval is not allowed in the current state",
            )
        )
    }

    @ExceptionHandler(ContactShareNotRequestedException::class)
    fun handleContactShareNotRequested(exception: ContactShareNotRequestedException): ResponseEntity<ApiErrorResponse> {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
            ApiErrorResponse(
                code = 4098,
                message = exception.message ?: "Contact share has not been requested",
            )
        )
    }

    @ExceptionHandler(ContactShareRevokeForbiddenException::class)
    fun handleContactShareRevokeForbidden(exception: ContactShareRevokeForbiddenException): ResponseEntity<ApiErrorResponse> {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
            ApiErrorResponse(
                code = 4099,
                message = exception.message ?: "Contact share cannot be revoked after mutual approval",
            )
        )
    }

    // ---- Request domain ----
    @ExceptionHandler(RequestNotFoundException::class)
    fun handleRequestNotFound(exception: RequestNotFoundException): ResponseEntity<ApiErrorResponse> =
        ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            ApiErrorResponse(code = 4041, message = exception.message ?: "Request not found")
        )

    @ExceptionHandler(RequestAccessForbiddenException::class)
    fun handleRequestAccessForbidden(exception: RequestAccessForbiddenException): ResponseEntity<ApiErrorResponse> =
        ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            ApiErrorResponse(code = 4035, message = exception.message ?: "Not the request owner")
        )

    @ExceptionHandler(RequestStateTransitionException::class)
    fun handleRequestStateTransition(exception: RequestStateTransitionException): ResponseEntity<ApiErrorResponse> =
        ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            ApiErrorResponse(code = 4035, message = exception.message ?: "Invalid request state")
        )

    // ---- Quote ownership ----
    @ExceptionHandler(QuoteNotFoundException::class)
    fun handleQuoteNotFound(exception: QuoteNotFoundException): ResponseEntity<ApiErrorResponse> =
        ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            ApiErrorResponse(code = 4041, message = exception.message ?: "Quote not found")
        )

    @ExceptionHandler(QuoteOwnerMismatchException::class)
    fun handleQuoteOwnerMismatch(exception: QuoteOwnerMismatchException): ResponseEntity<ApiErrorResponse> =
        ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            ApiErrorResponse(code = 4035, message = exception.message ?: "Not the quote owner")
        )

    // ---- Supplier profile ----
    @ExceptionHandler(SupplierProfileAlreadyExistsException::class)
    fun handleSupplierProfileAlreadyExists(exception: SupplierProfileAlreadyExistsException): ResponseEntity<ApiErrorResponse> =
        ResponseEntity.status(HttpStatus.CONFLICT).body(
            ApiErrorResponse(code = 4092, message = exception.message ?: "Supplier profile already exists")
        )

    @ExceptionHandler(SupplierProfileNotFoundException::class)
    fun handleSupplierProfileNotFound(exception: SupplierProfileNotFoundException): ResponseEntity<ApiErrorResponse> =
        ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            ApiErrorResponse(code = 4041, message = exception.message ?: "Supplier profile not found")
        )

    @ExceptionHandler(ApprovedSupplierProfileImmutableException::class)
    fun handleApprovedSupplierProfileImmutable(exception: ApprovedSupplierProfileImmutableException): ResponseEntity<ApiErrorResponse> =
        ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            ApiErrorResponse(code = 4033, message = exception.message ?: "Cannot modify approved supplier")
        )

    @ExceptionHandler(SupplierProfileStateImmutableException::class)
    fun handleSupplierProfileStateImmutable(exception: SupplierProfileStateImmutableException): ResponseEntity<ApiErrorResponse> =
        ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(
            ApiErrorResponse(code = 4221, message = exception.message ?: "Profile not editable in current state")
        )

    // ---- Business profile ----
    @ExceptionHandler(BusinessProfileNotFoundException::class)
    fun handleBusinessProfileNotFound(exception: BusinessProfileNotFoundException): ResponseEntity<ApiErrorResponse> =
        ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            ApiErrorResponse(code = 4041, message = exception.message ?: "Business profile not found")
        )

    @ExceptionHandler(BusinessProfileAlreadySubmittedException::class)
    fun handleBusinessProfileAlreadySubmitted(exception: BusinessProfileAlreadySubmittedException): ResponseEntity<ApiErrorResponse> =
        ResponseEntity.status(HttpStatus.CONFLICT).body(
            ApiErrorResponse(code = 4093, message = exception.message ?: "Business profile already submitted or approved")
        )

    @ExceptionHandler(ApprovedBusinessProfileImmutableException::class)
    fun handleApprovedBusinessProfileImmutable(exception: ApprovedBusinessProfileImmutableException): ResponseEntity<ApiErrorResponse> =
        ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            ApiErrorResponse(code = 4032, message = exception.message ?: "Cannot modify approved profile")
        )

    @ExceptionHandler(BusinessProfilePartialUpdateNotAllowedException::class)
    fun handleBusinessProfilePartialUpdateNotAllowed(exception: BusinessProfilePartialUpdateNotAllowedException): ResponseEntity<ApiErrorResponse> =
        ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(
            ApiErrorResponse(code = 4223, message = exception.message ?: "Partial update not allowed")
        )

    // ---- Auth ----
    @ExceptionHandler(EmailAlreadyExistsException::class)
    fun handleEmailAlreadyExists(exception: EmailAlreadyExistsException): ResponseEntity<ApiErrorResponse> =
        ResponseEntity.status(HttpStatus.CONFLICT).body(
            ApiErrorResponse(code = 4091, message = exception.message ?: "Email already exists")
        )

    @ExceptionHandler(InvalidCredentialsException::class)
    fun handleInvalidCredentials(exception: InvalidCredentialsException): ResponseEntity<ApiErrorResponse> =
        ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
            ApiErrorResponse(code = 4011, message = exception.message ?: "Invalid credentials")
        )

    @ExceptionHandler(PasswordEncodingException::class)
    fun handlePasswordEncoding(exception: PasswordEncodingException): ResponseEntity<ApiErrorResponse> =
        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            ApiErrorResponse(code = 5001, message = exception.message ?: "Password encoding failed")
        )

    // ---- Thread message ----
    @ExceptionHandler(MessageContentRequiredException::class)
    fun handleMessageContentRequired(exception: MessageContentRequiredException): ResponseEntity<ApiErrorResponse> =
        ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ApiErrorResponse(code = 4004, message = exception.message ?: "Message body or attachmentIds is required")
        )

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
