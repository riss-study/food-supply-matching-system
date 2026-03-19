package dev.riss.fsm.command.supplier

import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Transient
import org.springframework.data.domain.Persistable
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.LocalDateTime

@Table("audit_log")
data class AuditLogEntity(
    @Id
    @Column("id")
    val auditLogId: String,
    @Column("actor_user_id")
    val actorUserId: String,
    @Column("action_type")
    val actionType: String,
    @Column("target_type")
    val targetType: String,
    @Column("target_id")
    val targetId: String,
    @Column("payload_snapshot")
    val payloadSnapshot: String,
    @Column("created_at")
    val createdAt: LocalDateTime,
) : Persistable<String> {
    @Transient
    var newEntity: Boolean = false

    override fun getId(): String = auditLogId

    override fun isNew(): Boolean = newEntity
}
