import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { fetchEventSource } from "@microsoft/fetch-event-source"
import { useAuthStore } from "../../auth/store/auth-store"
import { useNotificationStore } from "../store/notification-store"

interface NewMessageEvent {
  type: "NewMessage"
  threadId: string
  threadTitle: string
  senderUserId: string
  senderDisplayName: string
  preview: string
  messageId: string
  sentAt: string
}

/**
 * 글로벌 알림 SSE stream 구독.
 *
 * App 레벨 (모든 페이지) 에서 한 번만 호출. 로그인한 사용자만 stream 활성.
 * - 자기가 현재 보고 있는 thread 의 알림은 toast 와 unread 모두 생략 (이미 화면에 보임).
 * - 그 외엔 toast push + unread 증가.
 */
export function useNotificationStream() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const pushToast = useNotificationStore((s) => s.pushToast)
  const incrementUnread = useNotificationStore((s) => s.incrementUnread)
  const location = useLocation()

  useEffect(() => {
    if (!accessToken || !user) return
    const ctrl = new AbortController()

    fetchEventSource("/api/notifications/stream", {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: ctrl.signal,
      openWhenHidden: true,
      async onopen(res) {
        if (res.ok && res.headers.get("content-type")?.includes("text/event-stream")) return
        throw new Error(`Notification stream open failed: ${res.status}`)
      },
      onmessage(ev) {
        if (!ev.data) return
        try {
          const event = JSON.parse(ev.data) as NewMessageEvent
          if (event.type !== "NewMessage") return

          // 현재 보고 있는 thread 의 알림이면 toast / unread 모두 생략
          const onThisThread = location.pathname === `/threads/${event.threadId}`
          if (onThisThread) return

          pushToast({
            id: event.messageId,
            threadId: event.threadId,
            threadTitle: event.threadTitle,
            senderDisplayName: event.senderDisplayName,
            preview: event.preview,
            sentAt: event.sentAt,
          })
          incrementUnread(event.threadId)
        } catch {
          // 잘못된 JSON / heartbeat 등 무시
        }
      },
      onerror(err) {
        // 의도적 abort 면 throw → polyfill 영구 종료. 그 외는 자동 재연결.
        if (ctrl.signal.aborted) throw err
      },
    })

    return () => ctrl.abort()
  }, [accessToken, user, pushToast, incrementUnread, location.pathname])
}
