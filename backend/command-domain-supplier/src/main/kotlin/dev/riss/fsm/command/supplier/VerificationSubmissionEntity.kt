package dev.riss.fsm.command.supplier

import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Transient
import org.springframework.data.domain.Persistable
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.LocalDateTime

@Table("verification_submission")
data class VerificationSubmissionEntity(
    @Id
    @Column("id")
    val submissionId: String,
    @Column("supplier_profile_id")
    val supplierProfileId: String,
    @Column("state")
    val state: String,
    @Column("submitted_at")
    val submittedAt: LocalDateTime,
    @Column("reviewed_at")
    val reviewedAt: LocalDateTime?,
    @Column("reviewed_by")
    val reviewedBy: String?,
    @Column("review_note_internal")
    val reviewNoteInternal: String?,
    @Column("review_note_public")
    val reviewNotePublic: String?,
) : Persistable<String> {
    @Transient
    var newEntity: Boolean = false

    override fun getId(): String = submissionId

    override fun isNew(): Boolean = newEntity
}
