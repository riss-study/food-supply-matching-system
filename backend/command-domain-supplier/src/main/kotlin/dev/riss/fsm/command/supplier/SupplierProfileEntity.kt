package dev.riss.fsm.command.supplier

import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Transient
import org.springframework.data.domain.Persistable
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.LocalDateTime

@Table("supplier_profile")
data class SupplierProfileEntity(
    @Id
    @Column("id")
    val profileId: String,
    @Column("supplier_user_id")
    val supplierUserId: String,
    @Column("company_name")
    val companyName: String,
    @Column("representative_name")
    val representativeName: String,
    @Column("contact_phone")
    val contactPhone: String?,
    @Column("contact_email")
    val contactEmail: String?,
    @Column("region")
    val region: String,
    @Column("categories")
    val categories: String,
    @Column("equipment_summary")
    val equipmentSummary: String?,
    @Column("monthly_capacity")
    val monthlyCapacity: String,
    @Column("moq")
    val moq: String,
    @Column("oem_available")
    val oemAvailable: Boolean,
    @Column("odm_available")
    val odmAvailable: Boolean,
    @Column("raw_material_support")
    val rawMaterialSupport: Boolean,
    @Column("packaging_labeling_support")
    val packagingLabelingSupport: Boolean,
    @Column("introduction")
    val introduction: String?,
    @Column("verification_state")
    val verificationState: String,
    @Column("exposure_state")
    val exposureState: String,
    @Column("created_at")
    val createdAt: LocalDateTime,
    @Column("updated_at")
    val updatedAt: LocalDateTime,
) : Persistable<String> {
    @Transient
    var newEntity: Boolean = false

    override fun getId(): String = profileId

    override fun isNew(): Boolean = newEntity
}
