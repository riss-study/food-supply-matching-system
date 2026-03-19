package dev.riss.fsm.command.user

import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Transient
import org.springframework.data.domain.Persistable
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.LocalDateTime

@Table("business_profile")
data class BusinessProfileEntity(
    @Id
    @Column("id")
    val profileId: String,
    @Column("user_account_id")
    val userAccountId: String,
    @Column("business_name")
    val businessName: String,
    @Column("business_registration_number")
    val businessRegistrationNumber: String,
    @Column("contact_name")
    val contactName: String,
    @Column("contact_phone")
    val contactPhone: String,
    @Column("contact_email")
    val contactEmail: String,
    @Column("verification_scope")
    val verificationScope: String,
    @Column("approval_state")
    val approvalState: String,
    @Column("submitted_at")
    val submittedAt: LocalDateTime?,
    @Column("approved_at")
    val approvedAt: LocalDateTime?,
    @Column("rejected_at")
    val rejectedAt: LocalDateTime?,
    @Column("rejection_reason")
    val rejectionReason: String?,
    @Column("updated_at")
    val updatedAt: LocalDateTime,
    @Column("created_at")
    val createdAt: LocalDateTime,
) : Persistable<String> {
    @Transient
    var newEntity: Boolean = false

    override fun getId(): String = profileId

    override fun isNew(): Boolean = newEntity
}
