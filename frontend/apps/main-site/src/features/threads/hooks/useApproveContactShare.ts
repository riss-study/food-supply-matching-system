import { useMutation, useQueryClient } from "@tanstack/react-query"
import { approveContactShare } from "../api/thread-api"
import { threadKeys } from "../query-keys"

export function useApproveContactShare(threadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => approveContactShare(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: threadKeys.detail(threadId) })
      queryClient.invalidateQueries({ queryKey: threadKeys.lists() })
    },
  })
}
