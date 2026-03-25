import { useMutation, useQueryClient } from "@tanstack/react-query"
import { approveContactShare } from "../api/thread-api"

export function useApproveContactShare(threadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => approveContactShare(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads", "detail", threadId] })
      queryClient.invalidateQueries({ queryKey: ["threads", "list"] })
    },
  })
}
