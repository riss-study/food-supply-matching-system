import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import type { ThreadDetail, ThreadMessage } from "@fsm/types"
import { getThreadDetail, type ThreadDetailParams } from "../api/thread-api"
import { threadKeys } from "../query-keys"

export function useThreadDetail(threadId: string, params: ThreadDetailParams = {}) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: threadKeys.detailWith(threadId, { ...params }),
    queryFn: () => getThreadDetail(threadId, params),
    enabled: Boolean(threadId),
  })

  const addMessageToCache = useCallback(
    (message: ThreadMessage) => {
      queryClient.setQueryData<ThreadDetail>(threadKeys.detail(threadId), (old) => {
        if (!old) return old
        // dedup: 같은 messageId 이미 있으면 무시.
        // 자기 메시지 send POST 의 onSuccess 와 SSE echo 가 중복 도달하는 케이스 방지.
        if (old.messages.some((m) => m.messageId === message.messageId)) return old
        return {
          ...old,
          messages: [...old.messages, message],
          updatedAt: message.createdAt,
        }
      })
    },
    [queryClient, threadId],
  )

  const invalidateThreadDetail = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: threadKeys.detail(threadId) })
  }, [queryClient, threadId])

  return {
    ...query,
    addMessageToCache,
    invalidateThreadDetail,
  }
}
