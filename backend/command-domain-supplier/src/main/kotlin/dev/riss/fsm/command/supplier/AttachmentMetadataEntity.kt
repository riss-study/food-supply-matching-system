package dev.riss.fsm.command.supplier

import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Transient
import org.springframework.data.domain.Persistable
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.LocalDateTime

@Table("attachment_metadata")
data class AttachmentMetadataEntity(
    @Id
    @Column("id")
    val attachmentId: String,
    @Column("owner_type")
    val ownerType: String,
    @Column("owner_id")
    val ownerId: String,
    @Column("attachment_kind")
    val attachmentKind: String,
    @Column("file_name")
    val fileName: String,
    @Column("content_type")
    val contentType: String,
    @Column("file_size")
    val fileSize: Long,
    @Column("storage_key")
    val storageKey: String,
    @Column("created_at")
    val createdAt: LocalDateTime,
) : Persistable<String> {
    @Transient
    var newEntity: Boolean = false

    override fun getId(): String = attachmentId
    override fun isNew(): Boolean = newEntity
}
