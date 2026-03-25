package dev.riss.fsm.command.thread

import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Transient
import org.springframework.data.domain.Persistable
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.LocalDateTime

@Table("thread_message")
data class MessageEntity(
    @Id
    @Column("id")
    val messageId: String,
    @Column("thread_id")
    val threadId: String,
    @Column("sender_user_id")
    val senderUserId: String,
    @Column("body")
    val body: String?,
    @Column("attachment_ids")
    val attachmentIds: String?,
    @Column("created_at")
    val createdAt: LocalDateTime,
) : Persistable<String> {
    @Transient
    var newEntity: Boolean = false

    override fun getId(): String = messageId

    override fun isNew(): Boolean = newEntity

    fun getAttachmentIdList(): List<String> {
        return attachmentIds?.split(",")?.filter { it.isNotBlank() } ?: emptyList()
    }
}