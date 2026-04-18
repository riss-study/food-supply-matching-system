import { useMutation, useQueryClient } from "@tanstack/react-query"
import { publishNotice } from "../api/notices-api"
import { adminNoticeKeys } from "../query-keys"

export function usePublishNotice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (noticeId: string) => publishNotice(noticeId),
    onSuccess: (_, noticeId) => {
      queryClient.invalidateQueries({ queryKey: adminNoticeKeys.all })
      queryClient.invalidateQueries({ queryKey: adminNoticeKeys.detail(noticeId) })
    },
  })
}
