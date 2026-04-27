package dev.riss.fsm.api.thread

/**
 * Thread stream 으로 push 되는 이벤트.
 *
 * sealed class — 미래 확장 시 (TypingIndicator, ContactShareUpdate 등) 컴파일러가 분기 누락 검출.
 *
 * `eventIdOrNull` 은 SSE `id:` 헤더 용. NewMessage 면 messageId 반환 → 클라이언트의 polyfill 이
 * `lastEventId` 로 보관, 재연결 시 `Last-Event-ID` 헤더로 전송. heartbeat 등 dedup 무관 이벤트는 null.
 */
sealed class ThreadStreamEvent {
    abstract val type: String
    abstract fun eventIdOrNull(): String?

    data class NewMessage(
        val message: ThreadMessageResponse,
    ) : ThreadStreamEvent() {
        override val type = "NewMessage"
        override fun eventIdOrNull() = message.messageId
    }
    // 미래 확장: TypingIndicator, ContactShareUpdate 등
}
