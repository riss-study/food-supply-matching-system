import { useMutation, useQueryClient } from "@tanstack/react-query"
import { revokeContactShare } from "../api/thread-api"
import { threadKeys } from "../query-keys"

export function useRevokeContactShare(threadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => revokeContactShare(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: threadKeys.detail(threadId) })
      queryClient.invalidateQueries({ queryKey: threadKeys.lists() })
    },
  })
}
