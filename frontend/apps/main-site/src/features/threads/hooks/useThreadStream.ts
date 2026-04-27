import { useEffect, useRef } from "react"
import { fetchEventSource } from "@microsoft/fetch-event-source"
import type { ThreadMessage } from "@fsm/types"
import { useAuthStore } from "../../auth/store/auth-store"

/**
 * Thread 의 실시간 이벤트 SSE stream 구독.
 *
 * - native EventSource 가 Authorization 헤더를 못 보내서 fetchEventSource polyfill 사용.
 * - dedup / updatedAt 갱신은 호출자가 넘긴 addMessageToCache (useThreadDetail) 가 처리.
 * - threadId / accessToken 변경 시에만 abort + 재구독. addMessageToCache 같은 callback
 *   reference 변경에는 영향 받지 않음 (ref 로 보관).
 */
export function useThreadStream(
  threadId: string,
  addMessageToCache: (message: ThreadMessage) => void,
) {
  const accessToken = useAuthStore((s) => s.accessToken)

  // callback reference 변경에 stream 흔들리지 않게 ref 로 보관.
  const addMessageRef = useRef(addMessageToCache)
  useEffect(() => {
    addMessageRef.current = addMessageToCache
  })

  useEffect(() => {
    if (!threadId || !accessToken) return
    const ctrl = new AbortController()

    fetchEventSource(`/api/threads/${threadId}/stream`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: ctrl.signal,
      openWhenHidden: true,
      async onopen(res) {
        if (res.ok && res.headers.get("content-type")?.includes("text/event-stream")) return
        throw new Error(`SSE open failed: ${res.status}`)
      },
      onmessage(ev) {
        if (!ev.data) return
        try {
          const event = JSON.parse(ev.data)
          if (event.type === "NewMessage") {
            addMessageRef.current(event.message as ThreadMessage)
          }
        } catch {
          // 잘못된 JSON 무시 (heartbeat 등)
        }
      },
      onerror(err) {
        if (ctrl.signal.aborted) throw err
      },
    })

    return () => ctrl.abort()
  }, [threadId, accessToken])
}
