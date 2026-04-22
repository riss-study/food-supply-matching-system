package dev.riss.fsm.api.request

import dev.riss.fsm.command.quote.QuoteRepository
import dev.riss.fsm.command.request.RequestEntity
import dev.riss.fsm.command.supplier.SupplierProfileRepository
import dev.riss.fsm.command.user.BusinessProfileRepository
import org.springframework.http.HttpStatus
import org.springframework.r2dbc.core.DatabaseClient
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import reactor.kotlin.core.publisher.switchIfEmpty
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneOffset

private data class FeedRow(
    val requestId: String,
    val requesterUserId: String,
    val title: String,
    val category: String,
    val desiredVolume: String,
    val targetPriceMin: String?,
    val targetPriceMax: String?,
    val certificationRequirement: String?,
    val mode: String,
    val createdAt: LocalDateTime,
)

@Service
class SupplierRequestService(
    private val databaseClient: DatabaseClient,
    private val supplierProfileRepository: SupplierProfileRepository,
    private val businessProfileRepository: BusinessProfileRepository,
    private val quoteRepository: QuoteRepository,
) {

    fun getFeed(
        supplierUserId: String,
        category: String?,
        page: Int,
        size: Int,
    ): Mono<SupplierRequestFeedPage> {
        val safePage = page.coerceAtLeast(1)
        val safeSize = size.coerceIn(1, 100)
        val offset = (safePage - 1) * safeSize

        return supplierProfileRepository.findBySupplierUserId(supplierUserId)
            .switchIfEmpty { Mono.error(ResponseStatusException(HttpStatus.FORBIDDEN, "Supplier profile not found")) }
            .flatMap { profile ->
                // WHERE state='open' AND (mode='public' OR (mode='targeted' AND supplier is linked))
                val baseWhere = mutableListOf(
                    "r.state = 'open'",
                    "(r.mode = 'public' OR EXISTS (SELECT 1 FROM targeted_supplier_link t " +
                        "WHERE t.request_id = r.id AND t.supplier_profile_id = :supplierProfileId))"
                )
                val params = mutableMapOf<String, Any>("supplierProfileId" to profile.profileId)
                category?.takeIf { it.isNotBlank() }?.let {
                    baseWhere += "r.category = :category"
                    params["category"] = it
                }
                val whereClause = baseWhere.joinToString(" AND ")

                val countSql = "SELECT COUNT(*) FROM request_record r WHERE $whereClause"
                val pageSql = """
                    SELECT r.id, r.requester_user_id, r.title, r.category, r.desired_volume,
                           r.target_price_min, r.target_price_max, r.certification_requirement,
                           r.mode, r.created_at
                      FROM request_record r
                     WHERE $whereClause
                     ORDER BY r.created_at DESC
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
                val pageRowsMono = pageSpec.map { row, _ ->
                    FeedRow(
                        requestId = row.get("id", String::class.java)!!,
                        requesterUserId = row.get("requester_user_id", String::class.java)!!,
                        title = row.get("title", String::class.java)!!,
                        category = row.get("category", String::class.java)!!,
                        desiredVolume = row.get("desired_volume", String::class.java)!!,
                        targetPriceMin = row.get("target_price_min", String::class.java),
                        targetPriceMax = row.get("target_price_max", String::class.java),
                        certificationRequirement = row.get("certification_requirement", String::class.java),
                        mode = row.get("mode", String::class.java)!!,
                        createdAt = row.get("created_at", LocalDateTime::class.java)!!,
                    )
                }.all().collectList()

                countMono.zipWith(pageRowsMono).flatMap { tuple ->
                    val total = tuple.t1
                    val rows = tuple.t2
                    val totalPages = if (total == 0L) 0 else ((total - 1) / safeSize).toInt() + 1

                    Flux.fromIterable(rows)
                        .flatMap { row -> buildFeedItem(row, profile.profileId) }
                        .collectList()
                        .map { items ->
                            SupplierRequestFeedPage(
                                items = items,
                                page = safePage,
                                size = safeSize,
                                totalElements = total.toInt(),
                                totalPages = totalPages,
                                hasNext = safePage < totalPages,
                                hasPrev = safePage > 1 && totalPages > 0,
                            )
                        }
                }
            }
    }

    fun getDetail(
        supplierUserId: String,
        request: RequestEntity,
    ): Mono<SupplierRequestDetail> {
        return supplierProfileRepository.findBySupplierUserId(supplierUserId)
            .flatMap { profile ->
                val businessNameMono = businessProfileRepository.findByUserAccountId(request.requesterUserId)
                    .map { it.businessName }
                    .defaultIfEmpty("")
                val hasQuotedMono = quoteRepository.existsByRequestIdAndSupplierProfileIdAndStateIn(
                    request.requestId,
                    profile.profileId,
                    listOf("submitted", "selected", "declined"),
                )
                Mono.zip(businessNameMono, hasQuotedMono).map { tuple ->
                    val min = request.targetPriceMin
                    val max = request.targetPriceMax
                    val targetPriceRange = if (min != null && max != null) {
                        PriceRangeDto(min = min, max = max)
                    } else {
                        null
                    }
                    SupplierRequestDetail(
                        requestId = request.requestId,
                        mode = request.mode,
                        title = request.title,
                        category = request.category,
                        desiredVolume = request.desiredVolume,
                        targetPriceRange = targetPriceRange,
                        certificationRequirement = request.certificationRequirement?.split(",")?.filter { it.isNotBlank() },
                        rawMaterialRule = request.rawMaterialRule,
                        packagingRequirement = request.packagingRequirement,
                        deliveryRequirement = request.deliveryRequirement,
                        notes = request.notes,
                        state = request.state,
                        requesterBusinessName = tuple.t1,
                        hasQuoted = tuple.t2,
                        createdAt = request.createdAt.toInstant(ZoneOffset.UTC),
                    )
                }
            }
    }

    private fun buildFeedItem(row: FeedRow, supplierProfileId: String): Mono<SupplierRequestFeedItem> {
        val businessNameMono = businessProfileRepository.findByUserAccountId(row.requesterUserId)
            .map { it.businessName }
            .defaultIfEmpty("")
        val hasQuotedMono = quoteRepository.existsByRequestIdAndSupplierProfileIdAndStateIn(
            row.requestId,
            supplierProfileId,
            listOf("submitted", "selected", "declined"),
        )
        return Mono.zip(businessNameMono, hasQuotedMono).map { tuple ->
            val min = row.targetPriceMin
            val max = row.targetPriceMax
            val targetPriceRange = if (min != null && max != null) {
                PriceRangeDto(min = min, max = max)
            } else {
                null
            }
            SupplierRequestFeedItem(
                requestId = row.requestId,
                requesterBusinessName = tuple.t1,
                title = row.title,
                category = row.category,
                desiredVolume = row.desiredVolume,
                targetPriceRange = targetPriceRange,
                certificationRequirement = row.certificationRequirement?.split(",")?.filter { it.isNotBlank() },
                mode = row.mode,
                hasQuoted = tuple.t2,
                createdAt = row.createdAt.toInstant(ZoneOffset.UTC),
            )
        }
    }
}
