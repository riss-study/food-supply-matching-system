import { useMutation, useQueryClient } from "@tanstack/react-query"
import { archiveNotice } from "../api/notices-api"
import { adminNoticeKeys } from "../query-keys"

export function useArchiveNotice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (noticeId: string) => archiveNotice(noticeId),
    onSuccess: (_, noticeId) => {
      queryClient.invalidateQueries({ queryKey: adminNoticeKeys.all })
      queryClient.invalidateQueries({ queryKey: adminNoticeKeys.detail(noticeId) })
    },
  })
}
