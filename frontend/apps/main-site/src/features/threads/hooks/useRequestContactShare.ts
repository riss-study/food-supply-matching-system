import { useMutation, useQueryClient } from "@tanstack/react-query"
import { requestContactShare } from "../api/thread-api"
import { threadKeys } from "../query-keys"

export function useRequestContactShare(threadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => requestContactShare(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: threadKeys.detail(threadId) })
      queryClient.invalidateQueries({ queryKey: threadKeys.lists() })
    },
  })
}
