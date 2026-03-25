import { useMutation, useQueryClient } from "@tanstack/react-query"
import { publishNotice } from "../api/notices-api"

export function usePublishNotice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (noticeId: string) => publishNotice(noticeId),
    onSuccess: (_, noticeId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-notices"] })
      queryClient.invalidateQueries({ queryKey: ["admin-notice-detail", noticeId] })
    },
  })
}
