package dev.riss.fsm.query.supplier

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("supplier_detail_view")
data class SupplierDetailViewDocument(
    @Id
    val profileId: String,
    val companyName: String,
    val representativeName: String,
    val region: String,
    val categories: List<String>,
    val equipmentSummary: String?,
    val monthlyCapacity: Int,
    val moq: Int,
    val oemAvailable: Boolean,
    val odmAvailable: Boolean,
    val rawMaterialSupport: Boolean,
    val packagingLabelingSupport: Boolean,
    val introduction: String?,
    val verificationState: String,
    val exposureState: String,
    val certifications: List<String>,
    val updatedAt: Instant,
)
