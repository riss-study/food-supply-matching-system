package dev.riss.fsm.api.notification

import java.time.Instant

/**
 * 사용자별 글로벌 알림 stream 으로 push 되는 이벤트.
 * sealed class — 미래 확장 (NewQuote, ReviewApproved, AdminAnnouncement 등) 시 분기 누락 컴파일 검출.
 */
sealed class NotificationStreamEvent {
    abstract val type: String
    abstract fun eventIdOrNull(): String?

    /**
     * 다른 사용자가 보낸 새 thread 메시지 알림 (자기 메시지는 발행 대상에서 제외).
     * 페이로드는 toast 표시용 가벼운 메타데이터 — body / attachments 의 상세 정보는 의도적으로 생략.
     */
    data class NewMessage(
        val threadId: String,
        val threadTitle: String,
        val senderUserId: String,
        val senderDisplayName: String,
        val preview: String,
        val messageId: String,
        val sentAt: Instant,
    ) : NotificationStreamEvent() {
        override val type = "NewMessage"
        override fun eventIdOrNull() = messageId
    }
}
