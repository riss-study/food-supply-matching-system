package dev.riss.fsm.command.request

import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Transient
import org.springframework.data.domain.Persistable
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.LocalDateTime

@Table("targeted_supplier_link")
data class TargetedSupplierLinkEntity(
    @Id
    @Column("id")
    val linkId: String,
    @Column("request_id")
    val requestId: String,
    @Column("supplier_profile_id")
    val supplierProfileId: String,
    @Column("created_at")
    val createdAt: LocalDateTime,
) : Persistable<String> {
    @Transient
    var newEntity: Boolean = false

    override fun getId(): String = linkId

    override fun isNew(): Boolean = newEntity
}
