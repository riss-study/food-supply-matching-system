import { useEffect } from "react"
import { fetchEventSource } from "@microsoft/fetch-event-source"
import type { ThreadMessage } from "@fsm/types"
import { useAuthStore } from "../../auth/store/auth-store"

/**
 * Thread 의 실시간 이벤트 SSE stream 구독.
 *
 * - native EventSource 가 Authorization 헤더를 못 보내서 fetchEventSource polyfill 사용.
 * - dedup / updatedAt 갱신은 호출자가 넘긴 addMessageToCache (useThreadDetail) 가 처리.
 * - accessToken 갱신 / threadId 변경 시 useEffect deps 재발화 → 자동 abort + 재구독.
 */
export function useThreadStream(
  threadId: string,
  addMessageToCache: (message: ThreadMessage) => void,
) {
  const accessToken = useAuthStore((s) => s.accessToken)

  useEffect(() => {
    if (!threadId || !accessToken) return
    const ctrl = new AbortController()

    fetchEventSource(`/api/threads/${threadId}/stream`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: ctrl.signal,
      // 페이지 hidden (다른 탭 활성) 시에도 stream 유지.
      openWhenHidden: true,
      async onopen(res) {
        if (res.ok && res.headers.get("content-type")?.includes("text/event-stream")) return
        // 401/403/404 등 → throw 하면 onerror 호출 → 자동 재연결 안 함 (logout 시 재구독 X).
        throw new Error(`SSE open failed: ${res.status}`)
      },
      onmessage(ev) {
        if (!ev.data) return
        try {
          const event = JSON.parse(ev.data)
          if (event.type === "NewMessage") {
            addMessageToCache(event.message as ThreadMessage)
          }
        } catch {
          // 잘못된 JSON 무시 (heartbeat 등)
        }
      },
      onerror(err) {
        // 의도적 abort 면 throw → polyfill 영구 종료. 그 외 undefined 반환 → 점진적 backoff 재연결.
        if (ctrl.signal.aborted) throw err
      },
    })

    return () => ctrl.abort()
  }, [threadId, accessToken, addMessageToCache])
}
