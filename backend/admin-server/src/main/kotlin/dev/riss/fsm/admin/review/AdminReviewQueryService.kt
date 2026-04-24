package dev.riss.fsm.admin.review

import org.springframework.r2dbc.core.DatabaseClient
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.time.temporal.ChronoUnit

data class AdminReviewQuery(
    val state: String? = null,
    val fromDate: LocalDate? = null,
    val toDate: LocalDate? = null,
    val page: Int = 1,
    val size: Int = 20,
    val sort: String? = null,
    val order: String? = null,
)

data class AdminReviewQueueItemView(
    val reviewId: String,
    val supplierProfileId: String,
    val companyName: String,
    val state: String,
    val submittedAt: Instant,
    val pendingDays: Long,
    val verificationState: String,
)

data class AdminReviewQueuePage(
    val items: List<AdminReviewQueueItemView>,
    val page: Int,
    val size: Int,
    val totalElements: Int,
    val totalPages: Int,
    val hasNext: Boolean,
    val hasPrev: Boolean,
)

data class AdminReviewFileView(
    val fileId: String,
    val fileName: String,
    val status: String,
)

data class AdminReviewDetailView(
    val reviewId: String,
    val supplierProfileId: String,
    val companyName: String,
    val representativeName: String,
    val region: String,
    val categories: List<String>,
    val state: String,
    val submittedAt: Instant,
    val reviewedAt: Instant?,
    val reviewNoteInternal: String?,
    val reviewNotePublic: String?,
    val files: List<AdminReviewFileView>,
)

