package dev.riss.fsm.command.request

import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Transient
import org.springframework.data.domain.Persistable
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.LocalDateTime

@Table("request_record")
data class RequestEntity(
    @Id
    @Column("id")
    val requestId: String,
    @Column("requester_user_id")
    val requesterUserId: String,
    @Column("mode")
    val mode: String,
    @Column("title")
    val title: String,
    @Column("category")
    val category: String,
    @Column("desired_volume")
    val desiredVolume: Int,
    @Column("target_price_min")
    val targetPriceMin: Int?,
    @Column("target_price_max")
    val targetPriceMax: Int?,
    @Column("certification_requirement")
    val certificationRequirement: String?,
    @Column("raw_material_rule")
    val rawMaterialRule: String?,
    @Column("packaging_requirement")
    val packagingRequirement: String?,
    @Column("delivery_requirement")
    val deliveryRequirement: String?,
    @Column("notes")
    val notes: String?,
    @Column("state")
    val state: String,
    @Column("created_at")
    val createdAt: LocalDateTime,
) : Persistable<String> {
    @Transient
    var newEntity: Boolean = false

    override fun getId(): String = requestId

    override fun isNew(): Boolean = newEntity
}
