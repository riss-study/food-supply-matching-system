package dev.riss.fsm.query.supplier

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.index.CompoundIndex
import org.springframework.data.mongodb.core.index.CompoundIndexes
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.index.TextIndexed
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("supplier_search_view")
@CompoundIndexes(
    CompoundIndex(name = "supplier_category_region_idx", def = "{'categories': 1, 'region': 1}"),
)
data class SupplierSearchViewDocument(
    @Id
    val profileId: String,
    @TextIndexed
    val companyName: String,
    @Indexed
    val region: String,
    @Indexed
    val categories: List<String>,
    @Indexed
    val monthlyCapacity: Int,
    val moq: Int,
    @Indexed
    val oemAvailable: Boolean,
    @Indexed
    val odmAvailable: Boolean,
    val verificationState: String,
    val exposureState: String,
    val logoUrl: String?,
    val updatedAt: Instant,
)