@Service
class AdminReviewQueryService(
    private val databaseClient: DatabaseClient,
) {
    fun queue(query: AdminReviewQuery): Mono<AdminReviewQueuePage> {
        val safePage = query.page.coerceAtLeast(1)
        val safeSize = query.size.coerceIn(1, 100)
        val offset = (safePage - 1) * safeSize

        val conditions = mutableListOf<String>()
        val params = mutableMapOf<String, Any>()
        query.state?.takeIf { it.isNotBlank() }?.let {
            conditions += "vs.state = :state"
            params["state"] = it
        }
        query.fromDate?.let {
            conditions += "vs.submitted_at >= :fromDate"
            params["fromDate"] = it.atStartOfDay()
        }
        query.toDate?.let {
            conditions += "vs.submitted_at < :toDate"
            params["toDate"] = it.plusDays(1).atStartOfDay()
        }
        val whereClause = if (conditions.isEmpty()) "1=1" else conditions.joinToString(" AND ")

        val sortExpr = when (query.sort) {
            "pendingDays" -> "vs.submitted_at"  // older submitted_at = larger pendingDays; handle via order flip
            "state" -> "vs.state"
            "companyName" -> "sp.company_name"
            else -> "vs.submitted_at"
        }
        // pendingDays sorts inverse of submitted_at: asc pendingDays → desc submitted_at
        val sortDir = when {
            query.sort == "pendingDays" && query.order == "asc" -> "DESC"
            query.sort == "pendingDays" -> "ASC"
            query.order == "asc" -> "ASC"
            else -> "DESC"
        }

        val countSql = """
            SELECT COUNT(*)
              FROM verification_submission vs
              JOIN supplier_profile sp ON sp.id = vs.supplier_profile_id
             WHERE $whereClause
        """.trimIndent()
        val pageSql = """
            SELECT vs.id AS review_id,
                   sp.id AS supplier_profile_id,
                   sp.company_name,
                   vs.state,
                   vs.submitted_at,
                   sp.verification_state
              FROM verification_submission vs
              JOIN supplier_profile sp ON sp.id = vs.supplier_profile_id
             WHERE $whereClause
             ORDER BY $sortExpr $sortDir
             LIMIT :size OFFSET :offset
        """.trimIndent()

        var countSpec = databaseClient.sql(countSql)
        var pageSpec = databaseClient.sql(pageSql)
        for ((k, v) in params) {
            countSpec = countSpec.bind(k, v)
            pageSpec = pageSpec.bind(k, v)
        }
        pageSpec = pageSpec.bind("size", safeSize).bind("offset", offset)

        val now = LocalDateTime.now()

        val countMono = countSpec.map { row, _ -> ((row.get(0) as? Number) ?: 0L).toLong() }.one().defaultIfEmpty(0L)
        val pageMono = pageSpec.map { row, _ ->
            val submittedAt = row.get("submitted_at", LocalDateTime::class.java)!!
            AdminReviewQueueItemView(
                reviewId = row.get("review_id", String::class.java)!!,
                supplierProfileId = row.get("supplier_profile_id", String::class.java)!!,
                companyName = row.get("company_name", String::class.java)!!,
                state = row.get("state", String::class.java)!!,
                submittedAt = submittedAt.toInstant(ZoneOffset.UTC),
                pendingDays = ChronoUnit.DAYS.between(submittedAt, now),
                verificationState = row.get("verification_state", String::class.java)!!,
            )
        }.all().collectList()

        return countMono.zipWith(pageMono).map { tuple ->
            val total = tuple.t1.toInt()
            val totalPages = if (total == 0) 0 else ((total - 1) / safeSize) + 1
            AdminReviewQueuePage(
                items = tuple.t2,
                page = safePage,
                size = safeSize,
                totalElements = total,
                totalPages = totalPages,
                hasNext = safePage < totalPages,
                hasPrev = safePage > 1 && totalPages > 0,
            )
        }
    }

    fun detail(reviewId: String): Mono<AdminReviewDetailView> {
        val sql = """
            SELECT vs.id AS review_id,
                   sp.id AS supplier_profile_id,
                   sp.company_name,
                   sp.representative_name,
                   sp.region,
                   sp.categories,
                   vs.state,
                   vs.submitted_at,
                   vs.reviewed_at,
                   vs.review_note_internal,
                   vs.review_note_public
              FROM verification_submission vs
              JOIN supplier_profile sp ON sp.id = vs.supplier_profile_id
             WHERE vs.id = :reviewId
             LIMIT 1
        """.trimIndent()

        val filesSql = """
            SELECT cr.file_attachment_id, cr.type, cr.number, cr.status
              FROM certification_record cr
              JOIN verification_submission vs ON vs.supplier_profile_id = cr.supplier_profile_id
             WHERE vs.id = :reviewId
             ORDER BY cr.created_at ASC
        """.trimIndent()

        val detailMono = databaseClient.sql(sql)
            .bind("reviewId", reviewId)
            .map { row, _ ->
                val submittedAt = row.get("submitted_at", LocalDateTime::class.java)!!
                val reviewedAt = row.get("reviewed_at", LocalDateTime::class.java)
                AdminReviewDetailView(
                    reviewId = row.get("review_id", String::class.java)!!,
                    supplierProfileId = row.get("supplier_profile_id", String::class.java)!!,
                    companyName = row.get("company_name", String::class.java)!!,
                    representativeName = row.get("representative_name", String::class.java)!!,
                    region = row.get("region", String::class.java)!!,
                    categories = (row.get("categories", String::class.java) ?: "").split(',').filter { it.isNotBlank() },
                    state = row.get("state", String::class.java)!!,
                    submittedAt = submittedAt.toInstant(ZoneOffset.UTC),
                    reviewedAt = reviewedAt?.toInstant(ZoneOffset.UTC),
                    reviewNoteInternal = row.get("review_note_internal", String::class.java),
                    reviewNotePublic = row.get("review_note_public", String::class.java),
                    files = emptyList(), // filled next
                )
            }
            .one()

        val filesMono = databaseClient.sql(filesSql)
            .bind("reviewId", reviewId)
            .map { row, _ ->
                val type = row.get("type", String::class.java)!!
                val number = row.get("number", String::class.java)
                AdminReviewFileView(
                    fileId = row.get("file_attachment_id", String::class.java)!!,
                    fileName = number ?: type,
                    status = row.get("status", String::class.java)!!,
                )
            }
            .all()
            .collectList()

        return detailMono.zipWith(filesMono).map { tuple -> tuple.t1.copy(files = tuple.t2) }
    }
}
