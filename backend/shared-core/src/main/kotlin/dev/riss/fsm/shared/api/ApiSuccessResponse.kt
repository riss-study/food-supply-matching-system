package dev.riss.fsm.shared.api

data class ApiSuccessResponse<T>(
    val code: Int = 100,
    val message: String = "OK",
    val data: T,
    val meta: PaginationMeta? = null,
)

data class PaginationMeta(
    val page: Int? = null,
    val size: Int? = null,
    val totalElements: Long? = null,
    val totalPages: Int? = null,
)
