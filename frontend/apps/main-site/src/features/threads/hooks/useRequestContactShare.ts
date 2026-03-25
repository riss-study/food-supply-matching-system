import { useMutation, useQueryClient } from "@tanstack/react-query"
import { requestContactShare } from "../api/thread-api"

export function useRequestContactShare(threadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => requestContactShare(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads", "detail", threadId] })
      queryClient.invalidateQueries({ queryKey: ["threads", "list"] })
    },
  })
}
