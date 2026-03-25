package dev.riss.fsm.command.notice

import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Transient
import org.springframework.data.domain.Persistable
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.LocalDateTime

@Table("notice")
data class NoticeEntity(
    @Id
    @Column("id")
    val noticeId: String,
    @Column("title")
    val title: String,
    @Column("body")
    val body: String,
    @Column("state")
    val state: String, // draft | published | archived
    @Column("author_id")
    val authorId: String,
    @Column("published_at")
    val publishedAt: LocalDateTime?,
    @Column("view_count")
    val viewCount: Long,
    @Column("created_at")
    val createdAt: LocalDateTime,
    @Column("updated_at")
    val updatedAt: LocalDateTime,
) : Persistable<String> {
    @Transient
    var newEntity: Boolean = false

    override fun getId(): String = noticeId

    override fun isNew(): Boolean = newEntity
}
