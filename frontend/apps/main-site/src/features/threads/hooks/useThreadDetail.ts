import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import type { ThreadDetail, ThreadMessage } from "@fsm/types"
import { getThreadDetail, type ThreadDetailParams } from "../api/thread-api"

export function useThreadDetail(threadId: string, params: ThreadDetailParams = {}) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["threads", "detail", threadId, params],
    queryFn: () => getThreadDetail(threadId, params),
    enabled: Boolean(threadId),
  })

  const addMessageToCache = useCallback(
    (message: ThreadMessage) => {
      queryClient.setQueryData<ThreadDetail>(["threads", "detail", threadId], (old) => {
        if (!old) return old
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
    queryClient.invalidateQueries({ queryKey: ["threads", "detail", threadId] })
  }, [queryClient, threadId])

  return {
    ...query,
    addMessageToCache,
    invalidateThreadDetail,
  }
}
