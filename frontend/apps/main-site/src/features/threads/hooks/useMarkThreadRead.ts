import { useMutation, useQueryClient } from "@tanstack/react-query"
import { markThreadAsRead } from "../api/thread-api"
import { threadKeys } from "../query-keys"

export function useMarkThreadRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markThreadAsRead,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: threadKeys.lists() })
      queryClient.invalidateQueries({ queryKey: threadKeys.detail(data.threadId) })
    },
  })
}
