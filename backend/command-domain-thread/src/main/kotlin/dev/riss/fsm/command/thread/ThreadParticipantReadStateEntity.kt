package dev.riss.fsm.command.thread

import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Transient
import org.springframework.data.domain.Persistable
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.LocalDateTime

@Table("thread_participant_read_state")
data class ThreadParticipantReadStateEntity(
    @Id
    @Column("id")
    val readStateId: String,
    @Column("thread_id")
    val threadId: String,
    @Column("user_id")
    val userId: String,
    @Column("last_read_at")
    val lastReadAt: LocalDateTime,
) : Persistable<String> {
    @Transient
    var newEntity: Boolean = false

    override fun getId(): String = readStateId

    override fun isNew(): Boolean = newEntity
}