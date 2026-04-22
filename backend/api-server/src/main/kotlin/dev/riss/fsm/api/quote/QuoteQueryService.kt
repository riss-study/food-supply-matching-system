package dev.riss.fsm.api.quote

import dev.riss.fsm.command.request.RequestRepository
import dev.riss.fsm.shared.api.PaginationMeta
import org.springframework.http.HttpStatus
import org.springframework.r2dbc.core.DatabaseClient
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Mono
import java.time.LocalDateTime
import java.time.ZoneOffset

data class QuotePageResponse<T>(
    val items: List<T>,
    val meta: PaginationMeta,
)

@Service
class QuoteQueryService(
    private val databaseClient: DatabaseClient,
    private val requestRepository: RequestRepository,
) {
    fun listForRequest(
        requestId: String,
        requesterUserId: String,
        state: String?,
        page: Int,
        size: Int,
        sort: String?,
        order: String?,
    ): Mono<QuotePageResponse<RequestQuoteListItem>> {
        val safePage = page.coerceAtLeast(1)
        val safeSize = size.coerceIn(1, 100)
        val offset = (safePage - 1) * safeSize

        return requestRepository.findById(requestId)
            .switchIfEmpty(Mono.error(ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found")))
            .flatMap { request ->
                if (request.requesterUserId != requesterUserId) {
                    return@flatMap Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Not the request owner"))
                }

                val conditions = mutableListOf("q.request_id = :requestId")
                val params = mutableMapOf<String, Any>("requestId" to requestId)
                state?.takeIf { it.isNotBlank() }?.let {
                    conditions += "q.state = :state"
                    params["state"] = it
                }
                val whereClause = conditions.joinToString(" AND ")

                val sortExpr = when (sort) {
                    "unitPriceEstimate" -> "q.unit_price_estimate"
                    "moq" -> "q.moq"
                    "leadTime" -> "q.lead_time"
                    else -> "q.created_at"
                }
                val dir = if (order == "asc") "ASC" else "DESC"

                val countSql = "SELECT COUNT(*) FROM quote q WHERE $whereClause"
                val pageSql = """
                    SELECT q.id, q.supplier_profile_id, sp.company_name,
                           q.unit_price_estimate, q.moq, q.lead_time, q.sample_cost,
                           q.state, q.created_at,
                           (SELECT mt.id FROM message_thread mt WHERE mt.quote_id = q.id LIMIT 1) AS thread_id
                      FROM quote q
                      JOIN supplier_profile sp ON sp.id = q.supplier_profile_id
                     WHERE $whereClause
                     ORDER BY $sortExpr $dir
                     LIMIT :size OFFSET :offset
                """.trimIndent()

                var countSpec = databaseClient.sql(countSql)
                var pageSpec = databaseClient.sql(pageSql)
                for ((k, v) in params) {
                    countSpec = countSpec.bind(k, v)
                    pageSpec = pageSpec.bind(k, v)
                }
                pageSpec = pageSpec.bind("size", safeSize).bind("offset", offset)

                val countMono = countSpec.map { row, _ -> ((row.get(0) as? Number) ?: 0L).toLong() }.one().defaultIfEmpty(0L)
                val pageMono = pageSpec.map { row, _ ->
                    RequestQuoteListItem(
                        quoteId = row.get("id", String::class.java)!!,
                        supplierId = row.get("supplier_profile_id", String::class.java)!!,
                        companyName = row.get("company_name", String::class.java)!!,
                        unitPriceEstimate = row.get("unit_price_estimate", String::class.java)!!,
                        moq = row.get("moq", String::class.java)!!,
                        leadTime = row.get("lead_time", String::class.java)!!,
                        sampleCost = row.get("sample_cost", String::class.java),
                        state = row.get("state", String::class.java)!!,
                        threadId = row.get("thread_id", String::class.java) ?: "",
                        submittedAt = row.get("created_at", LocalDateTime::class.java)!!.toInstant(ZoneOffset.UTC),
                    )
                }.all().collectList()

                countMono.zipWith(pageMono).map { tuple ->
                    val total = tuple.t1
                    val totalPages = if (total == 0L) 0 else ((total - 1) / safeSize).toInt() + 1
                    QuotePageResponse(
                        items = tuple.t2,
                        meta = PaginationMeta(
                            page = safePage,
                            size = safeSize,
                            totalElements = total,
                            totalPages = totalPages,
                            hasNext = safePage < totalPages,
                            hasPrev = safePage > 1 && totalPages > 0,
                        ),
                    )
                }
            }
    }

    fun listForSupplier(
        supplierProfileId: String,
        page: Int,
        size: Int,
    ): Mono<QuotePageResponse<SupplierQuoteListItem>> {
        val safePage = page.coerceAtLeast(1)
        val safeSize = size.coerceIn(1, 100)
        val offset = (safePage - 1) * safeSize

        val countSql = "SELECT COUNT(*) FROM quote WHERE supplier_profile_id = :supplierProfileId"
        val pageSql = """
            SELECT q.id, q.request_id, r.title, r.category,
                   q.unit_price_estimate, q.moq, q.lead_time, q.sample_cost,
                   q.state, q.version, q.created_at,
                   (SELECT mt.id FROM message_thread mt WHERE mt.quote_id = q.id LIMIT 1) AS thread_id
              FROM quote q
              JOIN request_record r ON r.id = q.request_id
             WHERE q.supplier_profile_id = :supplierProfileId
             ORDER BY q.created_at DESC
             LIMIT :size OFFSET :offset
        """.trimIndent()

        val countMono = databaseClient.sql(countSql)
            .bind("supplierProfileId", supplierProfileId)
            .map { row, _ -> ((row.get(0) as? Number) ?: 0L).toLong() }
            .one()
            .defaultIfEmpty(0L)

        val pageMono = databaseClient.sql(pageSql)
            .bind("supplierProfileId", supplierProfileId)
            .bind("size", safeSize)
            .bind("offset", offset)
            .map { row, _ ->
                SupplierQuoteListItem(
                    quoteId = row.get("id", String::class.java)!!,
                    requestId = row.get("request_id", String::class.java)!!,
                    requestTitle = row.get("title", String::class.java)!!,
                    category = row.get("category", String::class.java)!!,
                    unitPriceEstimate = row.get("unit_price_estimate", String::class.java)!!,
                    moq = row.get("moq", String::class.java)!!,
                    leadTime = row.get("lead_time", String::class.java)!!,
                    sampleCost = row.get("sample_cost", String::class.java),
                    state = row.get("state", String::class.java)!!,
                    version = ((row.get("version") as? Number) ?: 0).toInt(),
                    threadId = row.get("thread_id", String::class.java) ?: "",
                    submittedAt = row.get("created_at", LocalDateTime::class.java)!!.toInstant(ZoneOffset.UTC),
                )
            }
            .all()
            .collectList()

        return countMono.zipWith(pageMono).map { tuple ->
            val total = tuple.t1
            val totalPages = if (total == 0L) 0 else ((total - 1) / safeSize).toInt() + 1
            QuotePageResponse(
                items = tuple.t2,
                meta = PaginationMeta(
                    page = safePage,
                    size = safeSize,
                    totalElements = total,
                    totalPages = totalPages,
                    hasNext = safePage < totalPages,
                    hasPrev = safePage > 1 && totalPages > 0,
                ),
            )
        }
    }
}
