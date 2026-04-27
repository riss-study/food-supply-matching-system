import { useEffect, useRef } from "react"
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
 * App 레벨에서 한 번만 호출. 로그인한 사용자만 stream 활성.
 *
 * **핵심 설계**: stream 은 **accessToken 변경 시에만** abort + 재구독.
 *   페이지 이동 / 다른 store 변경 등에는 영향 받지 않음. 이를 위해 모든 동적
 *   참조 (pathname / store action) 를 useRef 에 저장 → effect deps 최소화.
 *
 * 자기가 현재 보고 있는 thread 의 알림은 toast / unread 모두 생략.
 */
export function useNotificationStream() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const userId = useAuthStore((s) => s.user?.userId ?? null)
  const pushToast = useNotificationStore((s) => s.pushToast)
  const incrementUnread = useNotificationStore((s) => s.incrementUnread)
  const location = useLocation()

  // 모든 동적 값을 ref 로 보관 — onmessage 시점에 최신 값 참조.
  // ref 갱신은 별도 effect 라 stream effect 의 deps 안정.
  const pathnameRef = useRef(location.pathname)
  const pushToastRef = useRef(pushToast)
  const incrementUnreadRef = useRef(incrementUnread)
  useEffect(() => {
    pathnameRef.current = location.pathname
    pushToastRef.current = pushToast
    incrementUnreadRef.current = incrementUnread
  })

  useEffect(() => {
    if (!accessToken || !userId) return
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

          const onThisThread = pathnameRef.current === `/threads/${event.threadId}`
          if (onThisThread) return

          pushToastRef.current({
            id: event.messageId,
            threadId: event.threadId,
            threadTitle: event.threadTitle,
            senderDisplayName: event.senderDisplayName,
            preview: event.preview,
            sentAt: event.sentAt,
          })
          incrementUnreadRef.current(event.threadId)
        } catch {
          // 잘못된 JSON / heartbeat 등 무시
        }
      },
      onerror(err) {
        if (ctrl.signal.aborted) throw err
      },
    })

    return () => ctrl.abort()
  }, [accessToken, userId])   // accessToken / userId 만 deps. 그 외 변경엔 stream 유지.
}
