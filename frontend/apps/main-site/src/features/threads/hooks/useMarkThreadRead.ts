import { useMutation, useQueryClient } from "@tanstack/react-query"
import { markThreadAsRead } from "../api/thread-api"

export function useMarkThreadRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markThreadAsRead,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["threads", "list"] })
      queryClient.invalidateQueries({ queryKey: ["threads", "detail", data.threadId] })
    },
  })
}
