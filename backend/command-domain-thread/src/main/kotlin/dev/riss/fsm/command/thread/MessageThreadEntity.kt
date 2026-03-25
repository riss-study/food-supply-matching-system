package dev.riss.fsm.command.thread

import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Transient
import org.springframework.data.domain.Persistable
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.LocalDateTime

@Table("message_thread")
data class MessageThreadEntity(
    @Id
    @Column("id")
    val threadId: String,
    @Column("request_id")
    val requestId: String,
    @Column("requester_user_id")
    val requesterUserId: String,
    @Column("supplier_profile_id")
    val supplierProfileId: String,
    @Column("quote_id")
    val quoteId: String?,
    @Column("contact_share_state")
    val contactShareState: String = "not_requested",
    @Column("contact_share_requested_by_role")
    val contactShareRequestedByRole: String? = null,
    @Column("contact_share_requested_at")
    val contactShareRequestedAt: LocalDateTime? = null,
    @Column("contact_share_requester_approved_at")
    val contactShareRequesterApprovedAt: LocalDateTime? = null,
    @Column("contact_share_supplier_approved_at")
    val contactShareSupplierApprovedAt: LocalDateTime? = null,
    @Column("contact_share_revoked_by_role")
    val contactShareRevokedByRole: String? = null,
    @Column("contact_share_revoked_at")
    val contactShareRevokedAt: LocalDateTime? = null,
    @Column("created_at")
    val createdAt: LocalDateTime,
) : Persistable<String> {
    @Transient
    var newEntity: Boolean = false

    override fun getId(): String = threadId

    override fun isNew(): Boolean = newEntity
}
