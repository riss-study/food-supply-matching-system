import { useMutation, useQueryClient } from "@tanstack/react-query"
import { archiveNotice } from "../api/notices-api"

export function useArchiveNotice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (noticeId: string) => archiveNotice(noticeId),
    onSuccess: (_, noticeId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-notices"] })
      queryClient.invalidateQueries({ queryKey: ["admin-notice-detail", noticeId] })
    },
  })
}
