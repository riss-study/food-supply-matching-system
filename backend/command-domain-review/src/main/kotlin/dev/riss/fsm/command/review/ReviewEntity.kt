package dev.riss.fsm.command.review

import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Transient
import org.springframework.data.domain.Persistable
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.LocalDateTime

@Table("review")
data class ReviewEntity(
    @Id
    @Column("id")
    val reviewId: String,
    @Column("requester_user_id")
    val requesterUserId: String,
    @Column("supplier_profile_id")
    val supplierProfileId: String,
    @Column("request_id")
    val requestId: String,
    @Column("quote_id")
    val quoteId: String,
    @Column("rating")
    val rating: Int,
    @Column("text")
    val text: String?,
    @Column("hidden")
    val hidden: Boolean,
    @Column("version")
    val version: Int,
    @Column("created_at")
    val createdAt: LocalDateTime,
    @Column("updated_at")
    val updatedAt: LocalDateTime,
) : Persistable<String> {
    @Transient
    var newEntity: Boolean = false

    override fun getId(): String = reviewId

    override fun isNew(): Boolean = newEntity
}
