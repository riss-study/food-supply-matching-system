package dev.riss.fsm.command.notice

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import reactor.core.publisher.Mono
import java.time.LocalDateTime
import java.util.UUID

@Service
class NoticeCommandService(
    private val noticeRepository: NoticeRepository,
) {

    @Transactional
    fun createNotice(
        title: String,
        body: String,
        authorId: String,
        initialState: String = "draft",
        publishImmediately: Boolean = false,
    ): Mono<NoticeEntity> {
        val now = LocalDateTime.now()
        val state = when {
            publishImmediately || initialState == "published" -> "published"
            initialState == "draft" -> "draft"
            else -> throw IllegalArgumentException("Invalid state: $initialState")
        }
        val publishedAt = if (state == "published") now else null

        val notice = NoticeEntity(
            noticeId = generateId(),
            title = title,
            body = body,
            state = state,
            authorId = authorId,
            publishedAt = publishedAt,
            viewCount = 0,
            createdAt = now,
            updatedAt = now,
        )
        notice.newEntity = true

        return noticeRepository.save(notice)
    }

    @Transactional
    fun updateNotice(
        noticeId: String,
        title: String?,
        body: String?,
    ): Mono<NoticeEntity> {
        return noticeRepository.findById(noticeId)
            .flatMap { existing ->
                val updated = existing.copy(
                    title = title ?: existing.title,
                    body = body ?: existing.body,
                    updatedAt = LocalDateTime.now(),
                )
                noticeRepository.save(updated)
            }
    }

    @Transactional
    fun publishNotice(noticeId: String): Mono<NoticeEntity> {
        return noticeRepository.findById(noticeId)
            .flatMap { existing ->
                val updated = existing.copy(
                    state = "published",
                    publishedAt = existing.publishedAt ?: LocalDateTime.now(),
                    updatedAt = LocalDateTime.now(),
                )
                noticeRepository.save(updated)
            }
    }

    @Transactional
    fun archiveNotice(noticeId: String): Mono<NoticeEntity> {
        return noticeRepository.findById(noticeId)
            .flatMap { existing ->
                val updated = existing.copy(
                    state = "archived",
                    updatedAt = LocalDateTime.now(),
                )
                noticeRepository.save(updated)
            }
    }

    @Transactional
    fun changeState(noticeId: String, newState: String): Mono<NoticeEntity> {
        return when (newState) {
            "draft" -> noticeRepository.findById(noticeId)
                .flatMap { existing ->
                    val updated = existing.copy(
                        state = "draft",
                        publishedAt = null,
                        updatedAt = LocalDateTime.now(),
                    )
                    noticeRepository.save(updated)
                }
            "published" -> publishNotice(noticeId)
            "archived" -> archiveNotice(noticeId)
            else -> Mono.error(IllegalArgumentException("Invalid state: $newState"))
        }
    }

    private fun generateId(): String = "notc_${UUID.randomUUID().toString().replace("-", "").substring(0, 16)}"
}
