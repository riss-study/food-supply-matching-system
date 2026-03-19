package dev.riss.fsm.command.supplier

import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Transient
import org.springframework.data.domain.Persistable
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.LocalDateTime

@Table("certification_record")
data class CertificationRecordEntity(
    @Id
    @Column("id")
    val recordId: String,
    @Column("supplier_profile_id")
    val supplierProfileId: String,
    @Column("type")
    val type: String,
    @Column("number")
    val number: String?,
    @Column("file_attachment_id")
    val fileAttachmentId: String,
    @Column("status")
    val status: String,
    @Column("created_at")
    val createdAt: LocalDateTime,
) : Persistable<String> {
    @Transient
    var newEntity: Boolean = false

    override fun getId(): String = recordId

    override fun isNew(): Boolean = newEntity
}
