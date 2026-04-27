package dev.riss.fsm.api.request

import dev.riss.fsm.command.request.TargetedSupplierLinkRepository
import dev.riss.fsm.command.supplier.SupplierProfileRepository
import dev.riss.fsm.command.user.BusinessProfileRepository
import dev.riss.fsm.shared.api.PaginationMeta
import dev.riss.fsm.shared.security.AuthenticatedUserPrincipal
import org.springframework.r2dbc.core.DatabaseClient
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.time.ZoneOffset

data class RequestListPageResponse(
    val items: List<RequestListItemResponse>,
    val meta: PaginationMeta,
)

@Service
class RequestQueryService(
    private val databaseClient: DatabaseClient,
    private val targetedSupplierLinkRepository: TargetedSupplierLinkRepository,
    private val businessProfileRepository: BusinessProfileRepository,
    private val supplierProfileRepository: SupplierProfileRepository,
    private val requestAccessGuard: RequestAccessGuard,
) {
    fun listByRequester(
        requesterUserId: String,
        state: String?,
        page: Int,
        size: Int,
    ): Mono<RequestListPageResponse> {
        val safePage = page.coerceAtLeast(1)
        val safeSize = size.coerceIn(1, 100)
        val offset = (safePage - 1) * safeSize

        val conditions = mutableListOf("r.requester_user_id = :requesterUserId")
        val params = mutableMapOf<String, Any>("requesterUserId" to requesterUserId)
        state?.takeIf { it.isNotBlank() }?.let {
            conditions += "r.state = :state"
            params["state"] = it
        }
        val whereClause = conditions.joinToString(" AND ")

        val countSql = "SELECT COUNT(*) FROM request_record r WHERE $whereClause"
        val pageSql = """
            SELECT
              r.id, r.title, r.category, r.state, r.mode, r.created_at,
              COALESCE((
                SELECT COUNT(*) FROM quote q
                 WHERE q.request_id = r.id
                   AND q.state != 'withdrawn'
              ), 0) AS quote_count
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
        val pageMono = pageSpec
            .map { row, _ ->
                RequestListItemResponse(
                    requestId = row.get("id", String::class.java)!!,
                    title = row.get("title", String::class.java)!!,
                    category = row.get("category", String::class.java)!!,
                    state = row.get("state", String::class.java)!!,
                    mode = row.get("mode", String::class.java)!!,
                    quoteCount = ((row.get("quote_count") as? Number) ?: 0).toInt(),
                    createdAt = row.get("created_at", java.time.LocalDateTime::class.java)!!.toInstant(ZoneOffset.UTC),
                    expiresAt = null,
                )
            }
            .all()
            .collectList()

        return countMono.zipWith(pageMono).map { tuple ->
            val total = tuple.t1
            val totalPages = if (total == 0L) 0 else ((total - 1) / safeSize).toInt() + 1
            RequestListPageResponse(
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

    fun getDetail(
        principal: AuthenticatedUserPrincipal,
        requestId: String,
    ): Mono<RequestDetailResponse> {
        return requestAccessGuard.checkRequestAccess(principal, requestId)
            .flatMap { entity ->
                val requesterMono = businessProfileRepository.findByUserAccountId(entity.requesterUserId)
                    .map { profile ->
                        RequestDetailRequester(
                            businessName = profile.businessName,
                            contactName = profile.contactName,
                        )
                    }
                    .defaultIfEmpty(RequestDetailRequester(businessName = "", contactName = ""))

                val targetSuppliersMono = if (entity.mode == "targeted") {
                    targetedSupplierLinkRepository.findAllByRequestId(entity.requestId)
                        .flatMap { link ->
                            supplierProfileRepository.findById(link.supplierProfileId)
                                .map { supplier ->
                                    RequestDetailTargetSupplier(
                                        supplierProfileId = supplier.profileId,
                                        companyName = supplier.companyName,
                                    )
                                }
                        }
                        .collectList()
                } else {
                    Mono.just(emptyList())
                }

                val quoteCountMono = databaseClient.sql(
                    "SELECT COUNT(*) FROM quote WHERE request_id = :requestId AND state != 'withdrawn'"
                )
                    .bind("requestId", entity.requestId)
                    .map { row, _ -> ((row.get(0) as? Number) ?: 0L).toLong() }
                    .one()
                    .defaultIfEmpty(0L)

                Mono.zip(requesterMono, targetSuppliersMono, quoteCountMono)
                    .map { tuple ->
                        RequestDetailResponse(
                            requestId = entity.requestId,
                            mode = entity.mode,
                            title = entity.title,
                            category = entity.category,
                            desiredVolume = entity.desiredVolume,
                            targetPriceRange = if (entity.targetPriceMin != null || entity.targetPriceMax != null) {
                                CreateRequestPriceRange(
                                    min = entity.targetPriceMin,
                                    max = entity.targetPriceMax,
                                )
                            } else {
                                null
                            },
                            certificationRequirement = entity.certificationRequirement?.split(",")?.filter { it.isNotBlank() },
                            rawMaterialRule = entity.rawMaterialRule,
                            packagingRequirement = entity.packagingRequirement,
                            deliveryRequirement = entity.deliveryRequirement,
                            notes = entity.notes,
                            state = entity.state,
                            requester = tuple.t1,
                            targetSuppliers = tuple.t2.ifEmpty { null },
                            quoteCount = tuple.t3.toInt(),
                            createdAt = entity.createdAt.toInstant(ZoneOffset.UTC),
                        )
                    }
            }
    }

    fun getTargetedSupplierIds(requestId: String): Flux<String> {
        return targetedSupplierLinkRepository.findAllByRequestId(requestId).map { it.supplierProfileId }
    }
}
