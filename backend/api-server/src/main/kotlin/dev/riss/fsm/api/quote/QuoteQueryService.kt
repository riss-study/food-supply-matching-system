package dev.riss.fsm.api.quote

import dev.riss.fsm.command.request.RequestRepository
import dev.riss.fsm.query.quote.QuoteComparisonDocument
import dev.riss.fsm.query.quote.QuoteComparisonRepository
import dev.riss.fsm.shared.api.PaginationMeta
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono

data class QuotePageResponse<T>(
    val items: List<T>,
    val meta: PaginationMeta,
)

@Service
class QuoteQueryService(
    private val quoteComparisonRepository: QuoteComparisonRepository,
    private val requestRepository: RequestRepository,
) {
    fun listForRequest(requestId: String, requesterUserId: String, state: String?, page: Int, size: Int, sort: String?, order: String?): Mono<QuotePageResponse<RequestQuoteListItem>> {
        val safePage = page.coerceAtLeast(1)
        val safeSize = size.coerceIn(1, 100)

        return requestRepository.findById(requestId)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found")))
            .flatMap { request ->
                if (request.requesterUserId != requesterUserId) {
                    return@flatMap Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Not the request owner"))
                }

                quoteComparisonRepository.findAllByRequestId(requestId)
                    .filter { document -> state == null || document.state == state }
                    .collectList()
                    .map { documents ->
                        val sorted = sortDocuments(documents, sort, order)
                        val total = sorted.size
                        val totalPages = if (total == 0) 0 else ((total - 1) / safeSize) + 1
                        val from = ((safePage - 1) * safeSize).coerceAtMost(total)
                        val to = (from + safeSize).coerceAtMost(total)
                        val items = sorted.subList(from, to).map { document -> document.toRequestListItem() }
                        QuotePageResponse(
                            items = items,
                            meta = PaginationMeta(
                                page = safePage,
                                size = safeSize,
                                totalElements = total.toLong(),
                                totalPages = totalPages,
                                hasNext = safePage < totalPages,
                                hasPrev = safePage > 1 && totalPages > 0,
                            )
                        )
                    }
            }
    }

    fun listForSupplier(supplierProfileId: String, page: Int, size: Int): Mono<QuotePageResponse<SupplierQuoteListItem>> {
        val safePage = page.coerceAtLeast(1)
        val safeSize = size.coerceIn(1, 100)

        return quoteComparisonRepository.findAllBySupplierProfileId(supplierProfileId)
            .collectList()
            .map { documents ->
                val sorted = documents.sortedByDescending { it.submittedAt }
                val total = sorted.size
                val totalPages = if (total == 0) 0 else ((total - 1) / safeSize) + 1
                val from = ((safePage - 1) * safeSize).coerceAtMost(total)
                val to = (from + safeSize).coerceAtMost(total)
                val items = sorted.subList(from, to).map { document -> document.toSupplierListItem() }
                QuotePageResponse(
                    items = items,
                    meta = PaginationMeta(
                        page = safePage,
                        size = safeSize,
                        totalElements = total.toLong(),
                        totalPages = totalPages,
                        hasNext = safePage < totalPages,
                        hasPrev = safePage > 1 && totalPages > 0,
                    )
                )
            }
    }

    private fun sortDocuments(documents: List<QuoteComparisonDocument>, sort: String?, order: String?): List<QuoteComparisonDocument> {
        val descending = order != "asc"
        val comparator = when (sort) {
            "unitPriceEstimate" -> compareBy<QuoteComparisonDocument> { it.unitPriceEstimate }
            "moq" -> compareBy { it.moq }
            "leadTime" -> compareBy { it.leadTime }
            else -> compareBy { it.submittedAt }
        }
        val sorted = documents.sortedWith(comparator)
        return if (descending) sorted.reversed() else sorted
    }

    private fun QuoteComparisonDocument.toRequestListItem(): RequestQuoteListItem = RequestQuoteListItem(
        quoteId = quoteId,
        supplierId = supplierProfileId,
        companyName = companyName,
        unitPriceEstimate = unitPriceEstimate,
        moq = moq,
        leadTime = leadTime,
        sampleCost = sampleCost,
        state = state,
        threadId = threadId,
        submittedAt = submittedAt,
    )

    private fun QuoteComparisonDocument.toSupplierListItem(): SupplierQuoteListItem = SupplierQuoteListItem(
        quoteId = quoteId,
        requestId = requestId,
        requestTitle = requestTitle,
        category = requestCategory,
        unitPriceEstimate = unitPriceEstimate,
        moq = moq,
        leadTime = leadTime,
        sampleCost = sampleCost,
        state = state,
        version = version,
        threadId = threadId,
        submittedAt = submittedAt,
    )
}
