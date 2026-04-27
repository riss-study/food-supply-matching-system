import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { fetchEventSource } from "@microsoft/fetch-event-source"
import type { ThreadSummary } from "@fsm/types"
import { useAuthStore } from "../../auth/store/auth-store"
import { useNotificationStore } from "../store/notification-store"
import { threadKeys } from "../../threads/query-keys"

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

interface ThreadListPage {
  items: ThreadSummary[]
  meta: unknown
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
  const queryClient = useQueryClient()
  const location = useLocation()

  // 모든 동적 값을 ref 로 보관 — onmessage 시점에 최신 값 참조.
  // ref 갱신은 별도 effect 라 stream effect 의 deps 안정.
  const pathnameRef = useRef(location.pathname)
  const pushToastRef = useRef(pushToast)
  const incrementUnreadRef = useRef(incrementUnread)
  const queryClientRef = useRef(queryClient)
  useEffect(() => {
    pathnameRef.current = location.pathname
    pushToastRef.current = pushToast
    incrementUnreadRef.current = incrementUnread
    queryClientRef.current = queryClient
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

          // 1) thread 목록 캐시 갱신 — 어느 페이지에 있든 (/threads, 대시보드 등) 항상.
          //    lastMessage / updatedAt 갱신 + 자기 thread 안에 있지 않으면 unreadCount +1.
          //    setQueriesData 의 prefix matching 으로 모든 list query (필터 무관) 에 적용.
          updateThreadListCache(queryClientRef.current, event, onThisThread)

          if (onThisThread) return

          // 2) toast + 글로벌 unread store 증가 (사이드바 뱃지 용).
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

/**
 * thread 목록 query cache 의 해당 thread item 을 갱신.
 *  - lastMessage 와 updatedAt 을 새 메시지로 업데이트
 *  - 자기 thread 안에 있지 않으면 unreadCount +1
 *  - updatedAt desc 정렬을 유지하기 위해 해당 item 을 맨 앞으로 이동
 */
function updateThreadListCache(
  queryClient: ReturnType<typeof useQueryClient>,
  event: NewMessageEvent,
  onThisThread: boolean,
) {
  queryClient.setQueriesData<ThreadListPage>(
    { queryKey: threadKeys.lists() },
    (old) => {
      if (!old) return old
      const idx = old.items.findIndex((t) => t.threadId === event.threadId)
      if (idx === -1) return old   // 해당 thread 가 현재 페이지 list 에 없음 (다른 페이지) — 무관
      const target = old.items[idx]
      const updated: ThreadSummary = {
        ...target,
        unreadCount: onThisThread ? target.unreadCount : target.unreadCount + 1,
        lastMessage: {
          messageId: event.messageId,
          senderUserId: event.senderUserId,
          body: event.preview || null,
          hasAttachments: false,   // notification 페이로드엔 첨부 정보 없음 — preview 가 placeholder 처리
          createdAt: event.sentAt,
        },
        updatedAt: event.sentAt,
      }
      // 갱신된 thread 를 맨 앞으로 이동 (최근 메시지 thread 정렬 유지)
      const items = [updated, ...old.items.slice(0, idx), ...old.items.slice(idx + 1)]
      return { ...old, items }
    },
  )
}
