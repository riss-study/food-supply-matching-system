package dev.riss.fsm.api.supplier

import dev.riss.fsm.command.review.RatingAggregate
import dev.riss.fsm.command.review.ReviewRepository
import dev.riss.fsm.command.supplier.AttachmentMetadataRepository
import dev.riss.fsm.command.supplier.CertificationRecordRepository
import dev.riss.fsm.command.supplier.SupplierProfileRepository
import org.springframework.r2dbc.core.DatabaseClient
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

data class SupplierSearchQuery(
    val keyword: String? = null,
    val category: String? = null,
    val region: String? = null,
    val oem: Boolean? = null,
    val odm: Boolean? = null,
    val minCapacity: Int? = null,
    val maxMoq: Int? = null,
    val page: Int = 1,
    val size: Int = 20,
    val sort: String? = null,
    val order: String? = null,
)

data class SupplierSearchView(
    val profileId: String,
    val companyName: String,
    val region: String,
    val categories: List<String>,
    val monthlyCapacity: String,
    val moq: String,
    val oemAvailable: Boolean,
    val odmAvailable: Boolean,
    val verificationState: String,
    val exposureState: String,
    val logoUrl: String?,
    val ratingAvg: Double,
    val ratingCount: Int,
)

data class SupplierSearchPage(
    val items: List<SupplierSearchView>,
    val page: Int,
    val size: Int,
    val totalElements: Int,
    val totalPages: Int,
    val hasNext: Boolean,
    val hasPrev: Boolean,
)

data class SupplierCertificationViewItem(
    val type: String,
    val number: String?,
    val valid: Boolean,
)

data class SupplierPortfolioImageViewItem(
    val imageId: String,
    val url: String,
)

data class SupplierDetailView(
    val profileId: String,
    val companyName: String,
    val representativeName: String,
    val region: String,
    val categories: List<String>,
    val equipmentSummary: String?,
    val monthlyCapacity: String,
    val moq: String,
    val oemAvailable: Boolean,
    val odmAvailable: Boolean,
    val rawMaterialSupport: Boolean,
    val packagingLabelingSupport: Boolean,
    val introduction: String?,
    val verificationState: String,
    val logoUrl: String?,
    val certifications: List<SupplierCertificationViewItem>,
    val portfolioImages: List<SupplierPortfolioImageViewItem>,
    val ratingAvg: Double,
    val ratingCount: Int,
)

data class SupplierCategorySummary(
    val category: String,
    val supplierCount: Int,
)

data class SupplierRegionSummary(
    val region: String,
    val supplierCount: Int,
)

