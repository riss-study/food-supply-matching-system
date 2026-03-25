import { useMutation, useQueryClient } from "@tanstack/react-query"
import { revokeContactShare } from "../api/thread-api"

export function useRevokeContactShare(threadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => revokeContactShare(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads", "detail", threadId] })
      queryClient.invalidateQueries({ queryKey: ["threads", "list"] })
    },
  })
}
