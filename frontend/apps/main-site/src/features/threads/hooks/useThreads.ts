import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import type { ThreadSummary } from "@fsm/types"
import { getThreadList, type ThreadListParams } from "../api/thread-api"

export function useThreads(params: ThreadListParams = {}) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["threads", "list", params],
    queryFn: () => getThreadList(params),
  })

  const invalidateThreads = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["threads", "list"] })
  }, [queryClient])

  const updateThreadInCache = useCallback(
    (threadId: string, updater: (thread: ThreadSummary) => ThreadSummary) => {
      queryClient.setQueriesData<{ items: ThreadSummary[]; meta: unknown }>(
        { queryKey: ["threads", "list"] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            items: old.items.map((thread) =>
              thread.threadId === threadId ? updater(thread) : thread,
            ),
          }
        },
      )
    },
    [queryClient],
  )

  const setThreadAsRead = useCallback(
    (threadId: string) => {
      updateThreadInCache(threadId, (thread) => ({
        ...thread,
        unreadCount: 0,
      }))
    },
    [updateThreadInCache],
  )

  const decrementUnreadCount = useCallback(
    (threadId: string) => {
      updateThreadInCache(threadId, (thread) => ({
        ...thread,
        unreadCount: Math.max(0, thread.unreadCount - 1),
      }))
    },
    [updateThreadInCache],
  )

  return {
    ...query,
    invalidateThreads,
    updateThreadInCache,
    setThreadAsRead,
    decrementUnreadCount,
  }
}
