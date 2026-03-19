package dev.riss.fsm.query.supplier

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("supplier_search_view")
data class SupplierSearchViewDocument(
    @Id
    val profileId: String,
    val companyName: String,
    val region: String,
    val categories: List<String>,
    val monthlyCapacity: Int,
    val moq: Int,
    val oemAvailable: Boolean,
    val odmAvailable: Boolean,
    val verificationState: String,
    val exposureState: String,
    val updatedAt: Instant,
)
