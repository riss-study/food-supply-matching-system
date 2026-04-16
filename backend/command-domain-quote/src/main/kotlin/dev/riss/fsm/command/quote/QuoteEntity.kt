package dev.riss.fsm.command.quote

import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Transient
import org.springframework.data.domain.Persistable
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.LocalDateTime

@Table("quote")
data class QuoteEntity(
    @Id
    @Column("id")
    val quoteId: String,
    @Column("request_id")
    val requestId: String,
    @Column("supplier_profile_id")
    val supplierProfileId: String,
    @Column("unit_price_estimate")
    val unitPriceEstimate: String,
    @Column("moq")
    val moq: String,
    @Column("lead_time")
    val leadTime: String,
    @Column("sample_cost")
    val sampleCost: String?,
    @Column("note")
    val note: String?,
    @Column("state")
    val state: String,
    @Column("version")
    val version: Int,
    @Column("created_at")
    val createdAt: LocalDateTime,
    @Column("updated_at")
    val updatedAt: LocalDateTime,
) : Persistable<String> {
    @Transient
    var newEntity: Boolean = false

    override fun getId(): String = quoteId

    override fun isNew(): Boolean = newEntity
}