@Service
class SupplierQueryService(
    private val databaseClient: DatabaseClient,
    private val supplierProfileRepository: SupplierProfileRepository,
    private val certificationRecordRepository: CertificationRecordRepository,
    private val attachmentMetadataRepository: AttachmentMetadataRepository,
    private val reviewRepository: ReviewRepository,
) {

    fun listApproved(query: SupplierSearchQuery): Mono<SupplierSearchPage> {
        val safePage = query.page.coerceAtLeast(1)
        val safeSize = query.size.coerceIn(1, 100)
        val offset = (safePage - 1) * safeSize

        val conditions = mutableListOf(
            "sp.verification_state = 'approved'",
            "sp.exposure_state = 'visible'",
        )
        val params = mutableMapOf<String, Any>()

        query.keyword?.takeIf { it.isNotBlank() }?.let {
            conditions += "sp.company_name LIKE :keyword"
            params["keyword"] = "%${it}%"
        }
        query.category?.takeIf { it.isNotBlank() }?.let {
            conditions += "FIND_IN_SET(:category, sp.categories) > 0"
            params["category"] = it
        }
        query.region?.takeIf { it.isNotBlank() }?.let {
            conditions += "sp.region LIKE :region"
            params["region"] = "%${it}%"
        }
        query.oem?.let {
            conditions += "sp.oem_available = :oem"
            params["oem"] = it
        }
        query.odm?.let {
            conditions += "sp.odm_available = :odm"
            params["odm"] = it
        }
        val whereClause = conditions.joinToString(" AND ")

        val sortColumn = when (query.sort) {
            "companyName" -> "sp.company_name"
            "monthlyCapacity" -> "sp.monthly_capacity"
            "moq" -> "sp.moq"
            else -> "sp.updated_at"
        }
        val sortDir = if (query.order == "asc") "ASC" else "DESC"

        val countSql = "SELECT COUNT(*) FROM supplier_profile sp WHERE $whereClause"
        val pageSql = """
            SELECT
              sp.id,
              sp.company_name,
              sp.region,
              sp.categories,
              sp.monthly_capacity,
              sp.moq,
              sp.oem_available,
              sp.odm_available,
              sp.verification_state,
              sp.exposure_state,
              (SELECT CONCAT('/files/', a.id)
                 FROM attachment_metadata a
                WHERE a.owner_type = 'supplier-verification'
                  AND a.owner_id = sp.id
                  AND a.attachment_kind = 'portfolio'
                ORDER BY a.created_at ASC
                LIMIT 1) AS logo_url,
              COALESCE(r.avg_rating, 0.0) AS rating_avg,
              COALESCE(r.review_count, 0) AS rating_count
            FROM supplier_profile sp
            LEFT JOIN (
              SELECT supplier_profile_id,
                     CAST(AVG(rating) AS DOUBLE) AS avg_rating,
                     COUNT(*) AS review_count
                FROM review
               WHERE hidden = FALSE
               GROUP BY supplier_profile_id
            ) r ON r.supplier_profile_id = sp.id
            WHERE $whereClause
            ORDER BY $sortColumn $sortDir
            LIMIT :size OFFSET :offset
        """.trimIndent()

        var countSpec = databaseClient.sql(countSql)
        var pageSpec = databaseClient.sql(pageSql)
        for ((k, v) in params) {
            countSpec = countSpec.bind(k, v)
            pageSpec = pageSpec.bind(k, v)
        }
        pageSpec = pageSpec.bind("size", safeSize).bind("offset", offset)

        val countMono = countSpec
            .map { row, _ -> ((row.get(0) as? Number) ?: 0L).toLong() }
            .one()
            .defaultIfEmpty(0L)

        val pageMono = pageSpec
            .map { row, _ ->
                SupplierSearchView(
                    profileId = row.get("id", String::class.java)!!,
                    companyName = row.get("company_name", String::class.java)!!,
                    region = row.get("region", String::class.java)!!,
                    categories = (row.get("categories", String::class.java) ?: "")
                        .split(',')
                        .filter { it.isNotBlank() },
                    monthlyCapacity = row.get("monthly_capacity", String::class.java)!!,
                    moq = row.get("moq", String::class.java)!!,
                    oemAvailable = asBoolean(row.get("oem_available")),
                    odmAvailable = asBoolean(row.get("odm_available")),
                    verificationState = row.get("verification_state", String::class.java)!!,
                    exposureState = row.get("exposure_state", String::class.java)!!,
                    logoUrl = row.get("logo_url", String::class.java),
                    ratingAvg = roundRating(((row.get("rating_avg") as? Number) ?: 0.0).toDouble()),
                    ratingCount = ((row.get("rating_count") as? Number) ?: 0).toInt(),
                )
            }
            .all()
            .collectList()

        return countMono.zipWith(pageMono).map { tuple ->
            val total = tuple.t1
            val pageItems = tuple.t2
            // monthly_capacity / moq 는 자유 텍스트 VARCHAR 이므로 숫자 필터는
            // 페이지 내 post-filter 로 유지 (open-items BE-5 후보). Mongo 구현과 동일.
            val postFiltered = pageItems.filter { item ->
                val capOk = query.minCapacity?.let { min ->
                    (item.monthlyCapacity.filter { ch -> ch.isDigit() }.toIntOrNull() ?: 0) >= min
                } ?: true
                val moqOk = query.maxMoq?.let { max ->
                    (item.moq.filter { ch -> ch.isDigit() }.toIntOrNull() ?: Int.MAX_VALUE) <= max
                } ?: true
                capOk && moqOk
            }
            val totalInt = total.toInt()
            val totalPages = if (totalInt == 0) 0 else ((totalInt - 1) / safeSize) + 1
            SupplierSearchPage(
                items = postFiltered,
                page = safePage,
                size = safeSize,
                totalElements = totalInt,
                totalPages = totalPages,
                hasNext = safePage < totalPages,
                hasPrev = safePage > 1 && totalPages > 0,
            )
        }
    }

    fun detail(profileId: String): Mono<SupplierDetailView> {
        return supplierProfileRepository.findById(profileId)
            .flatMap { profile ->
                val certsMono = certificationRecordRepository
                    .findAllBySupplierProfileId(profileId)
                    .collectList()
                val attachmentsMono = attachmentMetadataRepository
                    .findAllByOwnerTypeAndOwnerId("supplier-verification", profileId)
                    .collectList()
                val ratingMono = reviewRepository
                    .aggregateRatingBySupplier(profileId)
                    .defaultIfEmpty(RatingAggregate(reviewCount = 0L, avgRating = 0.0))

                Mono.zip(certsMono, attachmentsMono, ratingMono).map { tuple ->
                    val certs = tuple.t1.map {
                        SupplierCertificationViewItem(
                            type = it.type,
                            number = it.number,
                            valid = it.status == "submitted" || it.status == "approved",
                        )
                    }
                    val portfolio = tuple.t2
                        .filter { it.attachmentKind == "portfolio" }
                        .sortedBy { it.createdAt }
                        .map {
                            SupplierPortfolioImageViewItem(
                                imageId = it.attachmentId,
                                url = "/files/${it.attachmentId}",
                            )
                        }
                    val aggregate = tuple.t3
                    val count = aggregate.reviewCount.toInt()
                    val avg = if (count == 0) 0.0 else roundRating(aggregate.avgRating)
                    SupplierDetailView(
                        profileId = profile.profileId,
                        companyName = profile.companyName,
                        representativeName = profile.representativeName,
                        region = profile.region,
                        categories = profile.categories.split(',').filter { it.isNotBlank() },
                        equipmentSummary = profile.equipmentSummary,
                        monthlyCapacity = profile.monthlyCapacity,
                        moq = profile.moq,
                        oemAvailable = profile.oemAvailable,
                        odmAvailable = profile.odmAvailable,
                        rawMaterialSupport = profile.rawMaterialSupport,
                        packagingLabelingSupport = profile.packagingLabelingSupport,
                        introduction = profile.introduction,
                        verificationState = profile.verificationState,
                        logoUrl = portfolio.firstOrNull()?.url,
                        certifications = certs,
                        portfolioImages = portfolio,
                        ratingAvg = avg,
                        ratingCount = count,
                    )
                }
            }
    }

    fun categories(): Mono<List<SupplierCategorySummary>> {
        return supplierProfileRepository.findAll()
            .filter { it.verificationState == "approved" && it.exposureState == "visible" }
            .flatMap { profile ->
                Flux.fromIterable(profile.categories.split(',').filter { it.isNotBlank() })
            }
            .collectList()
            .map { categoriesList ->
                categoriesList.groupingBy { it }.eachCount()
                    .map { SupplierCategorySummary(category = it.key, supplierCount = it.value) }
                    .sortedBy { it.category }
            }
    }

    fun regions(): Mono<List<SupplierRegionSummary>> {
        return databaseClient.sql(
            """
            SELECT region, COUNT(*) AS supplier_count
              FROM supplier_profile
             WHERE verification_state = 'approved'
               AND exposure_state = 'visible'
             GROUP BY region
             ORDER BY region ASC
            """.trimIndent()
        )
            .map { row, _ ->
                SupplierRegionSummary(
                    region = row.get("region", String::class.java)!!,
                    supplierCount = ((row.get("supplier_count") as? Number) ?: 0).toInt(),
                )
            }
            .all()
            .collectList()
    }

    private fun roundRating(avg: Double): Double = kotlin.math.round(avg * 100.0) / 100.0

    private fun asBoolean(value: Any?): Boolean = when (value) {
        is Boolean -> value
        is Number -> value.toInt() != 0
        else -> false
    }
}
