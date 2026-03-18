package dev.riss.fsm.shared.api

data class ApiErrorResponse(
    val code: Int,
    val message: String,
    val errors: List<ApiErrorDetail> = emptyList(),
    val traceId: String? = null,
)

data class ApiErrorDetail(
    val field: String? = null,
    val message: String,
    val reason: String? = null,
    val rejectedValue: String? = null,
)
